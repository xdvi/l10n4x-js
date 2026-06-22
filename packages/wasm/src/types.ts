/** WASM module surface (wasm-pack `l10n4x` crate). */
export interface L10n4xWasmModule {
  l10n4x_set_verify_key(key: Uint8Array): boolean;
  l10n4x_set_decrypt_key?(key: Uint8Array): boolean;
  l10n4x_set_fallback_locale(locale: string): void;
  l10n4x_set_fallback_chain?(locales: string[]): void;
  l10n4x_load_pak_bytes(bytes: Uint8Array, locale: string): void;
  l10n4x_translate(locale: string, keyHash: bigint | number): string;
  l10n4x_translate_with_params(
    locale: string,
    keyHash: bigint | number,
    paramKeys: string[],
    paramValues: string[],
  ): string;
  l10n4x_translate_with_context?(
    locale: string,
    keyHash: bigint | number,
    contextHash: bigint | number,
  ): string;
  l10n4x_clear(): void;
  l10n4x_on_locale_changed?(callback: (locale: string) => void): void;
  l10n4x_locale_loaded?(locale: string): boolean;
  l10n4x_get_loaded_locales?(): string[];
}

export type L10n4xWasmInit = (url?: string | URL | Request | BufferSource) => Promise<unknown>;

export type L10n4xWasmDefaultExport = L10n4xWasmInit & L10n4xWasmModule;