import { useTranslation } from "@l10n4x/react";
import { Keys } from "./generated";

export function App() {
  const { t, locale, setLocale, isLoading, error } = useTranslation();

  if (error) {
    return (
      <main style={{ fontFamily: "system-ui", padding: 24 }}>
        <h1>l10n4x demo</h1>
        <p style={{ color: "crimson" }}>
          Failed to load translations. Build WASM (`pnpm link-wasm`) and serve `.pak`
          files from <code>/locales</code>.
        </p>
        <pre>{error.message}</pre>
      </main>
    );
  }

  return (
    <main style={{ fontFamily: "system-ui", padding: 24 }}>
      <h1>{isLoading ? "Loading…" : t(Keys.CommonWelcome)}</h1>
      <p>
        Locale: <strong>{locale}</strong>
      </p>
      <button type="button" onClick={() => setLocale("en")}>
        EN
      </button>{" "}
      <button type="button" onClick={() => setLocale("es")}>
        ES
      </button>
    </main>
  );
}