#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WASM_PKG="${ROOT}/_wasm_pkg"

RUST_REPO=""
for candidate in "${ROOT}/../l10n4x" "${ROOT}/../meddix/l10n4x"; do
  if [[ -d "${candidate}/packages/wasm" ]]; then
    RUST_REPO="${candidate}"
    break
  fi
done

if [[ ! -f "${WASM_PKG}/package.json" ]]; then
  if [[ -n "${RUST_REPO}" ]]; then
    echo "Building WASM from ${RUST_REPO}…"
    (cd "${RUST_REPO}" && wasm-pack build packages/wasm --target web --out-dir "${WASM_PKG}" --out-name l10n4x)
  else
    echo "error: _wasm_pkg/ missing and no l10n4x checkout found (tried ../l10n4x, ../meddix/l10n4x)." >&2
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