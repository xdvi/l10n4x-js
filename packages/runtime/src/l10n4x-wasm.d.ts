declare module "@l10n4x/wasm" {
  type InitFn = (url?: string | URL | Request | BufferSource) => Promise<unknown>;
  const init: InitFn & {
    l10n4x_set_verify_key(key: Uint8Array): boolean;
    l10n4x_set_decrypt_key(key: Uint8Array): boolean;
    l10n4x_set_fallback_locale(locale: string): void;
    l10n4x_load_pak_bytes(bytes: Uint8Array, locale: string): void;
    l10n4x_load_namespace_bytes(
      bytes: Uint8Array,
      locale: string,
      namespace: string,
    ): void;
    l10n4x_ota_reload_pak(locale: string, bytes: Uint8Array): void;
    l10n4x_ota_rollback(locale: string): void;
    l10n4x_ota_can_rollback(locale: string): boolean;
    l10n4x_translate(locale: string, keyHash: number): string;
    l10n4x_translate_with_params(
      locale: string,
      keyHash: number,
      paramKeys: string[],
      paramValues: string[],
    ): string;
    l10n4x_clear(): void;
    l10n4x_on_locale_changed?(callback: (locale: string) => void): void;
  };
  export default init;
  export function l10n4x_set_verify_key(key: Uint8Array): boolean;
  export function l10n4x_set_decrypt_key(key: Uint8Array): boolean;
  export function l10n4x_set_fallback_locale(locale: string): void;
  export function l10n4x_load_pak_bytes(bytes: Uint8Array, locale: string): void;
  export function l10n4x_load_namespace_bytes(
    bytes: Uint8Array,
    locale: string,
    namespace: string,
  ): void;
  export function l10n4x_ota_reload_pak(locale: string, bytes: Uint8Array): void;
  export function l10n4x_ota_rollback(locale: string): void;
  export function l10n4x_ota_can_rollback(locale: string): boolean;
  export function l10n4x_translate(locale: string, keyHash: number): string;
  export function l10n4x_translate_with_params(
    locale: string,
    keyHash: number,
    paramKeys: string[],
    paramValues: string[],
  ): string;
  export function l10n4x_clear(): void;
  export function l10n4x_on_locale_changed(callback: (locale: string) => void): void;
}