import React from 'react';
import { Helmet } from 'react-helmet-async';

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
const DEFAULT_IMAGE = `${BASE_URL}/images/og-default.png`;
const SITE_NAME = 'AI Integration Course';
const DEFAULT_DESCRIPTION = 'Unlock your potential in the age of AI. Tools, insights, and strategies to outthink the hype and invest with confidence.';

export const SEO: React.FC<SEOProps> = ({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  publishedTime,
  modifiedTime,
  author = 'Golden Age Mindset',
  keywords = ['AI', 'artificial intelligence', 'machine learning', 'investment', 'course', 'education'],
  noindex = false,
  course
}) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Outthink the AI Hype`;
  const fullUrl = url ? `${BASE_URL}${url}` : BASE_URL;
  const fullImage = image.startsWith('http') ? image : `${BASE_URL}${image}`;

  // JSON-LD Structured Data
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: BASE_URL,
    description: DEFAULT_DESCRIPTION,
    publisher: {
      '@type': 'Organization',
      name: 'Golden Age Mindset',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/images/logo.png`
      }
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BASE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };

  const courseSchema = course ? {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.name,
    description: course.description,
    provider: {
      '@type': 'Organization',
      name: course.provider,
      sameAs: BASE_URL
    },
    ...(course.duration && { timeRequired: course.duration }),
    ...(course.price && {
      offers: {
        '@type': 'Offer',
        price: course.price,
        priceCurrency: course.currency || 'USD',
        availability: 'https://schema.org/InStock'
      }
    }),
    educationalLevel: 'Beginner to Advanced',
    teaches: keywords.slice(0, 5).join(', '),
    inLanguage: 'en',
    isAccessibleForFree: false,
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      courseWorkload: course.duration || 'PT10H'
    }
  } : null;

  const articleSchema = type === 'article' ? {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    image: fullImage,
    author: {
      '@type': 'Person',
      name: author
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/images/logo.png`
      }
    },
    datePublished: publishedTime,
    dateModified: modifiedTime || publishedTime,
    mainEntityOfPage: fullUrl
  } : null;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta name="author" content={author} />
      <link rel="canonical" href={fullUrl} />
      
      {/* Robots */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type === 'course' ? 'website' : type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:creator" content="@GoldenAgeMindset" />
      
      {/* Article specific */}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {author && <meta property="article:author" content={author} />}
      
      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>
      
      {courseSchema && (
        <script type="application/ld+json">
          {JSON.stringify(courseSchema)}
        </script>
      )}
      
      {articleSchema && (
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
      )}
      
      {/* PWA / Mobile */}
      <meta name="theme-color" content="#1a1a2e" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    </Helmet>
  );
};

export default SEO;
