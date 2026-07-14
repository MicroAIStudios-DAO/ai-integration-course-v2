#!/usr/bin/env node
// Inject an auto-generated "Guides & Articles" section into llms.txt.
//
// public/llms.txt stays the hand-edited source; this postbuild step reads it,
// inserts a section listing every article from src/content/blogPosts.ts
// (including the raw-markdown URLs AI crawlers can ingest directly), and
// writes the result to build/llms.txt so the deployed file always reflects
// the current article catalog without manual edits.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { BASE_URL, REPO_ROOT, loadBlogPosts } from './blog-data.mjs';

const SOURCE_PATH = path.join(REPO_ROOT, 'public', 'llms.txt');
const OUTPUT_PATH = path.join(REPO_ROOT, 'build', 'llms.txt');
const SECTION_HEADING = '## Guides & Articles';

function buildGuidesSection(posts) {
  const entries = posts
    .slice()
    .sort((a, b) => new Date(b.publishedTime) - new Date(a.publishedTime))
    .map((post) => {
      const publishedDate = post.publishedTime.split('T')[0];
      return [
        `### [${post.title}](${BASE_URL}/blogs/${post.slug})`,
        `* **Summary**: ${post.description}`,
        `* **Published**: ${publishedDate} · ${post.readingTime}`,
        `* **Raw Markdown** (clean full text for LLM ingestion): ${BASE_URL}${post.markdownPath}`,
      ].join('\n');
    });

  return [
    SECTION_HEADING,
    '',
    'Free in-depth guides on AI integration, production RAG, multi-agent architecture, and AI tooling. Each article is also available as clean markdown at the listed `.md` URL.',
    '',
    entries.join('\n\n'),
  ].join('\n');
}

function main() {
  let base = readFileSync(SOURCE_PATH, 'utf8').replace(/\r\n/g, '\n');

  // Idempotency: strip a previously generated section if present.
  const sectionRe = new RegExp(`${SECTION_HEADING}[\\s\\S]*?(?=\\n---|\\n## |$)`);
  base = base.replace(sectionRe, '').replace(/\n{3,}/g, '\n\n');

  const posts = loadBlogPosts();
  const guides = buildGuidesSection(posts);

  // Insert ahead of the AEO guidance section so real content leads; append if
  // that heading ever moves.
  const anchor = '## Answer Engine Optimization';
  const anchorIdx = base.indexOf(anchor);
  const output =
    anchorIdx !== -1
      ? `${base.slice(0, anchorIdx)}${guides}\n\n---\n\n${base.slice(anchorIdx)}`
      : `${base.trimEnd()}\n\n---\n\n${guides}\n`;

  if (!existsSync(path.dirname(OUTPUT_PATH))) {
    console.error('generate-llms-guides: build/ not found — run vite build first.');
    process.exit(1);
  }
  writeFileSync(OUTPUT_PATH, output);
  console.log(`✅ build/llms.txt updated with ${posts.length} guides`);
}

main();
