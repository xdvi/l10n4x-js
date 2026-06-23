# l10n4x-js

JavaScript/TypeScript packages for [l10n4x](https://github.com/xdvi/l10n4x): WASM engine, shared runtime, and framework adapters.

The Rust CLI (`l10n4x generate`) emits **type-safe keys only** (`generated.ts`). All runtime and framework glue lives here.

## Packages

| Package | npm | Description |
|---------|-----|-------------|
| `packages/wasm` | `@l10n4x/wasm` | WASM bindings (from `l10n4x-wasm` crate) |
| `packages/runtime` | `@l10n4x/runtime` | `L10nEngine`, loaders, OTA, modular bundles |
| `packages/react` | `@l10n4x/react` | React context + hooks |
| `packages/vue` | `@l10n4x/vue` | Vue 3 plugin + `useTranslation` |
| `packages/svelte` | `@l10n4x/svelte` | Svelte stores |
| `packages/angular` | `@l10n4x/angular` | `I18nService`, `I18nPipe`, `provideL10n()` |

## Tree

```
l10n4x-js/
├── packages/
│   ├── wasm/
│   ├── runtime/
│   ├── react/
│   ├── vue/
│   ├── svelte/
│   └── angular/
├── scripts/
│   ├── link-wasm.sh
│   └── publish-all.sh
└── pnpm-workspace.yaml
```

## Development

```bash
# Build WASM in the Rust repo first, then copy or link:
cd ../l10n4x && cargo build -p l10n4x-wasm --target wasm32-unknown-unknown --release

pnpm install
pnpm link-wasm
pnpm build
pnpm test
```

## Publishing

Publish in dependency order (see `scripts/publish-all.sh`):

1. `l10n4x-wasm` (npm wrapper for the `.wasm` artifact)
2. `@l10n4x/wasm`
3. `@l10n4x/runtime`
4. `@l10n4x/react`, `@l10n4x/vue`, `@l10n4x/svelte`, `@l10n4x/angular`

## Usage with CLI

```bash
l10n4x generate --target typescript
```

Install the adapters you need:

```bash
pnpm add @l10n4x/runtime @l10n4x/react
# or @l10n4x/vue, @l10n4x/svelte, @l10n4x/angular
```