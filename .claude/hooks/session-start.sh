#!/bin/bash
set -euo pipefail

# Only run dependency install on remote (Claude Code on the web) sessions.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

REPO_ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$REPO_ROOT"

if [ ! -d "node_modules" ]; then
  echo "[session-start] Installing root npm dependencies..."
  npm ci --no-audit --no-fund
else
  echo "[session-start] Root dependencies already present, skipping install."
fi

if [ -f "functions/package.json" ]; then
  if [ ! -d "functions/node_modules" ]; then
    echo "[session-start] Installing functions npm dependencies..."
    npm ci --prefix functions --no-audit --no-fund
  else
    echo "[session-start] Functions dependencies already present, skipping install."
  fi
fi

echo "[session-start] Dependency install complete."
