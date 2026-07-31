# SEO Phase 1 — Operator Runbook & Investigation Notes

Companion to the Phase 1 PR (Ahrefs audit remediation, crawl of 25 Jul 2026).
Code changes are in the PR; this file covers the two console actions only you
can perform and the investigation results for the performance findings.

## 1. Required console action: 301 www → apex (Ahrefs issue #11)

`firebase.json` cannot express host-based redirects, so the authoritative
301 lives in Firebase Hosting's custom-domain settings:

1. Firebase console → project **ai-integra-course-v2** → **Hosting**.
2. Under **Custom domains**, find `www.aiintegrationcourse.com`. It is
   currently connected as a *serving* domain (that's why both hosts return
   200 with identical content).
3. Remove the www domain, then **Add custom domain** → enter
   `www.aiintegrationcourse.com` → check **"Redirect www.aiintegrationcourse.com
   to an existing website"** (target: `aiintegrationcourse.com`). Firebase then
   answers www with a 301 to the apex.
4. DNS records do not change; propagation is immediate once the domain
   re-verifies.

Verify afterwards:

```bash
curl -sI https://www.aiintegrationcourse.com/pricing | head -5
```

Expected: `HTTP/2 301` with `location: https://aiintegrationcourse.com/pricing`.

Until this is done, the repo ships a defensive early-JS redirect in
`index.html`, and the functions' CORS allowlists deliberately keep the www
origin so in-flight www sessions don't break mid-migration. Remove the www
CORS entries (functions/src/tutor.ts, functions/src/tutorEngine.ts) a few
weeks after the 301 is live.

## 2. Slow page investigation (Ahrefs issues #9, TTFB outliers)

Finding: `www.aiintegrationcourse.com/blogs/cursor-vs-claude-code-vs-gemini-2026`
at 1,079 ms load; 1 page with TTFB >500 ms, 4 in 300–500 ms.

Analysis:

- The slow URL is on the **www host** — the duplicate nobody visits. Firebase's
  CDN caches per host+path, so the crawler hit a cold edge cache and paid the
  full origin round-trip. The apex copy of the same page was in the "fast"
  bucket, and all 40 other pages loaded fast (<100 KB, Brotli).
- No repo-side defect: the page is static prerendered HTML (~20 KB), no
  function in the serving path.
- Remediation is the www 301 above — the slow URL then ceases to exist. The
  medium-TTFB tail (300–500 ms) is cold-cache variance on rarely-crawled
  pages, not something worth engineering around at current traffic.
- Re-check on the next crawl after the 301; if apex pages still show TTFB
  >500 ms we can add `Cache-Control: s-maxage` for HTML in firebase.json
  (currently only images/js/css get long-lived cache headers).

## 3. Enable Core Web Vitals in the Ahrefs crawl (issue: "CWV not enabled")

Ahrefs collects CWV via Google's PageSpeed Insights API and needs your API key:

1. Get a (free) PSI API key: https://developers.google.com/speed/docs/insights/v5/get-started
   → "Get a Key". It's a Google Cloud API key with the PageSpeed Insights API
   enabled; no billing required at audit volumes.
2. Ahrefs → **Site Audit** → your project → **Project Settings** →
   **Crawl settings** → section **Core Web Vitals** → paste the API key and
   enable collection.
3. Re-run the crawl. CWV columns (LCP/INP/CLS, lab + field where available)
   populate in Page Explorer and the Performance report.

## 4. What Phase 1 changed (summary for future sessions)

- example.com placeholder links replaced with real sources; build fails on
  example.com / localhost / #TODO / javascript:void(0) hrefs
  (`scripts/verify-seo.mjs`).
- `/terms` and `/checkout/start` are prerendered; checkout is
  noindex,nofollow; `app-shell.html` (every non-prerendered route) defaults
  to noindex with a `data-rh` tag SEO.tsx overrides on hydration.
- Blog `<title>` tags use the new `seoTitle` field (≤60 chars, no brand
  suffix); full headlines remain the H1/og:title. Three over-length meta
  descriptions trimmed to 146–159 chars.
- `sitemap.xml` is generated in postbuild from the route manifests
  (`scripts/generate-sitemap.mjs`); `verify-seo.mjs` fails the build if the
  sitemap and built HTML ever disagree (existence, self-canonical, noindex).
- Social cards: absolute og/twitter image URLs, `og:image:alt` +
  `twitter:image:alt` sitewide; duplicate head tags on hydration fixed via
  `data-rh` ownership.
