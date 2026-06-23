#!/usr/bin/env bash
# Build (if needed) and symlink wasm-pack output (l10n4x-wasm) into workspace packages.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WASM_PKG="${ROOT}/_wasm_pkg"

if [[ -d "${ROOT}/l10n4x/packages/wasm" ]]; then
  RUST_REPO="${ROOT}/l10n4x"
elif [[ -d "${ROOT}/../l10n4x/packages/wasm" ]]; then
  RUST_REPO="${ROOT}/../l10n4x"
else
  RUST_REPO=""
fi

if [[ ! -f "${WASM_PKG}/package.json" ]]; then
  if [[ -n "${RUST_REPO}" ]]; then
    echo "Building WASM from ${RUST_REPO}…"
    wasm-pack build "${RUST_REPO}/packages/wasm" \
      --target web \
      --out-dir "${WASM_PKG}" \
      --out-name l10n4x
  else
    echo "error: _wasm_pkg/ missing and l10n4x source not found." >&2
    echo "Run: wasm-pack build …/l10n4x/packages/wasm --target web --out-dir ${WASM_PKG} --out-name l10n4x" >&2
    exit 1
  fi
fi

LINK_TARGETS=(
  packages/wasm
  packages/runtime
  bindings/react
  bindings/vue
  bindings/svelte
  bindings/angular
)

for pkg_path in "${LINK_TARGETS[@]}"; do
  target="${ROOT}/${pkg_path}/node_modules/l10n4x-wasm"
  mkdir -p "$(dirname "${target}")"
  rm -rf "${target}"
  ln -sfn "${WASM_PKG}" "${target}"
done

for ex in vite-spa; do
  if [[ -d "${ROOT}/examples/${ex}" ]]; then
    target="${ROOT}/examples/${ex}/node_modules/l10n4x-wasm"
    mkdir -p "$(dirname "${target}")"
    rm -rf "${target}"
    ln -sfn "${WASM_PKG}" "${target}"
  fi
done

touch "${ROOT}/.wasm-linked"
echo "Linked l10n4x-wasm → ${WASM_PKG}"