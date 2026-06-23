import {
  type EnvironmentProviders,
  makeEnvironmentProviders,
  APP_INITIALIZER,
  inject,
} from "@angular/core";
import type { L10nConfig } from "@l10n4x/runtime";
import { I18nService } from "./i18n.service.js";
import { I18nPipe } from "./i18n.pipe.js";

export interface ProvideL10nOptions {
  config: L10nConfig;
  initialLocale?: string;
}

export function provideL10n(options: ProvideL10nOptions): EnvironmentProviders {
  return makeEnvironmentProviders([
    I18nService,
    I18nPipe,
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: () => {
        const i18n = inject(I18nService);
        return () => {
          i18n.configure(options.config, options.initialLocale);
          return i18n.init(options.initialLocale);
        };
      },
    },
  ]);
}