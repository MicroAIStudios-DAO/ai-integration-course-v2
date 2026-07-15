# SEO hosting TODOs (owner/console actions — not expressible in firebase.json)

## 1. www → non-www 301 redirect (owner action required)

`https://www.aiintegrationcourse.com/` currently serves the site directly
(HTTP 200) instead of redirecting to the canonical apex host. Firebase
Hosting's `firebase.json` `redirects` are **path-based only** — host-based
redirects cannot be expressed there.

Fix in the Firebase console (no DNS change needed if www is already a
connected custom domain):

1. Firebase console → Hosting → `ai-integra-course-v2` → Custom domains.
2. If `www.aiintegrationcourse.com` is listed as a *serving* domain, remove
   it and re-add it choosing **"Redirect to existing website"** →
   `aiintegrationcourse.com`. Firebase then issues the 301 at the edge.
3. If www is not yet connected, add it with the redirect option directly.

Verify afterwards:
`curl -sI https://www.aiintegrationcourse.com/ | grep -i "^location"`
→ expect `location: https://aiintegrationcourse.com/` with HTTP 301.

Mitigation already in place until then: every prerendered page (and the
hydrated SPA) emits a self-referencing canonical on the apex host, so
crawlers consolidate to the right URLs even while www responds 200.

## 2. Soft 404s on unknown routes (accepted limitation, mitigated)

Unknown paths (e.g. `/this-page-does-not-exist`) return HTTP 200 with the
SPA shell because the `** → /app-shell.html` rewrite must exist for
legitimate client-side routes (checkout, lessons, dashboard, roadmap).
A true HTTP 404 for arbitrary paths is not achievable while a catch-all
rewrite is in place.

Mitigations shipped in this repo:

- `app-shell.html` carries **no canonical and no JSON-LD**, so unknown
  URLs no longer claim homepage identity.
- All indexable marketing/content routes are prerendered to real files,
  so the shell is only served for app routes and genuinely unknown paths.

Optional future hardening (not done): enumerate legitimate client-route
prefixes (`/checkout/**`, `/app/**`, `/courses/**`, `/roadmap`, …) as
explicit rewrites and drop the `**` catch-all so everything else falls
through to Firebase's 404 handling. Brittle — every new client route
would need a firebase.json edit — so deliberately deferred.
