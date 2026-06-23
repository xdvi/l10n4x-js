import { Pipe, type PipeTransform, inject } from "@angular/core";
import type { LocaleKey } from "@l10n4x/runtime";
import { I18nService } from "./i18n.service.js";

@Pipe({ name: "l10n", pure: false })
export class I18nPipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(key: LocaleKey, paramsOrLocale?: Record<string, string | number> | string, maybeParams?: Record<string, string | number>): string {
    if (typeof paramsOrLocale === "string") {
      return this.i18n.translate(key, paramsOrLocale, maybeParams);
    }
    if (paramsOrLocale && typeof paramsOrLocale === "object") {
      return this.i18n.translate(key, undefined, paramsOrLocale);
    }
    return this.i18n.translate(key);
  }
}