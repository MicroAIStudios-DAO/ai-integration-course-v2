#!/usr/bin/env node
/**
 * Content quality gate.
 *
 * Validates a cornerstone article markdown before it may be published. The
 * acquisition cycle runs this on every draft; publishing is blocked unless it
 * passes. Enforces the rules in content/CONTENT_PLAN.md — real structure, real
 * internal links, and NO unsupported/dishonest claims.
 *
 * Usage:  node scripts/content-quality-gate.mjs <path-to-markdown> [more...]
 * Exit 0 = all passed, 1 = at least one failed.
 */
import fs from 'node:fs';

const MIN_WORDS = 700;
const INTERNAL_LINK_RE = /\]\((\/(roadmap|pricing|checkout\/start|courses|blogs)[^)]*)\)/g;

// Phrases that would make a claim unsupported/dishonest. Fail hard on these.
const BANNED = [
  /\baccredited\b/i,
  /\bguaranteed?\s+(income|results|returns|profit)\b/i,
  /\b#1\b/,
  /\bworld'?s\s+best\b/i,
  /\b(\d{2,3})%\s+guaranteed\b/i,
  /\bget\s+rich\b/i,
  /\bthousands\s+of\s+(students|graduates|customers)\b/i, // no fabricated counts
  /\blimited\s+time\s+only\b/i, // no fake scarcity
];

function checkFile(file) {
  const errors = [];
  let md;
  try {
    md = fs.readFileSync(file, 'utf8');
  } catch {
    return { file, ok: false, errors: ['file not readable'] };
  }

  const words = md.split(/\s+/).filter(Boolean).length;
  if (words < MIN_WORDS) errors.push(`too short: ${words} words (min ${MIN_WORDS})`);

  if (!/^#\s+.+/m.test(md)) errors.push('missing H1 title');
  if (!/tl;dr/i.test(md)) errors.push('missing TL;DR (AEO summary)');
  if (!/frequently asked questions|^##.*faq/im.test(md)) errors.push('missing FAQ section');

  const links = [...md.matchAll(INTERNAL_LINK_RE)].map((m) => m[1]);
  const hasConversionLink = links.some((l) => /roadmap|pricing|checkout\/start/.test(l));
  if (links.length < 2) errors.push(`needs >= 2 internal links (found ${links.length})`);
  if (!hasConversionLink) errors.push('needs a conversion link (/roadmap, /pricing, or /checkout/start)');

  for (const re of BANNED) {
    const m = md.match(re);
    if (m) errors.push(`unsupported/dishonest claim: "${m[0]}"`);
  }

  return { file, ok: errors.length === 0, errors, words };
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('Usage: node scripts/content-quality-gate.mjs <markdown> [more...]');
  process.exit(2);
}

let failed = 0;
for (const f of files) {
  const r = checkFile(f);
  if (r.ok) {
    console.log(`✓ PASS  ${f} (${r.words} words)`);
  } else {
    failed++;
    console.log(`✗ FAIL  ${f}`);
    for (const e of r.errors) console.log(`        - ${e}`);
  }
}
console.log(`\n${files.length - failed}/${files.length} passed.`);
process.exit(failed > 0 ? 1 : 0);
