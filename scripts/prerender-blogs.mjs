#!/usr/bin/env node
// Prerender routes to static HTML for AI crawlers (GPTBot, PerplexityBot,
// ClaudeBot) and other non-JS user agents.
//
// The site is a client-rendered SPA, so every route is an empty shell until
// React boots. This script runs as a postbuild step and produces:
//
//   1. build/blogs/<slug>/index.html — full article HTML + per-post meta +
//      BlogPosting/FAQPage/BreadcrumbList JSON-LD (from src/content/blogPosts.ts)
//   2. build/<route>/index.html — static marketing pages (pricing, about,
//      faq, ...) with per-route title/description/canonical and an h1+blurb
//      body (from scripts/route-meta.mjs)
//   3. build/index.html — homepage keeps its hand-written meta + Course
//      JSON-LD, gains a crawler-visible h1 + intro in #root
//   4. build/app-shell.html — the clean SPA fallback for unmatched routes
//      (firebase.json rewrites point here); homepage canonical and JSON-LD
//      are stripped so unknown routes don't claim homepage identity
//
// Firebase Hosting serves exact file matches before the SPA rewrite, so
// crawlers get real content while browsers hydrate into the normal app
// (ReactDOM.createRoot().render replaces the static #root content).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';
import {
  BASE_URL,
  REPO_ROOT,
  SITE_NAME,
  extractFAQs,
  loadBlogPosts,
  loadMarketingPages,
  loadPricingPlans,
  readPostMarkdown,
} from './blog-data.mjs';
import { homepage, staticRoutes } from './route-meta.mjs';
import { pageBodies, pricingCopy } from './page-copy.mjs';

const BUILD_DIR = path.join(REPO_ROOT, 'build');
const TEMPLATE_PATH = path.join(BUILD_DIR, 'index.html');

const escapeHtml = (str) =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const replaceMetaContent = (html, selectorRe, value) =>
  html.replace(selectorRe, (match) =>
    match.replace(/content="[^"]*"/, `content="${escapeHtml(value)}"`)
  );

const stripJsonLd = (html) =>
  html.replace(/[ \t]*<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/g, '');

const stripCanonical = (html) => html.replace(/[ \t]*<link rel="canonical"[^>]*>\n?/, '');

// Rewrites the shared head fields every prerendered page needs. og:type and
// JSON-LD are page-kind specific, so callers handle those.
// seoTitle (blogPosts.ts): compact <title> rendered verbatim (no suffix);
// og/twitter keep the full headline. Mirrors src/components/SEO.tsx.
function applyHeadMeta(html, { title, seoTitle, description, canonicalUrl, keywords, image }) {
  const fullTitle = seoTitle ? title : `${title} | ${SITE_NAME}`;
  const documentTitle = seoTitle || `${title} | ${SITE_NAME}`;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(documentTitle)}</title>`);
  html = replaceMetaContent(html, /<meta name="description"[^>]*>/, description);
  if (keywords) {
    html = replaceMetaContent(html, /<meta name="keywords"[^>]*>/, keywords.join(', '));
  }
  html = html.replace(
    /<link rel="canonical" href="[^"]*"/,
    `<link rel="canonical" href="${canonicalUrl}"`
  );
  html = replaceMetaContent(html, /<meta property="og:url"[^>]*>/, canonicalUrl);
  html = replaceMetaContent(html, /<meta property="og:title"[^>]*>/, fullTitle);
  html = replaceMetaContent(html, /<meta property="og:description"[^>]*>/, description);
  html = replaceMetaContent(html, /<meta name="twitter:title"[^>]*>/, fullTitle);
  html = replaceMetaContent(html, /<meta name="twitter:description"[^>]*>/, description);
  if (image) {
    html = replaceMetaContent(html, /<meta property="og:image"[^>]*>/, image);
    html = replaceMetaContent(html, /<meta name="twitter:image"[^>]*>/, image);
    // Page-specific image → the headline is the best available description.
    // Without an image override the template's hero-image alt stays put.
    html = replaceMetaContent(html, /<meta property="og:image:alt"[^>]*>/, title);
    html = replaceMetaContent(html, /<meta name="twitter:image:alt"[^>]*>/, title);
  }
  return html;
}

function injectRoot(html, bodyHtml, context) {
  const rootRe = /<div id="root">\s*<\/div>/;
  if (!rootRe.test(html)) {
    throw new Error(`Could not find empty <div id="root"> while prerendering ${context}`);
  }
  return html.replace(rootRe, `<div id="root">${bodyHtml}</div>`);
}

function writeRoute(routePath, html) {
  const outDir = path.join(BUILD_DIR, ...routePath.split('/').filter(Boolean));
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, 'index.html'), html);
}

// NOTE: no websiteSchema here on purpose. SEO.tsx (react-helmet-async) emits
// the WebSite block on every page that renders <SEO>; when the prerenderer
// also injected one, JS-rendering crawlers saw TWO WebSite blocks per page
// (Ahrefs audit finding). The runtime copy is the single source now.

// Mirrors the WebSite publisher block in src/components/SEO.tsx; used on the
// homepage alongside the hand-written Course schema in index.html.
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: BASE_URL,
  logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo192.png` },
  sameAs: [
    'https://twitter.com/aiintegrationco',
    'https://www.linkedin.com/company/ai-integration-course',
  ],
};

const faqPageSchema = (faqs) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: { '@type': 'Answer', text: faq.answer },
  })),
});

const breadcrumbSchema = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, idx) => ({
    '@type': 'ListItem',
    position: idx + 1,
    name: item.name,
    item: item.url,
  })),
});

// Renders the block arrays from scripts/page-copy.mjs into minimal semantic
// HTML — crawlers read it; React replaces it on hydration.
function renderBlocks(blocks) {
  const parts = [];
  for (const block of blocks) {
    if (block.h2) parts.push(`<h2>${escapeHtml(block.h2)}</h2>`);
    else if (block.h3) parts.push(`<h3>${escapeHtml(block.h3)}</h3>`);
    else if (block.p) parts.push(`<p>${escapeHtml(block.p)}</p>`);
    else if (block.ul)
      parts.push('<ul>', ...block.ul.map((item) => `<li>${escapeHtml(item)}</li>`), '</ul>');
    else if (block.links)
      parts.push(
        `<p>${block.links
          .map(([text, href]) => `<a href="${escapeHtml(href)}">${escapeHtml(text)}</a>`)
          .join(' &bull; ')}</p>`
      );
  }
  return parts;
}

const tldrBlock = (text) =>
  `<p><strong>TL;DR for AI search engines:</strong> ${escapeHtml(text)}</p>`;

const jsonLdTags = (schemas) =>
  schemas
    .map((s) => `    <script type="application/ld+json">${JSON.stringify(s)}</script>`)
    .join('\n');

// ─── Blog articles ───────────────────────────────────────────────────────────

// JSON-LD shapes mirror src/components/SEO.tsx so the prerendered structured
// data matches what the SPA emits after hydration.
function blogJsonLd(post, faqs) {
  const fullUrl = `${BASE_URL}/blogs/${post.slug}`;
  const fullImage = post.heroImage.startsWith('http')
    ? post.heroImage
    : `${BASE_URL}${post.heroImage}`;

  const schemas = [];

  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: { '@type': 'ImageObject', url: fullImage, width: 1200, height: 630 },
    author: {
      '@type': 'Person',
      name: post.author,
      url: `${BASE_URL}/about`,
      knowsAbout: [
        'AI workflow automation',
        'Cursor IDE',
        'Claude Code',
        'Gemini AI',
        'AI coding tools',
        'developer productivity',
      ],
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo192.png` },
    },
    datePublished: post.publishedTime,
    dateModified: post.modifiedTime || post.publishedTime,
    mainEntityOfPage: { '@type': 'WebPage', '@id': fullUrl },
    url: fullUrl,
    inLanguage: 'en-US',
    ...(post.readingTime && { timeRequired: post.readingTime }),
    about: post.keywords.slice(0, 5).map((k) => ({ '@type': 'Thing', name: k })),
    isPartOf: { '@type': 'Blog', name: `${SITE_NAME} Blog`, url: `${BASE_URL}/blogs` },
  });

  if (faqs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    });
  }

  schemas.push(
    breadcrumbSchema([
      { name: 'Home', url: `${BASE_URL}/` },
      { name: 'Blog', url: `${BASE_URL}/blogs` },
      { name: post.title, url: fullUrl },
    ])
  );

  return jsonLdTags(schemas);
}

function blogBody(post, articleHtml) {
  // Minimal semantic markup — crawlers read this; browsers replace it the
  // moment React hydrates, so no styling is needed.
  return [
    `<nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/blogs">Blog</a> / ${escapeHtml(post.title)}</nav>`,
    '<article>',
    `<p>${escapeHtml(post.eyebrow)}</p>`,
    `<h1>${escapeHtml(post.title)}</h1>`,
    `<p>${escapeHtml(formatDate(post.publishedTime))} &bull; ${escapeHtml(post.readingTime)} &bull; ${escapeHtml(post.author)}</p>`,
    `<p>${escapeHtml(post.summary)}</p>`,
    articleHtml,
    '</article>',
    `<p><a href="/pricing">Explore the AI Integration Course — $1 Pro trial</a></p>`,
    `<p><a href="/blogs">Back to all articles</a></p>`,
  ].join('\n');
}

function prerenderPost(template, post) {
  const markdown = readPostMarkdown(post);
  const articleHtml = marked.parse(markdown);
  const faqs = extractFAQs(markdown);
  const fullUrl = `${BASE_URL}/blogs/${post.slug}`;
  const fullImage = post.heroImage.startsWith('http')
    ? post.heroImage
    : `${BASE_URL}${post.heroImage}`;

  let html = applyHeadMeta(template, {
    title: post.title,
    seoTitle: post.seoTitle,
    description: post.description,
    canonicalUrl: fullUrl,
    keywords: post.keywords,
    image: fullImage,
  });
  html = replaceMetaContent(html, /<meta name="author"[^>]*>/, post.author);
  html = replaceMetaContent(html, /<meta property="og:type"[^>]*>/, 'article');
  html = stripJsonLd(html); // homepage Course schema — wrong entity for an article

  // data-rh: SEO.tsx re-emits these on hydration; marking them lets
  // react-helmet-async replace rather than duplicate them.
  const articleMeta = [
    `    <meta property="article:published_time" content="${escapeHtml(post.publishedTime)}" data-rh="true" />`,
    `    <meta property="article:modified_time" content="${escapeHtml(post.modifiedTime || post.publishedTime)}" data-rh="true" />`,
    `    <meta property="article:author" content="${escapeHtml(post.author)}" data-rh="true" />`,
    blogJsonLd(post, faqs),
  ].join('\n');
  html = html.replace('</head>', `${articleMeta}\n  </head>`);

  html = injectRoot(html, blogBody(post, articleHtml), `/blogs/${post.slug}`);
  writeRoute(`/blogs/${post.slug}`, html);
  return { faqCount: faqs.length, bytes: html.length };
}

// ─── Library articles & industry pages (src/content/marketingPages.ts) ──────

// Body mirrors ResourceDetailPage.tsx / IndustrySolutionPage.tsx: eyebrow,
// h1, description, audience, optional workflows list, then sections with
// h2 + body + bullets. All copy comes verbatim from marketingPages.ts.
function detailPageBody(basePath, crumbName, item) {
  const parts = [
    `<nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="${basePath}">${escapeHtml(crumbName)}</a> / ${escapeHtml(item.title)}</nav>`,
    '<article>',
    `<p>${escapeHtml(item.eyebrow)}</p>`,
    `<h1>${escapeHtml(item.title)}</h1>`,
    `<p>${escapeHtml(item.description)}</p>`,
    `<p>Audience: ${escapeHtml(item.audience)}</p>`,
    // Mirrors the visible TL;DR block on the detail pages (existing
    // description + audience re-rendered — no new copy).
    tldrBlock(`${item.description} Best for: ${item.audience}`),
  ];
  if (Array.isArray(item.workflows) && item.workflows.length > 0) {
    parts.push('<h2>Recommended first workflows</h2>', '<ul>');
    for (const workflow of item.workflows) {
      parts.push(`<li>${escapeHtml(workflow)}</li>`);
    }
    parts.push('</ul>');
  }
  for (const section of item.sections ?? []) {
    parts.push(`<h2>${escapeHtml(section.heading)}</h2>`, `<p>${escapeHtml(section.body)}</p>`);
    if (Array.isArray(section.bullets) && section.bullets.length > 0) {
      parts.push('<ul>');
      for (const bullet of section.bullets) {
        parts.push(`<li>${escapeHtml(bullet)}</li>`);
      }
      parts.push('</ul>');
    }
  }
  parts.push(
    '</article>',
    `<p><a href="/pricing">Explore the AI Integration Course — $1 Pro trial</a> &bull; <a href="${basePath}">Back to ${escapeHtml(crumbName)}</a></p>`
  );
  return parts.join('\n');
}

function prerenderDetailPage(template, { basePath, crumbName, item }) {
  const routePath = `${basePath}/${item.slug}`;
  const canonicalUrl = `${BASE_URL}${routePath}`;
  let html = applyHeadMeta(template, {
    title: item.title,
    description: item.description,
    canonicalUrl,
    keywords: item.keywords,
  });
  html = replaceMetaContent(html, /<meta property="og:type"[^>]*>/, 'article');
  html = stripJsonLd(html);
  // Client SEO.tsx renders these routes with type="article" (BlogPosting);
  // mirror the same core fields so raw HTML and hydrated DOM agree.
  const schemas = jsonLdTags([
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: item.title,
      description: item.description,
      author: { '@type': 'Person', name: 'Blaine Casey', url: `${BASE_URL}/about` },
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo192.png` },
      },
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
      url: canonicalUrl,
      inLanguage: 'en-US',
      about: (item.keywords ?? []).slice(0, 5).map((k) => ({ '@type': 'Thing', name: k })),
    },
    breadcrumbSchema([
      { name: 'Home', url: `${BASE_URL}/` },
      { name: crumbName, url: `${BASE_URL}${basePath}` },
      { name: item.title, url: canonicalUrl },
    ]),
  ]);
  html = html.replace('</head>', `${schemas}\n  </head>`);
  html = injectRoot(html, detailPageBody(basePath, crumbName, item), routePath);
  writeRoute(routePath, html);
}

// ─── Static marketing routes ─────────────────────────────────────────────────

// Plan cards for the prerendered /pricing body — rendered straight from
// src/config/pricing.ts so the crawler-visible tiers can never drift from
// the tiers the React page displays.
function pricingPlanParts({ plans, planKeys }) {
  const parts = [];
  for (const key of planKeys) {
    const plan = plans[key];
    if (!plan) continue;
    parts.push(`<h3>${escapeHtml(plan.name)}</h3>`);
    parts.push(`<p>$${plan.displayPrice}${escapeHtml(plan.intervalLabel)}</p>`);
    if (plan.tagline) parts.push(`<p>${escapeHtml(plan.tagline)}</p>`);
    const note = pricingCopy.planNotes[key];
    if (note) parts.push(`<p>${escapeHtml(note)}</p>`);
    const included = (plan.features ?? []).filter((f) => f.included);
    if (included.length > 0) {
      parts.push('<ul>', ...included.map((f) => `<li>${escapeHtml(f.text)}</li>`), '</ul>');
    }
  }
  return parts;
}

function staticRouteBody(route, ctx) {
  const parts = [
    `<nav aria-label="Breadcrumb"><a href="/">Home</a> / ${escapeHtml(route.h1)}</nav>`,
    '<main>',
    `<h1>${escapeHtml(route.h1)}</h1>`,
    `<p>${escapeHtml(route.blurb)}</p>`,
  ];
  // Full mirrored page copy (scripts/page-copy.mjs) for the marketing pages
  // that used to ship as ~250-char shells.
  if (pageBodies[route.path]) {
    parts.push(...renderBlocks(pageBodies[route.path]));
  }
  if (route.path === '/pricing') {
    parts.push(...renderBlocks(pricingCopy.hero));
    parts.push(...pricingPlanParts(ctx.pricing));
    parts.push(...renderBlocks(pricingCopy.afterPlans));
    parts.push(tldrBlock(ctx.pricingTldr));
    parts.push('<h2>Frequently Asked Questions</h2>');
    for (const faq of ctx.pricingFaqItems) {
      parts.push(`<h3>${escapeHtml(faq.question)}</h3>`, `<p>${escapeHtml(faq.answer)}</p>`);
    }
    parts.push(...renderBlocks(pricingCopy.objections));
  }
  if (route.listBlogPosts) {
    parts.push('<ul>');
    for (const post of ctx.posts) {
      parts.push(
        `<li><a href="/blogs/${post.slug}">${escapeHtml(post.title)}</a> — ${escapeHtml(post.description)}</li>`
      );
    }
    parts.push('</ul>');
  }
  // Index pages list their child pages (copy from marketingPages.ts), so the
  // leaves are discoverable from raw HTML instead of being crawl orphans.
  if (route.path === '/library') {
    for (const item of ctx.resourceLibraryItems) {
      parts.push(
        `<h2><a href="/library/${item.slug}">${escapeHtml(item.title)}</a></h2>`,
        `<p>${escapeHtml(item.summary ?? item.description)}</p>`,
        `<p>Best for: ${escapeHtml(item.audience)}</p>`
      );
    }
  }
  if (route.path === '/solutions') {
    for (const item of ctx.industryPages) {
      parts.push(
        `<h2><a href="/solutions/${item.slug}">${escapeHtml(item.title)}</a></h2>`,
        `<p>${escapeHtml(item.summary ?? item.description)}</p>`
      );
      const workflows = (item.workflows ?? []).slice(0, 3);
      if (workflows.length > 0) {
        parts.push('<ul>', ...workflows.map((w) => `<li>${escapeHtml(w)}</li>`), '</ul>');
      }
    }
  }
  if (route.includeFaqs && ctx.homepageFaqItems.length > 0) {
    // Same Q&A FAQPage.tsx renders, so the FAQPage JSON-LD matches visible
    // content in the raw HTML too. TL;DR mirrors the visible block.
    parts.push(tldrBlock(ctx.faqTldr));
    for (const faq of ctx.homepageFaqItems) {
      parts.push(`<h2>${escapeHtml(faq.question)}</h2>`, `<p>${escapeHtml(faq.answer)}</p>`);
    }
  }
  parts.push(
    '</main>',
    `<p><a href="/pricing">Start the $1 Pro trial</a> &bull; <a href="/blogs">Read the blog</a> &bull; <a href="/">Home</a></p>`
  );
  return parts.join('\n');
}

function prerenderStaticRoute(template, route, ctx) {
  const canonicalUrl = `${BASE_URL}${route.path}`;
  let html = applyHeadMeta(template, {
    title: route.title,
    seoTitle: route.seoTitle,
    description: route.description,
    canonicalUrl,
  });
  html = stripJsonLd(html); // homepage Course schema doesn't belong on subpages
  if (route.omitCanonical) {
    // noindex+nofollow utility routes (e.g. /checkout/start) carry no
    // canonical at all — the robots directive is the whole story.
    html = stripCanonical(html);
  }
  const headExtras = [];
  if (route.robots) {
    // Explicit robots override (e.g. "noindex, nofollow" on checkout).
    // data-rh lets react-helmet-async take ownership on hydration.
    headExtras.push(`    <meta name="robots" content="${route.robots}" data-rh="true" />`);
  } else if (route.noindex) {
    // Auth/utility pages: keep them crawlable (follow) so Bing sees the
    // directive, but out of the index. Must NOT be robots.txt-blocked.
    headExtras.push('    <meta name="robots" content="noindex, follow" />');
  } else {
    const schemas = [
      breadcrumbSchema([
        { name: 'Home', url: `${BASE_URL}/` },
        { name: route.h1, url: canonicalUrl },
      ]),
    ];
    if (route.includeFaqs && ctx.homepageFaqItems.length > 0) {
      schemas.push(faqPageSchema(ctx.homepageFaqItems));
    }
    if (route.path === '/pricing') {
      // Product + one Offer per real tier (src/config/pricing.ts), plus
      // FAQPage for the page's visible Q&A. NO review/aggregateRating —
      // no real reviews exist and none may be fabricated.
      schemas.push(pricingProductSchema(ctx.pricing, route.description));
      schemas.push(faqPageSchema(ctx.pricingFaqItems));
    }
    headExtras.push(jsonLdTags(schemas));
  }
  html = html.replace('</head>', `${headExtras.join('\n')}\n  </head>`);
  html = injectRoot(html, staticRouteBody(route, ctx), route.path);
  writeRoute(route.path, html);
  return { bytes: html.length };
}

// Offers reflect src/config/pricing.ts exactly; priceValidUntil matches the
// hand-written homepage Course schema (index.html).
function pricingProductSchema({ plans, planKeys }, description) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'AI Integration Course',
    description,
    brand: { '@type': 'Brand', name: SITE_NAME },
    url: `${BASE_URL}/pricing`,
    offers: planKeys
      .map((key) => plans[key])
      .filter(Boolean)
      .map((plan) => ({
        '@type': 'Offer',
        name: plan.name,
        price: Number(plan.displayPrice).toFixed(2),
        priceCurrency: 'USD',
        priceValidUntil: '2026-12-31',
        availability: 'https://schema.org/InStock',
        url: `${BASE_URL}/pricing`,
        ...(plan.tagline && { description: plan.tagline }),
      })),
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  if (!existsSync(TEMPLATE_PATH)) {
    console.error(`prerender: ${TEMPLATE_PATH} not found — run vite build first.`);
    process.exit(1);
  }
  const template = readFileSync(TEMPLATE_PATH, 'utf8');
  const posts = loadBlogPosts();
  const {
    resourceLibraryItems,
    industryPages,
    homepageFaqItems,
    pricingFaqItems,
    pricingTldr,
    faqTldr,
  } = loadMarketingPages();
  const ctx = {
    posts,
    resourceLibraryItems,
    industryPages,
    homepageFaqItems,
    pricingFaqItems,
    pricingTldr,
    faqTldr,
    pricing: loadPricingPlans(),
  };
  let failures = 0;

  // 1. Clean SPA fallback for unmatched routes (the ** rewrite target).
  // Strip homepage canonical + JSON-LD so arbitrary routes don't claim
  // homepage identity; React sets correct meta after hydration.
  // The shell serves only routes with no prerendered file — auth/app pages
  // (/dashboard, /login flows, /welcome, labs, …) — so it defaults to
  // noindex. data-rh lets SEO.tsx (react-helmet-async) replace the directive
  // on hydration for any legitimate SPA page that renders its own robots meta.
  writeFileSync(
    path.join(BUILD_DIR, 'app-shell.html'),
    stripCanonical(stripJsonLd(template)).replace(
      '</head>',
      '    <meta name="robots" content="noindex" data-rh="true" />\n  </head>'
    )
  );
  console.log('✅ app-shell.html written (SPA fallback, noindex by default)');

  // 2. Blog articles
  for (const post of posts) {
    try {
      const result = prerenderPost(template, post);
      console.log(
        `✅ prerendered /blogs/${post.slug} (${(result.bytes / 1024).toFixed(1)} KB, ${result.faqCount} FAQs)`
      );
    } catch (err) {
      failures += 1;
      console.error(`❌ failed to prerender /blogs/${post.slug}: ${err.message}`);
    }
  }

  // 3. Static marketing routes
  for (const route of staticRoutes) {
    try {
      prerenderStaticRoute(template, route, ctx);
      console.log(`✅ prerendered ${route.path}`);
    } catch (err) {
      failures += 1;
      console.error(`❌ failed to prerender ${route.path}: ${err.message}`);
    }
  }

  // 4. Library articles and industry pages (content from marketingPages.ts)
  const detailPages = [
    ...resourceLibraryItems.map((item) => ({
      basePath: '/library',
      crumbName: 'Library',
      item,
    })),
    ...industryPages.map((item) => ({
      basePath: '/solutions',
      crumbName: 'Solutions',
      item,
    })),
  ];
  for (const page of detailPages) {
    const routePath = `${page.basePath}/${page.item.slug}`;
    try {
      prerenderDetailPage(template, page);
      console.log(`✅ prerendered ${routePath}`);
    } catch (err) {
      failures += 1;
      console.error(`❌ failed to prerender ${routePath}: ${err.message}`);
    }
  }

  // 5. Homepage: keep its hand-written meta + Course JSON-LD, add
  // Organization JSON-LD and the full crawler-visible landing copy
  // (scripts/page-copy.mjs mirrors NewLandingPage.tsx). Must
  // happen last — earlier steps read the pristine template.
  try {
    const homepageBody = [
      '<main>',
      `<h1>${escapeHtml(homepage.h1)}</h1>`,
      `<p>${escapeHtml(homepage.blurb)}</p>`,
      ...renderBlocks(pageBodies['/']),
      `<p><a href="/pricing">Start the $1 Pro trial</a> &bull; <a href="/courses">Course overview</a> &bull; <a href="/blogs">Blog</a> &bull; <a href="/faq">FAQ</a></p>`,
      '</main>',
    ].join('\n');
    let homepageHtml = template.replace(
      '</head>',
      `${jsonLdTags([organizationSchema])}\n  </head>`
    );
    homepageHtml = injectRoot(homepageHtml, homepageBody, '/');
    writeFileSync(TEMPLATE_PATH, homepageHtml);
    console.log('✅ prerendered / (homepage body + Organization schema)');
  } catch (err) {
    failures += 1;
    console.error(`❌ failed to prerender homepage: ${err.message}`);
  }

  const total = posts.length + staticRoutes.length + detailPages.length + 1;
  console.log(`prerender: ${total - failures}/${total} routes prerendered`);
  if (failures > 0) process.exit(1);
}

main();
