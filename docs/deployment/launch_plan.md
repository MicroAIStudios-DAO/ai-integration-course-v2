# Launch Plan — AI Integration Course

This document outlines the PLAN phase actions to finalize and optimize the site before launch. No deployments or destructive actions are performed in PLAN. All scripts are idempotent and log to `./reorg_logs`.

## Summary Table

| Area | Action | Reason | Risk | Mitigation |
|---|---|---|---|---|
| Repo | Create `release/launch` branch, restore package.json, ensure Node 20 via nvm, install/build in EXECUTE | Stabilize environment and dependencies | Build issues | Use clean install, log output; branch isolation |
| Secrets | Source `$HOME/Desktop/env1.txt` locally only, generate `.env.local`/`.env.production` with public keys | Prevent leaking secrets while enabling local builds | Misconfiguration | Never print/commit secrets; public keys only |
| Firestore | Export backup, normalize tree, de-duplicate, set `tier` field, remove bogus docs | Data consistency and premium gating | Data drift | Backup first; manifest + idempotent migration |
| Rules | Apply `premium_rules.rules` | Gate premium content to subscribers/admin | Over-restriction | Verify with smoke reads post-deploy |
| Stripe | Verify Products/Prices and webhook claims path; add verifier script | Ensure subscription flow completes | Missing/incorrect IDs | Script checks presence; no mutation in PLAN |
| Tutor | Finalize Cloud Function + client, prompt, embeddings helper | Provide grounded, low-cost lesson tutor | Model/API errors | Fallback models, strict prompts, context cap |
| Videos | Scan `$HOME` for local video candidates; write JSON map | Aid later YouTube uploads | Large FS scan time | Skip system dirs; lightweight metadata |
| UI | Consistent slugs, badges: only two lessons “Free”, others “Premium”; footer added | Cohesive UX | Visual regressions | Minimal, targeted changes |
| SEO | Add `public/sitemap.xml`, keep `robots.txt` | Basic SEO & indexing | Sitemap staleness | Static core routes; easy to update |
| CI/CD | Health-check script curl, verify Firebase build configs | Confidence before deploy | False negatives | Tag with `--dry-run`, log clearly |

## Execution Order (EXECUTE phase only)

1) `repo_finish.sh --dry-run` to review.
2) `repo_finish.sh` to apply: branch, env, install/build, Firestore backup, rules deploy, migration, Stripe verify, health check, push branch.
3) Open PR, run CI; after approval, deploy to prod.

## Notes

- HARD GUARDS respected: no secret printing/commits; backups before deletes; operate within `$HOME` and repo only.
- Tutor uses `text-embedding-3-small` and model fallback: `o3-mini` → `gpt-4o-mini` → `gpt-3.5-turbo` with ~8k context cap.
- Dry-run transcript provided under `reorg_logs/dry_run_transcript.txt`.

