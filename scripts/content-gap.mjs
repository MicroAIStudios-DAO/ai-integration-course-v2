#!/usr/bin/env node
/**
 * Content gap analysis — the acquisition cycle's daily "what to write next".
 *
 * Reads the priority list in content/CONTENT_PLAN.md, compares against what is
 * already published in public/blogs/, and prints the next unpublished slug plus
 * a coverage summary. Deterministic, zero external calls.
 *
 * Usage:  node scripts/content-gap.mjs [--next]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const plan = fs.readFileSync(path.join(root, 'content', 'CONTENT_PLAN.md'), 'utf8');

// Parse the "Priority order" numbered list.
const prioritySection = plan.split(/##\s*Priority order/i)[1] || '';
const priority = [...prioritySection.matchAll(/^\s*\d+\.\s*([a-z0-9-]+)\s*$/gim)].map((m) => m[1]);

const publishedDir = path.join(root, 'public', 'blogs');
const published = new Set(
  fs.readdirSync(publishedDir).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''))
);

const remaining = priority.filter((slug) => !published.has(slug));

if (process.argv.includes('--next')) {
  process.stdout.write(remaining[0] || '');
  process.exit(0);
}

console.log(`Published articles: ${published.size}`);
console.log(`Priority queue: ${priority.length} · remaining: ${remaining.length}`);
console.log(`\nNext to write: ${remaining[0] || '(queue empty — plan more clusters)'}`);
if (remaining.length) {
  console.log('\nRemaining priority order:');
  remaining.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
}
