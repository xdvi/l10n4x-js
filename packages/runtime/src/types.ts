import type { PakLoader } from "./loaders.js";

/** u64 key hash emitted by `l10n4x build`. */
export type LocaleKey = number;

export type LoaderKind = "auto" | "fetch" | "fs";

export interface BundlesConfig {
  mode?: "monolith" | "modular";
  preload?: string[];
}

export interface L10nConfig {
  /** Base path or URL prefix for `.pak` files (e.g. `/locales` or `./dist/locales`). */
  outputDir: string;
  /** 64-char hex Ed25519 public key from `l10n4x.config.json`. */
  verifyPublicKey: string;
  fallback: string;
  encrypt?: boolean;
  encryptKeyEnv?: string;
  bundles?: BundlesConfig;
  loader?: PakLoader | LoaderKind;
  wasmUrl?: string | URL | Request | BufferSource;
  decryptKey?: Uint8Array;
}

export interface L10nInstance {
  initialize(options?: InitializeOptions): Promise<void>;
  loadLocale(locale: string): Promise<boolean>;
  /** Load a single namespace pak (modular mode only). */
  loadNamespace(locale: string, namespace: string): Promise<boolean>;
  t(locale: string, key: LocaleKey, params?: Record<string, string | number>): string;
  clear(): void;
  connectDevServer(baseUrl: string, locales: string[]): () => void;
  onLocaleChanged(listener: (locale: string) => void): () => void;
  getLocale(): string;
  setLocale(locale: string): void;
  isInitialized(): boolean;
  getLoadedLocales(): ReadonlySet<string>;
  getLoadedNamespaces(): ReadonlySet<string>;
  /** OTA reload for monolith `{locale}.pak` (retains one rollback snapshot). */
  otaReload(locale: string, pakBytes: Uint8Array): Promise<void>;
  /** Hot-swap a namespace pak in modular mode. */
  otaReloadNamespace(locale: string, namespace: string, pakBytes: Uint8Array): Promise<void>;
  otaRollback(locale: string): Promise<void>;
  otaCanRollback(locale: string): boolean;
}

export interface InitializeOptions {
  loader?: PakLoader | LoaderKind;
  wasmUrl?: string | URL | Request | BufferSource;
  fallbackLocale?: string;
  localesPath?: string;
  decryptKey?: Uint8Array;
}