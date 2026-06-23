# @l10n4x/angular

Angular 17+ providers for l10n4x.

```ts
import { bootstrapApplication } from "@angular/platform-browser";
import { provideL10n } from "@l10n4x/angular";

bootstrapApplication(AppComponent, {
  providers: [
    provideL10n({
      config: {
        outputDir: "/locales",
        verifyPublicKey: "…",
        fallback: "en",
      },
    }),
  ],
});
```