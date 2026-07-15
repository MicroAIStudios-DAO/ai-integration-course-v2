#!/usr/bin/env node
// Ping IndexNow after a production deploy so Bing (which also feeds
// DuckDuckGo, Yahoo, and ChatGPT web search) indexes new/updated pages within
// minutes instead of waiting for a crawl.
//
// Reads the URL list from sitemap.xml (build copy preferred, public fallback)
// and submits it in one batch. The key is intentionally public: IndexNow
// verifies ownership by fetching /<key>.txt from the site root, so the key
// file in public/ must be deployed with hosting.
//
// Usage: node scripts/indexnow-ping.mjs   (also: npm run indexnow)
// Never fails the calling workflow — indexing is best-effort.

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from './blog-data.mjs';

const INDEXNOW_KEY = '5a47563e80625dc7c26b5f97d43eeb93';
const HOST = 'aiintegrationcourse.com';
// Bing's own endpoint (not the api.indexnow.org aggregator): submissions
// still propagate to all IndexNow engines, but hitting Bing directly makes
// them attributable in the Bing Webmaster Tools IndexNow dashboard.
const ENDPOINT = 'https://www.bing.com/indexnow';

function loadSitemapUrls() {
  const candidates = [
    path.join(REPO_ROOT, 'build', 'sitemap.xml'),
    path.join(REPO_ROOT, 'public', 'sitemap.xml'),
  ];
  const sitemapPath = candidates.find((p) => existsSync(p));
  if (!sitemapPath) return [];
  const xml = readFileSync(sitemapPath, 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1].trim().replace(/&amp;/g, '&'))
    .filter((url) => url.includes(HOST));
}

async function main() {
  const urls = loadSitemapUrls();
  if (urls.length === 0) {
    console.warn('indexnow-ping: no sitemap URLs found, skipping.');
    return;
  }

  const body = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
    urlList: urls,
  };

  console.log(`Submitting ${urls.length} URLs to IndexNow...`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));

  if (res.ok) {
    console.log(`✅ IndexNow accepted the submission (HTTP ${res.status})`);
  } else {
    console.warn(`⚠️ IndexNow returned HTTP ${res.status}: ${await res.text()}`);
  }
}

main().catch((err) => {
  // Best-effort by design — never break a deploy over an indexing ping.
  console.warn(`⚠️ indexnow-ping failed: ${err.message}`);
});
