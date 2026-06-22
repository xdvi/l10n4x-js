import { useCallback, useContext, useSyncExternalStore } from "react";
import type { LocaleKey } from "@l10n4x/runtime";
import { L10nContext } from "./context.js";

function useL10nContext() {
  const ctx = useContext(L10nContext);
  if (!ctx) {
    throw new Error("@l10n4x/react: useTranslation must be used within <L10nProvider>");
  }
  return ctx;
}

/** Full context: instance, locale, loading state. */
export function useL10n() {
  return useL10nContext();
}

export interface UseTranslationResult {
  t: (key: LocaleKey, params?: Record<string, string | number>) => string;
  locale: string;
  setLocale: (locale: string) => void;
  isLoading: boolean;
  error: Error | null;
}

/**
 * React hook for l10n4x translations (React 18+ safe via external store revision).
 *
 * @example
 * const { t, setLocale } = useTranslation();
 * return <h1>{t(Keys.CommonWelcome)}</h1>;
 */
export function useTranslation(): UseTranslationResult {
  const { l10n, locale, setLocale, isLoading, error, revision } = useL10nContext();

  useSyncExternalStore(
    (onStoreChange) => l10n.onLocaleChanged(() => onStoreChange()),
    () => revision,
    () => revision,
  );

  const t = useCallback(
    (key: LocaleKey, params?: Record<string, string | number>) =>
      l10n.t(locale, key, params),
    [l10n, locale, revision],
  );

  return { t, locale, setLocale, isLoading, error };
}

/** Locale string and setter only. */
export function useLocale() {
  const { locale, setLocale, isLoading } = useL10nContext();
  return { locale, setLocale, isLoading };
}