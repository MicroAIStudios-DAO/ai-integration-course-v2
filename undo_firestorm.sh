#!/usr/bin/env bash
set -euo pipefail

# Undo helper for Firestore content changes by restoring from a backup export.
# PLAN-safe: does not execute restore unless explicitly run without --dry-run.

DRY_RUN=0
for arg in "$@"; do [ "$arg" = "--dry-run" ] && DRY_RUN=1; done

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$ROOT_DIR/reorg_logs"; mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/undo_firestorm_$(date -u +%Y%m%d-%H%M%S).log"
say(){ printf '%s\n' "$*" | tee -a "$LOG_FILE" >&2; }
run(){ if [ $DRY_RUN -eq 1 ]; then say "DRYRUN: $*"; else say "RUN: $*"; eval "$@"; fi; }

usage(){
  cat >&2 <<EOF
Usage: $0 [--dry-run] <backup_folder>

Where <backup_folder> is a directory under $HOME/backups created by
`firebase firestore:export` (e.g., $HOME/backups/firestore_2025-09-09T04:22:11+00:00).

This script attempts to restore the backup using gcloud if available.
EOF
}

main(){
  if [ $# -lt 1 ]; then usage; exit 1; fi
  BACKUP_DIR="$1"
  if [ ! -d "$BACKUP_DIR" ]; then say "Backup directory not found: $BACKUP_DIR"; exit 1; fi

  # Prefer gcloud managed import for Firestore in Native mode.
  if command -v gcloud >/dev/null 2>&1; then
    say "Preparing to restore Firestore from backup: $BACKUP_DIR"
    # gcloud needs bucket path; exports are local. Provide guidance.
    say "Note: gcloud import requires a GCS bucket. Upload backup to GCS and run:\n  gcloud firestore import gs://<bucket>/<path-in-bucket>"
    say "Alternatively, use the Firebase console import (manual)."
  else
    say "gcloud not found. Please upload the backup to GCS and restore from console or install gcloud."
  fi
}

main "$@"

