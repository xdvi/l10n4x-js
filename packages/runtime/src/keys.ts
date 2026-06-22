import type { LocaleKey } from "./types.js";

/**
 * Helper for generated key maps. The CLI can emit:
 *
 * ```ts
 * export const Keys = defineKeys({ CommonWelcome: 0x… } as const);
 * export type LocaleKey = (typeof Keys)[keyof typeof Keys];
 * ```
 */
export function defineKeys<const T extends Record<string, LocaleKey>>(keys: T): Readonly<T> {
  return Object.freeze(keys);
}