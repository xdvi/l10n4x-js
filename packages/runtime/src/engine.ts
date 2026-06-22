import initWasm, {
  l10n4x_clear,
  l10n4x_load_namespace_bytes,
  l10n4x_load_pak_bytes,
  l10n4x_on_locale_changed,
  l10n4x_ota_can_rollback,
  l10n4x_ota_reload_pak,
  l10n4x_ota_rollback,
  l10n4x_set_decrypt_key,
  l10n4x_set_fallback_locale,
  l10n4x_set_verify_key,
  l10n4x_translate,
  l10n4x_translate_with_params,
} from "@l10n4x/wasm";

import { fetchNamespaceManifest, namespacesForLocale } from "./manifest.js";
import { fetchNamespacePakLoader, resolveLoader } from "./loaders.js";
import type { InitializeOptions, L10nConfig, L10nInstance, LocaleKey } from "./types.js";

const CACHE_PREFIX = "l10n4x_pak_";

function hexToBytes(hex: string): Uint8Array {
  if (hex.length !== 64) {
    throw new Error("l10n4x: verifyPublicKey must be 64 hex characters");
  }
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function normalizeLocale(locale: string): string {
  return locale.toLowerCase().trim();
}

function cacheKey(outputDir: string, locale: string, namespace?: string): string {
  return namespace
    ? `${CACHE_PREFIX}${outputDir}:${locale}:${namespace}`
    : `${CACHE_PREFIX}${outputDir}:${locale}`;
}

function readEnv(name: string): string | undefined {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return proc?.env?.[name];
}

function loadDecryptKey(config: L10nConfig, override?: Uint8Array): Uint8Array | undefined {
  if (!config.encrypt) return undefined;
  if (override && override.length === 32) return override;
  const envName = config.encryptKeyEnv ?? "L10N4X_ENCRYPT_KEY";
  const raw = readEnv(envName);
  if (raw) {
    if (raw.length !== 32) {
      throw new Error(`l10n4x: ${envName} must be exactly 32 bytes`);
    }
    return new TextEncoder().encode(raw);
  }
  throw new Error("l10n4x: decrypt key required (pass decryptKey or set env)");
}

function isModular(config: L10nConfig): boolean {
  return config.bundles?.mode === "modular";
}

/** Creates an isolated l10n4x runtime instance (WASM singleton — one active engine per process). */
export function createL10n(config: L10nConfig): L10nInstance {
  let initialized = false;
  let fallback = config.fallback;
  let outputDir = config.outputDir;
  let loader = resolveLoader(config.loader);
  let modular = isModular(config);
  let activeLocale = fallback;
  const loadedLocales = new Set<string>();
  const loadedNamespaces = new Set<string>();
  const localeListeners = new Set<(locale: string) => void>();
  let wasmInit: Promise<void> | null = null;
  let manifestPreload: string[] | undefined = config.bundles?.preload;

  const nsKey = (locale: string, namespace: string) => `${locale}:${namespace}`;

  const notifyLocale = (locale: string) => {
    for (const fn of localeListeners) fn(locale);
  };

  const ensureWasm = async (wasmUrl?: InitializeOptions["wasmUrl"]) => {
    if (!wasmInit) {
      wasmInit = initWasm(wasmUrl ?? config.wasmUrl).then(() => undefined);
    }
    await wasmInit;
  };

  const readCache = (key: string): Uint8Array | null => {
    if (typeof localStorage === "undefined") return null;
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    try {
      const parsed = JSON.parse(cached) as number[];
      return new Uint8Array(parsed);
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  };

  const writeCache = (key: string, bytes: Uint8Array) => {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(Array.from(bytes)));
    } catch {
      // quota exceeded — ignore
    }
  };

  const clearLocaleCache = (locale: string, namespaces?: string[]) => {
    if (typeof localStorage === "undefined") return;
    if (namespaces) {
      for (const ns of namespaces) {
        localStorage.removeItem(cacheKey(outputDir, locale, ns));
      }
    } else {
      localStorage.removeItem(cacheKey(outputDir, locale));
    }
  };

  const loadNamespacePak = async (
    locale: string,
    namespace: string,
  ): Promise<boolean> => {
    const normalized = normalizeLocale(locale);
    const key = nsKey(normalized, namespace);
    if (loadedNamespaces.has(key)) return true;

    const nsLoader = fetchNamespacePakLoader(namespace);
    const cache = cacheKey(outputDir, normalized, namespace);
    const cached = readCache(cache);
    if (cached) {
      l10n4x_load_namespace_bytes(cached, normalized, namespace);
      loadedNamespaces.add(key);
      return true;
    }

    const bytes = await nsLoader(normalized, outputDir);
    l10n4x_load_namespace_bytes(bytes, normalized, namespace);
    loadedNamespaces.add(key);
    writeCache(cache, bytes);
    return true;
  };

  const loadMonolithLocale = async (locale: string): Promise<boolean> => {
    const normalized = normalizeLocale(locale);
    if (loadedLocales.has(normalized)) return true;

    const cache = cacheKey(outputDir, normalized);
    const cached = readCache(cache);
    if (cached) {
      l10n4x_load_pak_bytes(cached, normalized);
      loadedLocales.add(normalized);
      return true;
    }

    const bytes = await loader(normalized, outputDir);
    l10n4x_load_pak_bytes(bytes, normalized);
    loadedLocales.add(normalized);
    writeCache(cache, bytes);
    return true;
  };

  const loadModularLocale = async (locale: string): Promise<boolean> => {
    const normalized = normalizeLocale(locale);
    const manifest = await fetchNamespaceManifest(outputDir);
    if (!manifest) {
      throw new Error(
        `l10n4x: modular mode requires namespaces.json under '${outputDir}'`,
      );
    }
    const namespaces = namespacesForLocale(manifest, normalized, manifestPreload);
    if (namespaces.length === 0) {
      throw new Error(`l10n4x: no namespaces listed for locale '${normalized}'`);
    }
    await Promise.all(namespaces.map((ns) => loadNamespacePak(normalized, ns)));
    loadedLocales.add(normalized);
    return true;
  };

  const loadLocaleWithCache = async (locale: string): Promise<boolean> => {
    if (modular) {
      return loadModularLocale(locale);
    }
    return loadMonolithLocale(locale);
  };

  return {
    async initialize(options?: InitializeOptions) {
      if (initialized) return;

      fallback = options?.fallbackLocale ?? fallback;
      outputDir = options?.localesPath ?? outputDir;
      loader = resolveLoader(options?.loader ?? config.loader);
      modular = isModular(config);
      activeLocale = fallback;

      await ensureWasm(options?.wasmUrl);
      l10n4x_set_verify_key(hexToBytes(config.verifyPublicKey));

      const decrypt = loadDecryptKey(config, options?.decryptKey);
      if (decrypt) {
        l10n4x_set_decrypt_key(decrypt);
      }

      l10n4x_set_fallback_locale(fallback);

      if (typeof l10n4x_on_locale_changed === "function") {
        l10n4x_on_locale_changed((locale: string) => {
          notifyLocale(locale);
        });
      }

      initialized = true;
      await loadLocaleWithCache(fallback);
    },

    async loadLocale(locale: string) {
      if (!initialized) throw new Error("l10n4x: call initialize() first");
      return loadLocaleWithCache(locale);
    },

    async loadNamespace(locale: string, namespace: string) {
      if (!initialized) throw new Error("l10n4x: call initialize() first");
      if (!modular) {
        throw new Error("l10n4x: loadNamespace requires bundles.mode = 'modular'");
      }
      const ok = await loadNamespacePak(locale, namespace);
      loadedLocales.add(normalizeLocale(locale));
      return ok;
    },

    t(locale: string, key: LocaleKey, params?: Record<string, string | number>) {
      if (!initialized) throw new Error("l10n4x: call initialize() first");

      const normalized = normalizeLocale(locale || fallback);
      if (!loadedLocales.has(normalized)) {
        void loadLocaleWithCache(normalized);
      }

      if (!params || Object.keys(params).length === 0) {
        return l10n4x_translate(normalized, key);
      }

      const keys = Object.keys(params);
      const values = keys.map((k) => String(params[k]));
      return l10n4x_translate_with_params(normalized, key, keys, values);
    },

    clear() {
      l10n4x_clear();
      loadedLocales.clear();
      loadedNamespaces.clear();
      initialized = false;
      wasmInit = null;
      notifyLocale("*");
    },

    connectDevServer(baseUrl: string, locales: string[]) {
      const url = `${baseUrl.replace(/\/$/, "")}/events`;
      const es = new EventSource(url);
      es.onmessage = async () => {
        loadedLocales.clear();
        loadedNamespaces.clear();
        if (typeof localStorage !== "undefined") {
          for (const locale of locales) {
            clearLocaleCache(locale);
          }
        }
        await Promise.all(locales.map((l) => loadLocaleWithCache(l)));
        notifyLocale(activeLocale);
      };
      es.onerror = () => {
        console.warn("[l10n4x] dev server connection lost");
      };
      return () => es.close();
    },

    onLocaleChanged(listener: (locale: string) => void) {
      localeListeners.add(listener);
      return () => localeListeners.delete(listener);
    },

    getLocale() {
      return activeLocale;
    },

    setLocale(locale: string) {
      activeLocale = locale;
      notifyLocale(locale);
    },

    isInitialized() {
      return initialized;
    },

    getLoadedLocales() {
      return loadedLocales;
    },

    getLoadedNamespaces() {
      return loadedNamespaces;
    },

    async otaReload(locale: string, pakBytes: Uint8Array) {
      if (!initialized) throw new Error("l10n4x: call initialize() first");
      if (modular) {
        throw new Error("l10n4x: use otaReloadNamespace in modular mode");
      }
      const normalized = normalizeLocale(locale);
      await l10n4x_ota_reload_pak(normalized, pakBytes);
      clearLocaleCache(normalized);
      loadedLocales.add(normalized);
      notifyLocale(normalized);
    },

    async otaReloadNamespace(locale: string, namespace: string, pakBytes: Uint8Array) {
      if (!initialized) throw new Error("l10n4x: call initialize() first");
      const normalized = normalizeLocale(locale);
      await l10n4x_load_namespace_bytes(pakBytes, normalized, namespace);
      clearLocaleCache(normalized, [namespace]);
      loadedNamespaces.add(nsKey(normalized, namespace));
      loadedLocales.add(normalized);
      notifyLocale(normalized);
    },

    async otaRollback(locale: string) {
      if (!initialized) throw new Error("l10n4x: call initialize() first");
      const normalized = normalizeLocale(locale);
      await l10n4x_ota_rollback(normalized);
      clearLocaleCache(normalized);
      notifyLocale(normalized);
    },

    otaCanRollback(locale: string) {
      return l10n4x_ota_can_rollback(normalizeLocale(locale));
    },
  };
}