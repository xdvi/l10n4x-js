import { createContext } from "react";
import type { L10nInstance } from "@l10n4x/runtime";

export interface L10nContextValue {
  l10n: L10nInstance;
  locale: string;
  setLocale: (locale: string) => void;
  isLoading: boolean;
  error: Error | null;
  revision: number;
}

export const L10nContext = createContext<L10nContextValue | null>(null);