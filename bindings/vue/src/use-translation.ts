import { computed, inject, watch } from "vue";
import type { LocaleKey } from "@l10n4x/runtime";
import { L10nInjectionKey } from "./injection-key.js";
import type { UseTranslationResult } from "./types.js";

export function useTranslation(): UseTranslationResult {
  const ctx = inject(L10nInjectionKey);
  if (!ctx) {
    throw new Error("@l10n4x/vue: useTranslation() requires createL10nPlugin()");
  }

  watch(
    () => ctx.locale.value,
    async (loc) => {
      ctx.isLoading.value = true;
      ctx.error.value = null;
      try {
        if (!ctx.l10n.isInitialized()) {
          await ctx.l10n.initialize();
        }
        await ctx.l10n.loadLocale(loc);
        ctx.isLoading.value = false;
        ctx.revision.value += 1;
      } catch (e) {
        ctx.error.value = e instanceof Error ? e : new Error(String(e));
        ctx.isLoading.value = false;
      }
    },
    { immediate: true },
  );

  const t = (key: LocaleKey, params?: Record<string, string | number>) =>
    ctx.l10n.t(ctx.locale.value, key, params);

  return {
    t,
    locale: ctx.locale,
    setLocale: ctx.setLocale,
    isLoading: ctx.isLoading,
    error: ctx.error,
  };
}

export function useLocale() {
  const ctx = inject(L10nInjectionKey);
  if (!ctx) {
    throw new Error("@l10n4x/vue: useLocale() requires createL10nPlugin()");
  }
  return {
    locale: ctx.locale,
    setLocale: ctx.setLocale,
    isLoading: computed(() => ctx.isLoading.value),
  };
}