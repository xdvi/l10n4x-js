import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createL10n, type L10nConfig } from "@l10n4x/runtime";
import { L10nContext, type L10nContextValue } from "./context.js";

export interface L10nProviderProps {
  config: L10nConfig;
  initialLocale?: string;
  children: ReactNode;
  onError?: (error: Error) => void;
}

export function L10nProvider({
  config,
  initialLocale,
  children,
  onError,
}: L10nProviderProps) {
  const l10nRef = useRef(createL10n(config));
  const l10n = l10nRef.current;

  const [locale, setLocaleState] = useState(initialLocale ?? config.fallback);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [revision, setRevision] = useState(0);

  const bump = useCallback(() => setRevision((r) => r + 1), []);

  const setLocale = useCallback(
    (next: string) => {
      setLocaleState(next);
      l10n.setLocale(next);
    },
    [l10n],
  );

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        if (!l10n.isInitialized()) {
          await l10n.initialize();
        }
        await l10n.loadLocale(locale);
        if (!cancelled) {
          setIsLoading(false);
          bump();
        }
      } catch (e) {
        if (!cancelled) {
          const err = e instanceof Error ? e : new Error(String(e));
          setError(err);
          setIsLoading(false);
          onError?.(err);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [locale, l10n, onError, bump]);

  useEffect(() => {
    return l10n.onLocaleChanged(() => bump());
  }, [l10n, bump]);

  const value = useMemo<L10nContextValue>(
    () => ({
      l10n,
      locale,
      setLocale,
      isLoading,
      error,
      revision,
    }),
    [l10n, locale, setLocale, isLoading, error, revision],
  );

  return <L10nContext.Provider value={value}>{children}</L10nContext.Provider>;
}