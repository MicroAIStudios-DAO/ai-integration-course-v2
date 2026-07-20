#!/usr/bin/env node
/**
 * Remove gated lesson markdown from the hosted build.
 *
 * public/course_content/lessons/*.md are the SOURCE files for the Storage
 * upload pipeline (scripts/upload_lessons_to_storage.py) — they include every
 * premium lesson body. Vite copies public/ verbatim into build/, and hosting
 * serves build/, so without this step the premium markdown is publicly
 * reachable at /course_content/lessons/<file>.md, bypassing firestore.rules
 * and storage.rules entirely.
 *
 * Runs as part of postbuild. Deletes the markdown from build/ only — the
 * tracked sources in public/ stay put for the upload script.
 */
import { rm, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const target = resolve(process.cwd(), 'build', 'course_content', 'lessons');

try {
  await stat(target);
} catch {
  console.log('strip-gated-content: build/course_content/lessons not present — nothing to strip');
  process.exit(0);
}

await rm(target, { recursive: true, force: true });
console.log('✅ strip-gated-content: removed build/course_content/lessons from the hosted output');
