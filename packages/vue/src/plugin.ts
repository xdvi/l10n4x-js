import type { App, Plugin } from "vue";
import { ref, type Ref } from "vue";
import { createL10n, type L10nConfig } from "@l10n4x/runtime";
import { L10nInjectionKey } from "./injection-key.js";
import type { L10nVueContext } from "./types.js";

export interface L10nPluginOptions {
  config: L10nConfig;
  initialLocale?: string;
}

export function createL10nPlugin(options: L10nPluginOptions): Plugin {
  return {
    install(app: App) {
      const l10n = createL10n(options.config);
      const locale: Ref<string> = ref(options.initialLocale ?? options.config.fallback);
      const isLoading = ref(true);
      const error = ref<Error | null>(null);
      const revision = ref(0);

      const bump = () => {
        revision.value += 1;
      };

      const setLocale = (next: string) => {
        locale.value = next;
        l10n.setLocale(next);
      };

      const ctx: L10nVueContext = {
        l10n,
        locale,
        isLoading,
        error,
        revision,
        setLocale,
      };

      app.provide(L10nInjectionKey, ctx);

      l10n.onLocaleChanged(() => bump());

      void (async () => {
        try {
          await l10n.initialize();
          await l10n.loadLocale(locale.value);
          isLoading.value = false;
          bump();
        } catch (e) {
          error.value = e instanceof Error ? e : new Error(String(e));
          isLoading.value = false;
        }
      })();

      app.config.globalProperties.$l10n = ctx;
    },
  };
}