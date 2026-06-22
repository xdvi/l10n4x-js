export type { L10n4xWasmInit, L10n4xWasmModule, L10n4xWasmDefaultExport } from "./types.js";

/**
 * Re-exports the wasm-pack output (`l10n4x-wasm` on npm).
 * Install `l10n4x-wasm` or run `pnpm link-wasm` from the repo root.
 */
export { default } from "l10n4x-wasm";
export * from "l10n4x-wasm";