#!/usr/bin/env node
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

async function copyDir(src, dest) {
  await fsp.mkdir(dest, { recursive: true });
  const entries = await fsp.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) {
      await copyDir(s, d);
    } else if (e.isFile()) {
      await fsp.copyFile(s, d);
    }
  }
}

async function main() {
  // From repo root lessons/ into web/content/lessons
  const here = __dirname; // web/scripts
  const repoRoot = path.resolve(here, '..', '..');
  const src = path.join(repoRoot, 'lessons');
  const dest = path.resolve(here, '..', 'content', 'lessons');
  if (!fs.existsSync(src)) {
    console.warn('[copy-lessons] no lessons directory found at', src);
    return;
  }
  await copyDir(src, dest);
  console.log('[copy-lessons] copied lessons to', dest);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

