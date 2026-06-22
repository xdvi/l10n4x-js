export { createL10n } from "./engine.js";
export { fetchNamespaceManifest, namespacesForLocale } from "./manifest.js";
export type { NamespaceManifest } from "./manifest.js";
export { defineKeys } from "./keys.js";
export {
  autoPakLoader,
  fetchNamespacePakLoader,
  fetchPakLoader,
  fsPakLoader,
  resolveLoader,
} from "./loaders.js";
export type { PakLoader } from "./loaders.js";
export type {
  BundlesConfig,
  InitializeOptions,
  L10nConfig,
  L10nInstance,
  LoaderKind,
  LocaleKey,
} from "./types.js";

export const L10nErrors = {
  OK: 0,
  KEY_NOT_FOUND: 1,
  LOCALE_NOT_LOADED: 2,
  BUFFER_TOO_SMALL: 3,
  INVALID_PARAMS: 4,
  INTERNAL_ERROR: 5,
  INVALID_ENCODING: 6,
  IO_ERROR: 7,
  SIGNATURE_INVALID: 8,
  VERIFY_KEY_NOT_SET: 9,
  DECRYPT_KEY_NOT_SET: 11,
  BUFFER_OVERFLOW: 12,
  RUNTIME_TOO_OLD: 13,
} as const;