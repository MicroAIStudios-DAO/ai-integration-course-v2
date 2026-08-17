import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { homepageFaqItems } from '../src/content/marketingPages';

const root = resolve(__dirname, '..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

describe('CRO and SEO batch', () => {
  it('keeps intent links pointed at the trial page', () => {
    expect(read('src/pages/NewLandingPage.tsx')).toContain('to="/start-trial"');
    expect(homepageFaqItems.find((item) => item.question.startsWith('Is this course'))?.link).toEqual({
      label: 'Start the $1 seven-day trial',
      href: '/start-trial',
    });
  });

  it('prerenders lead capture and keeps gated course shells out of crawlers', () => {
    expect(read('scripts/prerender-blogs.mjs')).toContain('Email capture form');
    expect(read('public/robots.txt')).toContain('Disallow: /courses/*/');
    expect(read('public/sitemap.xml')).not.toContain('/courses/course_');
  });

  it('writes lead capture consent and source path to the existing leads collection', () => {
    const source = read('functions/src/leadMagnet.ts');
    expect(source).toContain(".collection(LEADS_COLLECTION).doc(email)");
    expect(source).toContain('sourcePath: pagePath');
    expect(source).toContain('consent: marketingConsent');
    expect(source).not.toMatch(/^\s+marketingConsent,\s*$/m);
  });
});
