#!/usr/bin/env bash
# Publish all @l10n4x/* packages to npm in dependency order.
#
# Order:
#   1. l10n4x-wasm     (_wasm_pkg — wasm-pack output)
#   2. @l10n4x/wasm
#   3. @l10n4x/runtime
#   4. @l10n4x/{react,vue,svelte,angular}
#
# Usage:
#   export NODE_AUTH_TOKEN=npm_…
#   ./scripts/publish-all.sh              # publish
#   ./scripts/publish-all.sh --dry-run    # simulate
#   ./scripts/publish-all.sh --build-wasm # rebuild WASM from l10n4x first
#   ./scripts/publish-all.sh --tag beta   # dist-tag (default: latest)
#   ./scripts/publish-all.sh --skip-tests # skip pnpm test
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WASM_PKG="${ROOT}/_wasm_pkg"

DRY_RUN=0
BUILD_WASM=0
SKIP_TESTS=0
NPM_TAG="latest"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=1 ;;
    --build-wasm) BUILD_WASM=1 ;;
    --skip-tests) SKIP_TESTS=1 ;;
    --tag) NPM_TAG="${2:?--tag requires a value}"; shift ;;
    *) echo "unknown option: $1" >&2; exit 1 ;;
  esac
  shift
done

publish_dir() {
  local dir="$1"
  local name
  name="$(basename "$dir")"
  echo "==> publishing ${name}"
  if [[ "${DRY_RUN}" -eq 1 ]]; then
    (cd "${dir}" && pnpm publish --dry-run --access public --no-git-checks --tag "${NPM_TAG}")
  else
    (cd "${dir}" && pnpm publish --access public --no-git-checks --tag "${NPM_TAG}")
  fi
}

if [[ "${BUILD_WASM}" -eq 1 ]]; then
  rm -rf "${WASM_PKG}"
fi

bash "${ROOT}/scripts/link-wasm.sh"
pnpm install
pnpm build

if [[ "${SKIP_TESTS}" -eq 0 ]]; then
  pnpm test
  pnpm typecheck
fi

publish_dir "${WASM_PKG}"

FRAMEWORK_PKGS=(
  "packages/wasm"
  "packages/runtime"
  "packages/react"
  "packages/vue"
  "packages/svelte"
  "packages/angular"
)

for dir in "${FRAMEWORK_PKGS[@]}"; do
  if [[ -f "${ROOT}/${dir}/package.json" ]]; then
    publish_dir "${ROOT}/${dir}"
  fi
done

echo "All packages published (tag: ${NPM_TAG})."