import { describe, expect, it } from "vitest";
import { namespacesForLocale } from "./manifest.js";

describe("namespacesForLocale", () => {
  it("merges preload and locale namespaces", () => {
    const list = namespacesForLocale(
      { locales: { en: ["billing"], es: ["auth"] }, preload: ["common"] },
      "en",
    );
    expect(list).toContain("common");
    expect(list).toContain("billing");
    expect(list).toHaveLength(2);
  });

  it("uses config preload override", () => {
    const list = namespacesForLocale(
      { locales: { en: ["billing"] }, preload: ["common"] },
      "en",
      ["core"],
    );
    expect(list).toEqual(expect.arrayContaining(["core", "billing"]));
  });
});