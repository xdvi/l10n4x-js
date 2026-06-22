#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WASM_PKG="${ROOT}/_wasm_pkg"

RUST_REPO="${ROOT}/../l10n4x"

if [[ ! -f "${WASM_PKG}/package.json" ]]; then
  if [[ -d "${RUST_REPO}/packages/wasm" ]]; then
    echo "Building WASM from ${RUST_REPO}…"
    (cd "${RUST_REPO}" && wasm-pack build packages/wasm --target web --out-dir "${WASM_PKG}" --out-name l10n4x)
  else
    echo "error: _wasm_pkg/ missing and ${RUST_REPO} not found." >&2
    echo "Run: wasm-pack build …/l10n4x/packages/wasm --target web --out-dir ${WASM_PKG} --out-name l10n4x" >&2
    exit 1
  fi
fi

# Wire workspace packages to the local wasm-pack output.
for pkg in wasm runtime react; do
  target="${ROOT}/packages/${pkg}/node_modules/l10n4x-wasm"
  mkdir -p "$(dirname "${target}")"
  rm -rf "${target}"
  ln -sfn "${WASM_PKG}" "${target}"
done

for ex in vite-spa; do
  target="${ROOT}/examples/${ex}/node_modules/l10n4x-wasm"
  mkdir -p "$(dirname "${target}")"
  rm -rf "${target}"
  ln -sfn "${WASM_PKG}" "${target}"
done

touch "${ROOT}/.wasm-linked"
echo "Linked l10n4x-wasm → ${WASM_PKG}"