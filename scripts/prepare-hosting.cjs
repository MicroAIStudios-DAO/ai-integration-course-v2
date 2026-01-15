#!/usr/bin/env node

/**
 * Prepare Firebase Hosting directory by syncing the CRA build output into
 * `public/` while preserving content assets that live alongside the app.
 *
 * This allows us to keep firebase.json pointing at `public/` without losing
 * lesson markdown, static assets, or the mobile env injector script that are
 * committed in the repo.
 */

const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const publicDir = path.join(rootDir, 'public');
const buildDir = path.join(rootDir, 'build');
const tmpDir = path.join(rootDir, '.tmp-public-preserve');

const preserveDirs = ['assets', 'course_content', 'md'];
const preserveFiles = ['mobile-env-inject.js'];

function ensureBuildExists() {
  if (!fs.existsSync(buildDir)) {
    throw new Error('Build output not found. Run `npm run build:production` first.');
  }
}

function resetDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function preserveContent() {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.mkdirSync(tmpDir, { recursive: true });

  for (const dirName of preserveDirs) {
    const src = path.join(publicDir, dirName);
    if (fs.existsSync(src)) {
      fs.cpSync(src, path.join(tmpDir, dirName), { recursive: true });
    }
  }

  for (const fileName of preserveFiles) {
    const src = path.join(publicDir, fileName);
    if (fs.existsSync(src)) {
      const dirName = path.dirname(fileName);
      if (dirName !== '.') {
        fs.mkdirSync(path.join(tmpDir, dirName), { recursive: true });
      }
      fs.cpSync(src, path.join(tmpDir, fileName));
    }
  }
}

function restoreContent() {
  if (!fs.existsSync(tmpDir)) return;

  const entries = fs.readdirSync(tmpDir);
  for (const entry of entries) {
    const src = path.join(tmpDir, entry);
    const dest = path.join(publicDir, entry);
    fs.cpSync(src, dest, { recursive: true });
  }

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

function copyBuildToPublic() {
  fs.cpSync(buildDir, publicDir, { recursive: true });
}

function main() {
  ensureBuildExists();
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  preserveContent();
  resetDir(publicDir);
  copyBuildToPublic();
  restoreContent();

  console.log('✔ Hosting directory prepared: build/ synced to public/ with preserved assets.');
}

main();
