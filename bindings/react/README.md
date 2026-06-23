# @l10n4x/react

React 18+ bindings for l10n4x.

```tsx
import { L10nProvider, useTranslation } from "@l10n4x/react";
import { Keys } from "./generated";

export function App() {
  return (
    <L10nProvider config={{ outputDir: "/locales", verifyPublicKey: "…", fallback: "en" }}>
      <Page />
    </L10nProvider>
  );
}
```