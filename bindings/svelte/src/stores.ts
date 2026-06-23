import { writable, type Readable, type Writable } from "svelte/store";
import { createL10n, type L10nConfig, type L10nInstance, type LocaleKey } from "@l10n4x/runtime";

export interface L10nSvelteStores {
  l10n: L10nInstance;
  locale: Writable<string>;
  isLoading: Writable<boolean>;
  error: Writable<Error | null>;
  revision: Writable<number>;
  init: (initialLocale?: string) => Promise<void>;
  setLocale: (locale: string) => Promise<void>;
  t: (key: LocaleKey, params?: Record<string, string | number>) => string;
}

export function createL10nStores(config: L10nConfig): L10nSvelteStores {
  const l10n = createL10n(config);
  const locale = writable(config.fallback);
  const isLoading = writable(false);
  const error = writable<Error | null>(null);
  const revision = writable(0);

  const bump = () => revision.update((n) => n + 1);

  l10n.onLocaleChanged(() => bump());

  const setLocale = async (next: string) => {
    locale.set(next);
    l10n.setLocale(next);
    isLoading.set(true);
    error.set(null);
    try {
      if (!l10n.isInitialized()) {
        await l10n.initialize();
      }
      await l10n.loadLocale(next);
      isLoading.set(false);
      bump();
    } catch (e) {
      error.set(e instanceof Error ? e : new Error(String(e)));
      isLoading.set(false);
    }
  };

  const init = async (initialLocale?: string) => {
    const loc = initialLocale ?? config.fallback;
    await setLocale(loc);
  };

  const t = (key: LocaleKey, params?: Record<string, string | number>) => {
    let current = config.fallback;
    locale.subscribe((v) => {
      current = v;
    })();
    return l10n.t(current, key, params);
  };

  return {
    l10n,
    locale,
    isLoading,
    error,
    revision,
    init,
    setLocale,
    t,
  };
}

export type { Readable, Writable };