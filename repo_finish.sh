#!/usr/bin/env bash
set -euo pipefail

DRY_RUN=0
for arg in "$@"; do [ "$arg" = "--dry-run" ] && DRY_RUN=1; done

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"
PROJECT_ID="${FIREBASE_PROJECT_ID:-ai-integra-course-v2}"
LOG_DIR="$ROOT_DIR/reorg_logs"; mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/repo_finish_$(date -u +%Y%m%d-%H%M%S).log"
say(){ printf '%s\n' "$*" | tee -a "$LOG_FILE" >&2; }
run(){ if [ $DRY_RUN -eq 1 ]; then say "DRYRUN: $*"; else say "RUN: $*"; eval "$@"; fi; }
have(){ command -v "$1" >/dev/null 2>&1; }

ensure_branch(){
  run "git status --porcelain"
  run "git stash -u || true"
  run "git fetch --all --prune"
  if git show-ref --verify --quiet refs/heads/release/launch; then run "git switch release/launch"; else run "git switch -c release/launch origin/main"; fi
}

ensure_node(){
  # Enforce Node 20 using nvm if available
  if [ -f .nvmrc ]; then
    if command -v nvm >/dev/null 2>&1; then
      run "nvm install"
      run "nvm use"
    else
      # Attempt to source nvm from common locations
      if [ -s "$HOME/.nvm/nvm.sh" ]; then
        if [ $DRY_RUN -eq 1 ]; then say "DRYRUN: would source $HOME/.nvm/nvm.sh and use .nvmrc"; else . "$HOME/.nvm/nvm.sh"; nvm install; nvm use; fi
      else
        say "WARN: nvm not found; ensure Node 20 is active"
      fi
    fi
  fi
}

source_local_env(){
  # Accept either env1.txt or env1.md on Desktop; parse KEY=VALUE lines only
  local envtxt="$HOME/Desktop/env1.txt"
  local envmd="$HOME/Desktop/env1.md"
  local picked=""
  if [ -f "$envtxt" ]; then picked="$envtxt"; fi
  if [ -z "$picked" ] && [ -f "$envmd" ]; then picked="$envmd"; fi
  if [ -n "$picked" ]; then
    if [ $DRY_RUN -eq 1 ]; then
      say "DRYRUN: would load environment from $picked (KEY=VALUE lines only)"
    else
      say "Loading local environment (values not shown)"
      while IFS= read -r line; do
        case "$line" in
          \#*|"" ) continue ;;
          * )
            if printf '%s' "$line" | grep -qE '^[A-Z0-9_]+=.*'; then
              key="${line%%=*}"; val="${line#*=}"
              # export only if not already set
              eval "[ -z \"\${$key+x}\" ] && export $key=\"$val\"" || true
            fi
          ;;
        esac
      done < "$picked"
    fi
  else
    say "INFO: No env1.txt or env1.md found on Desktop; continuing."
  fi

  # If a local service account JSON is present and not yet configured, set GOOGLE_APPLICATION_CREDENTIALS
  if [ -z "${GOOGLE_APPLICATION_CREDENTIALS:-}" ]; then
    local sa_json_default="$HOME/Downloads/ai-integra-course-v2-3619158f2924.json"
    if [ -f "$sa_json_default" ]; then
      if [ $DRY_RUN -eq 1 ]; then say "DRYRUN: would export GOOGLE_APPLICATION_CREDENTIALS to local service account JSON"; else export GOOGLE_APPLICATION_CREDENTIALS="$sa_json_default"; fi
    fi
  fi
}

write_public_env_files(){
  local out_local="$ROOT_DIR/.env.local" out_prod="$ROOT_DIR/.env.production"
  # Capture public keys for both Next.js and CRA conventions
  local keys; keys=$(env | awk -F= '/^(NEXT_PUBLIC_|REACT_APP_)/ {print $1}' | sort -u)
  : > "$out_local"; : > "$out_prod"
  while IFS= read -r k; do [ -z "$k" ] && continue; printf '%s=%s\n' "$k" "${!k:-}" >> "$out_local"; printf '%s=%s\n' "$k" "${!k:-}" >> "$out_prod"; done <<< "$keys"
}

install_build(){
  ensure_node
  if [ -f package-lock.json ]; then run "npm ci"; else run "npm install"; fi
  run "npm run build || true"
}

firestore_backup(){ mkdir -p "$HOME/backups"; run "firebase firestore:export '$HOME/backups/firestore_$(date -Iseconds)' --project '$PROJECT_ID' || true"; }
apply_rules(){ run "firebase deploy --only firestore:rules --project '$PROJECT_ID' || true"; }
migrate_firestore(){ run "node ./firestore_migrate.js --apply --manifest ./reorg_logs/firestore_migration_manifest.json || true"; }
verify_stripe(){ env | awk -F= '/^STRIPE_/ {print "- present: "$1}' | tee -a "$LOG_FILE" >/dev/null || true; }
health_check(){ run "curl -sS -o /dev/null -w '%{http_code} %{url_effective}\n' https://aiintegrationcourse.com || true"; }
open_pr(){ run "git add -A"; run "git restore --staged .env* || true"; run "git commit -m 'Release: AI Tutor + launch prep' || true"; run "git push -u origin release/launch || true"; }

main(){
  ensure_branch
  source_local_env
  write_public_env_files
  install_build
  firestore_backup
  apply_rules
  migrate_firestore
  verify_stripe
  health_check
  open_pr
  say "Done. See $LOG_FILE"
}

main "$@"
