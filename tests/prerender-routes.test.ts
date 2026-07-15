/**
 * Prerender output contract.
 *
 * Asserts every prerendered marketing route in build/ carries a
 * self-referencing canonical and a non-empty H1, auth pages carry
 * noindex, and the SPA fallback (app-shell.html) claims no identity.
 *
 * Requires a prior `npm run build` (postbuild runs scripts/prerender-blogs.mjs);
 * the suite skips itself when build/ is absent so plain `vitest` runs stay green.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const BUILD_DIR = path.join(__dirname, '..', 'build');
const BASE_URL = 'https://aiintegrationcourse.com';

const INDEXABLE_ROUTES = [
  '/pricing',
  '/about',
  '/faq',
  '/contact',
  '/blogs',
  '/library',
  '/library/rag-for-small-business',
  '/solutions',
  '/solutions/real-estate',
  '/ai-workshops-san-diego',
  '/start-trial',
  '/privacy',
  '/courses',
  '/blogs/workflow-complete-guide',
];

const NOINDEX_ROUTES = ['/login', '/signup'];

const routeFile = (route: string) =>
  path.join(BUILD_DIR, ...route.split('/').filter(Boolean), 'index.html');

const hasBuild = existsSync(path.join(BUILD_DIR, 'index.html'));

describe.skipIf(!hasBuild)('prerendered routes (build/)', () => {
  it.each(INDEXABLE_ROUTES)('%s has a self-canonical and a non-empty H1', (route) => {
    const file = routeFile(route);
    expect(existsSync(file), `${file} missing — prerender did not cover ${route}`).toBe(true);
    const html = readFileSync(file, 'utf8');

    const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
    expect(canonical, `${route}: canonical tag missing`).toBe(`${BASE_URL}${route}`);

    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]?.trim();
    expect(h1, `${route}: H1 missing or empty`).toBeTruthy();

    expect(html, `${route}: title is still the homepage default`).not.toContain(
      '<title>Advanced AI Integration & Systems Engineering | AI Integration Course</title>'
    );

    // Bing SEO limits (blog articles excluded — their titles are content-led).
    // Lengths measured on decoded text, as search engines render them.
    // 65 (not 60) leaves headroom for the brand suffix on detail pages while
    // still catching double-branded titles like the 77-char /about regression.
    if (!route.startsWith('/blogs/')) {
      const decode = (s: string) =>
        s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      const title = decode(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '');
      expect(
        title.length,
        `${route}: title "${title}" is ${title.length} chars (max 65)`
      ).toBeLessThanOrEqual(65);
      const desc = decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '');
      expect(
        desc.length,
        `${route}: meta description is ${desc.length} chars (max 160)`
      ).toBeLessThanOrEqual(160);
    }
  });

  it('homepage keeps its own canonical and gains an H1', () => {
    const html = readFileSync(path.join(BUILD_DIR, 'index.html'), 'utf8');
    expect(html).toContain(`<link rel="canonical" href="${BASE_URL}/"`);
    expect(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]?.trim()).toBeTruthy();
  });

  it.each(NOINDEX_ROUTES)('%s carries noindex, follow', (route) => {
    const html = readFileSync(routeFile(route), 'utf8');
    expect(html).toContain('<meta name="robots" content="noindex, follow"');
  });

  it('app-shell.html has no canonical and no JSON-LD', () => {
    const html = readFileSync(path.join(BUILD_DIR, 'app-shell.html'), 'utf8');
    expect(html).not.toContain('rel="canonical"');
    expect(html).not.toContain('application/ld+json');
  });
});
