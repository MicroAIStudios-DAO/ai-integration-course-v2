#!/usr/bin/env node
// SEO output contract — runs at the end of postbuild and fails the build on
// regressions that have bitten this site before (Ahrefs audit, Jul 2026):
//
//   1. Forbidden link targets: placeholder hrefs (example.com, localhost,
//      #TODO, javascript:void(0)) must never ship. 24 example.com links from
//      unreplaced content-generation placeholders were once the ONLY external
//      links on the entire site.
//
//   2. Sitemap ↔ build contract: every sitemap URL is canonical-host, has a
//      prerendered file, is self-canonical, and is not noindexed — and every
//      indexable prerendered route appears in the sitemap. The committed
//      sitemap once drifted 3 blog posts behind the published content.
//
//   3. Prerendered-content floors: each indexable route's built HTML must
//      contain at least a per-route minimum of visible body text. The money
//      pages once shipped as ~250-char shells that AI crawlers (which do not
//      execute JS) saw as empty — the single biggest cause of 0 keywords and
//      0 AI citations in the Jul 2026 Ahrefs audit.
//
//   4. Internal link graph: every sitemap route must receive at least one
//      internal link from another prerendered page. The audit found 11
//      orphan pages — including /start-trial, a conversion page nothing
//      linked to — because chrome links lived only in client-side React.
//
// Scans every prerendered HTML file in build/ plus the blog markdown sources
// in public/blogs/ (the markdown is also served raw to AI crawlers).

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.join(__dirname, '..');
const BUILD_DIR = path.join(REPO_ROOT, 'build');
const BLOGS_DIR = path.join(REPO_ROOT, 'public', 'blogs');

const FORBIDDEN_HREF_PATTERNS = [
  { re: /(^|\/\/)([\w.-]*\.)?example\.(com|org|net)\b/i, label: 'example.com placeholder' },
  { re: /(^|\/\/)(localhost|127\.0\.0\.1)\b/i, label: 'localhost URL' },
  { re: /#TODO/i, label: '#TODO placeholder anchor' },
  { re: /^javascript:void\(0\)/i, label: 'javascript:void(0) href' },
];

const violations = [];

function checkHref(href, file) {
  for (const { re, label } of FORBIDDEN_HREF_PATTERNS) {
    if (re.test(href)) {
      violations.push(`${file}: ${label} → ${href}`);
    }
  }
}

function* walkHtml(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walkHtml(p);
    else if (entry.name.endsWith('.html')) yield p;
  }
}

function relPath(p) {
  return path.relative(REPO_ROOT, p).split(path.sep).join('/');
}

// 1a. hrefs in every built HTML file
if (!existsSync(BUILD_DIR)) {
  console.error('verify-seo: build/ not found — run vite build first.');
  process.exit(1);
}
for (const file of walkHtml(BUILD_DIR)) {
  const html = readFileSync(file, 'utf8');
  for (const match of html.matchAll(/href="([^"]*)"/g)) {
    checkHref(match[1], relPath(file));
  }
}

// 1b. markdown links in the blog sources (served raw at /blogs/*.md)
if (existsSync(BLOGS_DIR)) {
  for (const entry of readdirSync(BLOGS_DIR)) {
    if (!entry.endsWith('.md')) continue;
    const md = readFileSync(path.join(BLOGS_DIR, entry), 'utf8');
    for (const match of md.matchAll(/\]\(([^)\s]+)/g)) {
      checkHref(match[1], `public/blogs/${entry}`);
    }
  }
}

if (violations.length > 0) {
  console.error(`❌ verify-seo: ${violations.length} forbidden link(s) found:`);
  for (const v of violations) console.error(`   ${v}`);
  process.exit(1);
}
console.log('✅ verify-seo: no forbidden link targets in build output');

// ─── 2. Sitemap ↔ build contract ─────────────────────────────────────────────

const BASE_URL = 'https://aiintegrationcourse.com';
const SITEMAP_PATH = path.join(BUILD_DIR, 'sitemap.xml');
const sitemapErrors = [];

if (!existsSync(SITEMAP_PATH)) {
  console.error('❌ verify-seo: build/sitemap.xml missing — run generate-sitemap.mjs first.');
  process.exit(1);
}

const sitemapLocs = [...readFileSync(SITEMAP_PATH, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  (m) => m[1]
);
const sitemapSet = new Set(sitemapLocs);

const routeToFile = (route) =>
  route === '/'
    ? path.join(BUILD_DIR, 'index.html')
    : path.join(BUILD_DIR, ...route.split('/').filter(Boolean), 'index.html');

for (const loc of sitemapLocs) {
  if (!loc.startsWith(`${BASE_URL}/`) && loc !== `${BASE_URL}/`) {
    sitemapErrors.push(`${loc}: not on the canonical host ${BASE_URL}`);
    continue;
  }
  const route = loc.slice(BASE_URL.length) || '/';
  const file = routeToFile(route);
  if (!existsSync(file)) {
    sitemapErrors.push(`${loc}: no prerendered file at ${relPath(file)} (would 200 as app shell)`);
    continue;
  }
  const html = readFileSync(file, 'utf8');
  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
  if (canonical !== loc) {
    sitemapErrors.push(`${loc}: canonical is ${canonical ?? 'MISSING'} (must be self-referencing)`);
  }
  if (/<meta name="robots" content="[^"]*noindex/.test(html)) {
    sitemapErrors.push(`${loc}: page is noindexed but listed in the sitemap`);
  }
}

// Inverse: every indexable prerendered route must be in the sitemap.
for (const file of walkHtml(BUILD_DIR)) {
  if (path.basename(file) === 'app-shell.html') continue;
  const html = readFileSync(file, 'utf8');
  if (/<meta name="robots" content="[^"]*noindex/.test(html)) continue;
  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
  if (!canonical) continue;
  if (!sitemapSet.has(canonical)) {
    sitemapErrors.push(`${relPath(file)}: indexable (canonical ${canonical}) but absent from sitemap`);
  }
}

if (sitemapErrors.length > 0) {
  console.error(`❌ verify-seo: ${sitemapErrors.length} sitemap contract violation(s):`);
  for (const e of sitemapErrors) console.error(`   ${e}`);
  process.exit(1);
}
console.log(
  `✅ verify-seo: sitemap contract holds (${sitemapLocs.length} URLs, all prerendered, self-canonical, indexable)`
);

// ─── 3. Prerendered-content floors (visible chars inside #root) ──────────────

// Floors sit safely below current values so copy edits don't trip them, but
// far above the old ~250-char shells so a pipeline regression fails loudly.
const TEXT_FLOORS = [
  ['/', 2500],
  ['/pricing', 2000],
  ['/about', 1500],
  ['/faq', 1000],
  ['/blogs', 1200],
  ['/library', 1000],
  ['/solutions', 1000],
  ['/ai-workshops-san-diego', 900],
  ['/roadmap', 500],
  // TODO(Phase 4): raise to 2000 once the curriculum has a build-time source
  // of truth. /courses content is live Firestore that has drifted from the
  // repo seed data — prerendering a snapshot now would ship wrong content.
  ['/courses', 250],
];
const PATTERN_FLOORS = [
  [/^\/blogs\/./, 2000],
  [/^\/(library|solutions)\/./, 1200],
];
const DEFAULT_FLOOR = 150;

function floorFor(route) {
  const exact = TEXT_FLOORS.find(([r]) => r === route);
  if (exact) return exact[1];
  const pattern = PATTERN_FLOORS.find(([re]) => re.test(route));
  return pattern ? pattern[1] : DEFAULT_FLOOR;
}

function visibleTextLength(html) {
  const m = html.match(/<div id="root">([\s\S]*?)<\/div>\s*(?:<script|<\/body)/);
  const body = m ? m[1] : '';
  return body
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim().length;
}

const floorErrors = [];
for (const loc of sitemapLocs) {
  const route = loc.slice(BASE_URL.length) || '/';
  const file = routeToFile(route);
  if (!existsSync(file)) continue; // already reported by the sitemap contract
  const len = visibleTextLength(readFileSync(file, 'utf8'));
  const floor = floorFor(route);
  if (len < floor) {
    floorErrors.push(`${route}: ${len} visible chars in built HTML (floor ${floor})`);
  }
}

if (floorErrors.length > 0) {
  console.error(`❌ verify-seo: ${floorErrors.length} route(s) below prerendered-content floor:`);
  for (const e of floorErrors) console.error(`   ${e}`);
  process.exit(1);
}
console.log(`✅ verify-seo: prerendered-content floors hold for all ${sitemapLocs.length} routes`);

// ─── 4. Internal link graph — no sitemap route may be an orphan ──────────────

const sitemapRoutes = new Set(sitemapLocs.map((loc) => loc.slice(BASE_URL.length) || '/'));

function fileToRoute(file) {
  const rel = relPath(file);
  if (rel === 'build/index.html') return '/';
  const m = rel.match(/^build\/(.+)\/index\.html$/);
  return m ? `/${m[1]}` : null;
}

const inlinkCounts = new Map([...sitemapRoutes].map((r) => [r, 0]));
for (const file of walkHtml(BUILD_DIR)) {
  if (path.basename(file) === 'app-shell.html') continue;
  const fromRoute = fileToRoute(file);
  if (fromRoute === null) continue; // asset HTML (lead magnets etc.)
  const html = readFileSync(file, 'utf8');
  const seen = new Set();
  for (const match of html.matchAll(/<a href="(\/[^"#?]*)/g)) {
    let target = match[1];
    if (target.length > 1 && target.endsWith('/')) target = target.slice(0, -1);
    if (target === fromRoute || seen.has(target)) continue;
    seen.add(target);
    if (inlinkCounts.has(target)) {
      inlinkCounts.set(target, inlinkCounts.get(target) + 1);
    }
  }
}

const orphanErrors = [...inlinkCounts]
  .filter(([, count]) => count === 0)
  .map(([route]) => `${route}: 0 internal inlinks from other prerendered pages`);

if (orphanErrors.length > 0) {
  console.error(`❌ verify-seo: ${orphanErrors.length} orphan route(s) in the sitemap:`);
  for (const e of orphanErrors) console.error(`   ${e}`);
  process.exit(1);
}
const minInlinks = Math.min(...inlinkCounts.values());
console.log(
  `✅ verify-seo: link graph holds — every sitemap route has ≥${minInlinks} internal inlinks`
);
