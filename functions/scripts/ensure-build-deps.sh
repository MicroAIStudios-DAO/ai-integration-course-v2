#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FUNCTIONS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ -x "$FUNCTIONS_DIR/node_modules/.bin/tsc" ]]; then
  exit 0
fi

echo "Functions build dependencies missing. Installing with npm ci..."
npm ci --prefix "$FUNCTIONS_DIR"
