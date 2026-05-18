import React from 'react';
import { Helmet } from 'react-helmet-async';

interface FAQItem {
  question: string;
  answer: string;
}

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'course';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  keywords?: string[];
  noindex?: boolean;
  readingTime?: string;
  faqs?: FAQItem[];
  breadcrumbs?: { name: string; url: string }[];
  course?: {
    name: string;
    description: string;
    provider: string;
    duration?: string;
    price?: string;
    currency?: string;
  };
}

const BASE_URL = 'https://aiintegrationcourse.com';
const DEFAULT_IMAGE = `${BASE_URL}/assets/hero_background_neural_network.png/hero_background_neural_network.png`;
const SITE_NAME = 'AI Integration Course';
const DEFAULT_DESCRIPTION =
  'Practical AI automation training for business owners and developers. Learn Gemini API integration, workflow automation, and real deployment patterns.';

export const SEO: React.FC<SEOProps> = ({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  publishedTime,
  modifiedTime,
  author = 'Blaine Casey',
  keywords = [
    'AI integration course',
    'Gemini API with Python',
    'AI business automation',
    'AI workflow automation',
    'AI course for non-coders',
  ],
  noindex = false,
  readingTime,
  faqs,
  breadcrumbs,
  course,
}) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Practical AI Automation Training`;
  const fullUrl = url ? `${BASE_URL}${url}` : BASE_URL;
  const fullImage = image.startsWith('http') ? image : `${BASE_URL}${image}`;

  // ── WebSite Schema ───────────────────────────────────────────────────────
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: BASE_URL,
    description: DEFAULT_DESCRIPTION,
    publisher: {
      '@type': 'Organization',
      name: 'MicroAI Studios',
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo192.png` },
    },
    // GEO: sameAs signals for AI search engines
    sameAs: [
      'https://twitter.com/aiintegrationco',
      'https://www.linkedin.com/company/ai-integration-course',
    ],
  };

  // ── Article / BlogPosting Schema (LLMO + GEO enriched) ──────────────────
  const articleSchema =
    type === 'article'
      ? {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: title,
          description: description,
          image: {
            '@type': 'ImageObject',
            url: fullImage,
            width: 1200,
            height: 630,
          },
          author: {
            '@type': 'Person',
            name: author,
            url: `${BASE_URL}/about`,
            // LLMO: explicit expertise signals
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
          datePublished: publishedTime,
          dateModified: modifiedTime || publishedTime,
          mainEntityOfPage: { '@type': 'WebPage', '@id': fullUrl },
          url: fullUrl,
          inLanguage: 'en-US',
          // GEO: timeRequired helps AI engines understand content depth
          ...(readingTime && { timeRequired: readingTime }),
          // LLMO: keywords as about entities
          about: keywords.slice(0, 5).map((k) => ({ '@type': 'Thing', name: k })),
          // GEO: isPartOf signals site authority to AI crawlers
          isPartOf: {
            '@type': 'Blog',
            name: `${SITE_NAME} Blog`,
            url: `${BASE_URL}/blogs`,
          },
        }
      : null;

  // ── Course Schema ────────────────────────────────────────────────────────
  const courseSchema = course
    ? {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: course.name,
        description: course.description,
        provider: {
          '@type': 'Organization',
          name: course.provider,
          sameAs: BASE_URL,
        },
        ...(course.duration && { timeRequired: course.duration }),
        ...(course.price && {
          offers: {
            '@type': 'Offer',
            price: course.price,
            priceCurrency: course.currency || 'USD',
            availability: 'https://schema.org/InStock',
          },
        }),
        educationalLevel: 'Beginner to Advanced',
        teaches: keywords.slice(0, 5).join(', '),
        inLanguage: 'en',
        isAccessibleForFree: false,
        hasCourseInstance: {
          '@type': 'CourseInstance',
          courseMode: 'online',
          courseWorkload: course.duration || 'PT10H',
        },
      }
    : null;

  // ── FAQPage Schema (GEO + LLMO: direct answers for AI snippet extraction) ─
  const faqSchema =
    faqs && faqs.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer,
            },
          })),
        }
      : null;

  // ── BreadcrumbList Schema (GEO: navigation context for AI engines) ────────
  const breadcrumbSchema =
    breadcrumbs && breadcrumbs.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: breadcrumbs.map((crumb, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: crumb.name,
            item: crumb.url.startsWith('http') ? crumb.url : `${BASE_URL}${crumb.url}`,
          })),
        }
      : null;

  return (
    <Helmet>
      {/* ── Basic Meta ──────────────────────────────────────────────────── */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta name="author" content={author} />
      <link rel="canonical" href={fullUrl} />

      {/* ── Robots ──────────────────────────────────────────────────────── */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta
          name="robots"
          content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        />
      )}

      {/* ── GEO: Explicit signals for AI search engines ─────────────────── */}
      <meta name="googlebot" content="index, follow" />
      <meta name="bingbot" content="index, follow" />
      {/* Perplexity, ChatGPT, and Gemini crawlers respect these */}
      <meta name="ai-content-declaration" content="human-authored" />
      <meta name="content-type" content={type === 'article' ? 'blog-post' : 'webpage'} />
      {publishedTime && <meta name="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta name="article:modified_time" content={modifiedTime} />}

      {/* ── Open Graph ──────────────────────────────────────────────────── */}
      <meta property="og:type" content={type === 'course' ? 'website' : type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />

      {/* ── Twitter / X Card ────────────────────────────────────────────── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:creator" content="@aiintegrationco" />
      <meta name="twitter:site" content="@aiintegrationco" />

      {/* ── Article-specific OG ─────────────────────────────────────────── */}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {author && <meta property="article:author" content={author} />}
      {keywords.slice(0, 6).map((kw) => (
        <meta key={kw} property="article:tag" content={kw} />
      ))}

      {/* ── JSON-LD: WebSite ─────────────────────────────────────────────── */}
      <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>

      {/* ── JSON-LD: Article / BlogPosting ──────────────────────────────── */}
      {articleSchema && (
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
      )}

      {/* ── JSON-LD: Course ──────────────────────────────────────────────── */}
      {courseSchema && (
        <script type="application/ld+json">{JSON.stringify(courseSchema)}</script>
      )}

      {/* ── JSON-LD: FAQPage (GEO + LLMO) ───────────────────────────────── */}
      {faqSchema && (
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      )}

      {/* ── JSON-LD: BreadcrumbList ──────────────────────────────────────── */}
      {breadcrumbSchema && (
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      )}

      {/* ── PWA / Mobile ────────────────────────────────────────────────── */}
      <meta name="theme-color" content="#1a1a2e" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    </Helmet>
  );
};

export default SEO;
