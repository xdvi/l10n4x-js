import type { L10nInstance, LocaleKey } from "@l10n4x/runtime";
import type { Ref } from "vue";

export interface L10nVueContext {
  l10n: L10nInstance;
  locale: Ref<string>;
  isLoading: Ref<boolean>;
  error: Ref<Error | null>;
  revision: Ref<number>;
  setLocale: (locale: string) => void;
}

export interface UseTranslationResult {
  t: (key: LocaleKey, params?: Record<string, string | number>) => string;
  locale: Ref<string>;
  setLocale: (locale: string) => void;
  isLoading: Ref<boolean>;
  error: Ref<Error | null>;
}