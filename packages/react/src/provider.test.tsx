import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { L10nInstance } from "@l10n4x/runtime";
import { L10nProvider } from "./provider.js";
import { useTranslation } from "./hooks.js";

vi.mock("@l10n4x/runtime", () => {
  const listeners = new Set<(locale: string) => void>();
  const instance: L10nInstance = {
    initialize: vi.fn(async () => undefined),
    loadLocale: vi.fn(async () => true),
    t: vi.fn(() => "Hello"),
    clear: vi.fn(),
    connectDevServer: vi.fn(() => () => undefined),
    onLocaleChanged: vi.fn((fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    }),
    getLocale: vi.fn(() => "en"),
    setLocale: vi.fn(),
    isInitialized: vi.fn(() => false),
    getLoadedLocales: vi.fn(() => new Set(["en"])),
    loadNamespace: vi.fn(async () => true),
    getLoadedNamespaces: vi.fn(() => new Set<string>()),
    otaReload: vi.fn(async () => undefined),
    otaReloadNamespace: vi.fn(async () => undefined),
    otaRollback: vi.fn(async () => undefined),
    otaCanRollback: vi.fn(() => false),
  };
  return {
    createL10n: vi.fn(() => instance),
  };
});

function Probe() {
  const { t, isLoading } = useTranslation();
  if (isLoading) return <span>loading</span>;
  return <span>{t(1)}</span>;
}

describe("L10nProvider", () => {
  it("renders children after init", async () => {
    render(
      <L10nProvider
        config={{
          outputDir: "/locales",
          verifyPublicKey: "ab".repeat(32),
          fallback: "en",
        }}
      >
        <Probe />
      </L10nProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Hello")).toBeTruthy();
    });
  });
});