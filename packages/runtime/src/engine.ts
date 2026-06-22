import initWasm, {
  l10n4x_clear,
  l10n4x_load_pak_bytes,
  l10n4x_on_locale_changed,
  l10n4x_set_decrypt_key,
  l10n4x_set_fallback_locale,
  l10n4x_set_verify_key,
  l10n4x_translate,
  l10n4x_translate_with_params,
} from "@l10n4x/wasm";

import { resolveLoader } from "./loaders.js";
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

function cacheKey(outputDir: string, locale: string): string {
  return `${CACHE_PREFIX}${outputDir}:${locale}`;
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

/** Creates an isolated l10n4x runtime instance (WASM singleton — one active engine per process). */
export function createL10n(config: L10nConfig): L10nInstance {
  let initialized = false;
  let fallback = config.fallback;
  let outputDir = config.outputDir;
  let loader = resolveLoader(config.loader);
  let activeLocale = fallback;
  const loadedLocales = new Set<string>();
  const localeListeners = new Set<(locale: string) => void>();
  let wasmInit: Promise<void> | null = null;

  const notifyLocale = (locale: string) => {
    for (const fn of localeListeners) fn(locale);
  };

  const ensureWasm = async (wasmUrl?: InitializeOptions["wasmUrl"]) => {
    if (!wasmInit) {
      wasmInit = initWasm(wasmUrl ?? config.wasmUrl).then(() => undefined);
    }
    await wasmInit;
  };

  const loadLocaleWithCache = async (locale: string): Promise<boolean> => {
    const normalized = normalizeLocale(locale);
    if (loadedLocales.has(normalized)) return true;

    if (typeof localStorage !== "undefined") {
      const cached = localStorage.getItem(cacheKey(outputDir, normalized));
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as number[];
          const bytes = new Uint8Array(parsed);
          l10n4x_load_pak_bytes(bytes, normalized);
          loadedLocales.add(normalized);
          return true;
        } catch {
          localStorage.removeItem(cacheKey(outputDir, normalized));
        }
      }
    }

    const bytes = await loader(normalized, outputDir);
    l10n4x_load_pak_bytes(bytes, normalized);
    loadedLocales.add(normalized);

    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(
          cacheKey(outputDir, normalized),
          JSON.stringify(Array.from(bytes)),
        );
      } catch {
        // quota exceeded — ignore
      }
    }
    return true;
  };

  return {
    async initialize(options?: InitializeOptions) {
      if (initialized) return;

      fallback = options?.fallbackLocale ?? fallback;
      outputDir = options?.localesPath ?? outputDir;
      loader = resolveLoader(options?.loader ?? config.loader);
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
      initialized = false;
      wasmInit = null;
      notifyLocale("*");
    },

    connectDevServer(baseUrl: string, locales: string[]) {
      const url = `${baseUrl.replace(/\/$/, "")}/events`;
      const es = new EventSource(url);
      es.onmessage = async () => {
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
  };
}