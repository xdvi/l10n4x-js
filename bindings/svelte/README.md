# @l10n4x/svelte

Svelte stores for l10n4x.

```ts
import { createL10nStores } from "@l10n4x/svelte";
import { Keys } from "./generated";

export const i18n = createL10nStores({
  outputDir: "/locales",
  verifyPublicKey: "…",
  fallback: "en",
});

await i18n.init();
// $i18n.locale, i18n.t(Keys.CommonWelcome)
```