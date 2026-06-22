# @l10n4x/runtime

Framework-agnostic JavaScript runtime for l10n4x: WASM init, `.pak` loaders, `t()`, dev-server hot reload.

```ts
import { createL10n } from "@l10n4x/runtime";

const l10n = createL10n({
  outputDir: "/locales",
  verifyPublicKey: "ab".repeat(32),
  fallback: "en",
});

await l10n.initialize();
await l10n.loadLocale("es");
const text = l10n.t("en", Keys.CommonWelcome);
```