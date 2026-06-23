# l10n4x-js

Official JavaScript / TypeScript packages for [l10n4x](https://github.com/xdvi/l10n4x): compiled, signed `.pak` translations with a React-friendly runtime.

## Packages

| Package | Description |
|---------|-------------|
| [`@l10n4x/wasm`](./packages/wasm) | npm wrapper around the `l10n4x-wasm` WebAssembly module |
| [`@l10n4x/runtime`](./packages/runtime) | Isomorphic init, loaders, `t()`, modular bundles, dev-server SSE |
| [`@l10n4x/react`](./packages/react) | `L10nProvider`, `useTranslation`, locale-change subscriptions |

## Quick start

```bash
# 1. Build WASM from the Rust repo (sibling checkout)
cd ../l10n4x
cargo install wasm-pack --locked
wasm-pack build packages/wasm --target web --out-dir ../l10n4x-js/_wasm_pkg --out-name l10n4x

# 2. Install JS deps and link WASM
cd ../l10n4x-js
pnpm install
pnpm link-wasm
pnpm build
```

In your app (after `l10n4x build` generated keys):

```tsx
import { L10nProvider, useTranslation } from "@l10n4x/react";
import { Keys } from "./generated";

function App() {
  return (
    <L10nProvider
      config={{
        outputDir: "/locales",
        verifyPublicKey: "…64 hex chars…",
        fallback: "en",
      }}
    >
      <Page />
    </L10nProvider>
  );
}

function Page() {
  const { t, locale, setLocale } = useTranslation();
  return (
    <>
      <h1>{t(Keys.CommonWelcome)}</h1>
      <button onClick={() => setLocale("es")}>ES</button>
      <span>{locale}</span>
    </>
  );
}
```

## Workspace layout

```
packages/wasm    → re-exports l10n4x-wasm (built by wasm-pack)
packages/runtime → framework-agnostic API
packages/react   → React 18+ hooks & provider
examples/vite-spa → minimal demo
```

## Relationship to `l10n4x` CLI

The Rust CLI (`l10n4x build`) should emit a **thin** `generated.ts` with key hashes and types only. Runtime logic lives in `@l10n4x/runtime`; React integration in `@l10n4x/react`.

## Modular bundles & OTA

```ts
import { createL10n } from "@l10n4x/runtime";

const l10n = createL10n({
  outputDir: "/locales",
  verifyPublicKey: "…",
  fallback: "en",
  bundles: { mode: "modular", preload: ["common"] },
});

await l10n.initialize();
await l10n.loadNamespace("es", "billing");

// Monolith OTA (one rollback snapshot per locale)
await l10n.otaReload("en", pakBytes);
if (l10n.otaCanRollback("en")) await l10n.otaRollback("en");

// Modular hot-swap per namespace
await l10n.otaReloadNamespace("en", "common", namespacePakBytes);
```

Requires WASM built from l10n4x **v0.2.0+** (`l10n4x_load_namespace_bytes`, `l10n4x_ota_*` exports).

## Enterprise adoption

For governance, CI/CD, namespace ownership, OTA, and observability patterns (aligned with Angular compile-time i18n and SAP message-class workflows), see the [Enterprise Adoption Guide](https://github.com/xdvi/l10n4x/blob/main/docs/ENTERPRISE_ADOPTION.md) in the Rust repository.

## License

MIT — same as l10n4x.