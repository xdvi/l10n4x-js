import { Injectable } from "@angular/core";
import { BehaviorSubject, type Observable } from "rxjs";
import { createL10n, type L10nConfig, type L10nInstance, type LocaleKey } from "@l10n4x/runtime";

@Injectable()
export class I18nService {
  private readonly _locale = new BehaviorSubject<string>("en");
  private readonly _isLoading = new BehaviorSubject<boolean>(true);
  private readonly _error = new BehaviorSubject<Error | null>(null);
  private _l10n: L10nInstance | null = null;
  private _initialized = false;

  readonly locale$: Observable<string> = this._locale.asObservable();
  readonly isLoading$: Observable<boolean> = this._isLoading.asObservable();
  readonly error$: Observable<Error | null> = this._error.asObservable();

  configure(config: L10nConfig, initialLocale?: string): void {
    this._l10n = createL10n(config);
    const fallback = initialLocale ?? config.fallback;
    this._locale.next(fallback);
    this._l10n.onLocaleChanged((loc) => {
      if (loc !== "*") {
        this._locale.next(loc);
      }
    });
    void this.init(fallback);
  }

  async init(locale?: string): Promise<void> {
    const l10n = this.requireL10n();
    if (this._initialized) return;
    this._isLoading.next(true);
    this._error.next(null);
    try {
      await l10n.initialize();
      this._initialized = true;
      const loc = locale ?? this._locale.getValue();
      await l10n.loadLocale(loc);
      this._locale.next(loc);
      this._isLoading.next(false);
    } catch (e) {
      this._error.next(e instanceof Error ? e : new Error(String(e)));
      this._isLoading.next(false);
      throw e;
    }
  }

  async setLocale(locale: string): Promise<void> {
    const l10n = this.requireL10n();
    if (!this._initialized) {
      await this.init(locale);
      return;
    }
    this._isLoading.next(true);
    this._error.next(null);
    try {
      await l10n.loadLocale(locale);
      l10n.setLocale(locale);
      this._locale.next(locale);
      this._isLoading.next(false);
    } catch (e) {
      this._error.next(e instanceof Error ? e : new Error(String(e)));
      this._isLoading.next(false);
    }
  }

  translate(key: LocaleKey, locale?: string, params?: Record<string, string | number>): string {
    const l10n = this.requireL10n();
    const loc = locale ?? this._locale.getValue();
    return l10n.t(loc, key, params);
  }

  get locale(): string {
    return this._locale.getValue();
  }

  private requireL10n(): L10nInstance {
    if (!this._l10n) {
      throw new Error("@l10n4x/angular: call provideL10n() or I18nService.configure() first");
    }
    return this._l10n;
  }
}