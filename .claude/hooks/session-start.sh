#!/bin/bash
set -euo pipefail

# Only run dependency install on remote (Claude Code on the web) sessions.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

REPO_ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$REPO_ROOT"

echo "[session-start] Installing root npm dependencies..."
npm install --no-audit --no-fund

if [ -f "functions/package.json" ]; then
  echo "[session-start] Installing functions npm dependencies..."
  npm install --prefix functions --no-audit --no-fund
fi

echo "[session-start] Dependency install complete."
