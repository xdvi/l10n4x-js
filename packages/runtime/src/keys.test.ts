import { describe, expect, it } from "vitest";
import { defineKeys } from "./keys.js";

describe("defineKeys", () => {
  it("freezes key map", () => {
    const keys = defineKeys({ A: 1, B: 2 } as const);
    expect(keys.A).toBe(1);
    expect(Object.isFrozen(keys)).toBe(true);
  });
});