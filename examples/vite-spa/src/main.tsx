import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { L10nProvider } from "@l10n4x/react";
import { App } from "./App";

const VERIFY_KEY = "0".repeat(64);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <L10nProvider
      config={{
        outputDir: "/locales",
        verifyPublicKey: VERIFY_KEY,
        fallback: "en",
        loader: "fetch",
      }}
    >
      <App />
    </L10nProvider>
  </StrictMode>,
);