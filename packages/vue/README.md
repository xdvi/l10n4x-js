# @l10n4x/vue

Vue 3 plugin and composables for l10n4x.

```ts
import { createApp } from "vue";
import { createL10nPlugin, useTranslation } from "@l10n4x/vue";
import { Keys } from "./generated";

const app = createApp(App);
app.use(
  createL10nPlugin({
    config: {
      outputDir: "/locales",
      verifyPublicKey: "…64 hex…",
      fallback: "en",
    },
  }),
);
```