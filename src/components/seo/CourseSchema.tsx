import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * CourseSchema Component
 * 
 * Implements Course structured data (Schema.org) for SEO
 * This helps search engines understand the course content and display rich results
 * 
 * Schema types used:
 * - Course: Main course information
 * - ItemList: List of course modules/lessons
 * - Organization: Provider information
 * - Offer: Pricing information
 * 
 * @see https://schema.org/Course
 * @see https://developers.google.com/search/docs/appearance/structured-data/course
 */

interface CourseSchemaProps {
  courseName?: string;
  courseDescription?: string;
  providerName?: string;
  providerUrl?: string;
  courseUrl?: string;
  pageUrl?: string;
  pageTitle?: string;
  pageDescription?: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
  duration?: string;
  skillLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  language?: string;
  isAccessibleForFree?: boolean;
  breadcrumbItems?: Array<{
    name: string;
    item: string;
  }>;
  modules?: Array<{
    name: string;
    description?: string;
    duration?: string;
    url?: string;
  }>;
  faqItems?: Array<{
    question: string;
    answer: string;
  }>;
  includeFaqSchema?: boolean;
  videoObject?: {
    name: string;
    description: string;
    url: string;
    embedUrl: string;
    thumbnailUrl: string;
    uploadDate: string;
    duration?: string;
    clips?: Array<{
      name: string;
      startOffset: number;
      endOffset?: number;
      url: string;
    }>;
  };
  includeVideoSchema?: boolean;
}

const CourseSchema: React.FC<CourseSchemaProps> = ({
  courseName = 'AI Integration Course',
  courseDescription = 'Build Your First AI Solution in 15 Minutes. Learn practical AI integration skills with hands-on projects, from customer service bots to workflow automation. No prior AI experience required.',
  providerName = 'MicroAI Studios',
  providerUrl = 'https://aiintegrationcourse.com',
  courseUrl = 'https://aiintegrationcourse.com/courses',
  pageUrl,
  pageTitle,
  pageDescription,
  imageUrl = 'https://aiintegrationcourse.com/assets/hero_background_neural_network.png/hero_background_neural_network.png',
  price,
  currency = 'USD',
  duration = 'P4W', // 4 weeks in ISO 8601 duration format
  skillLevel = 'Beginner',
  language = 'en',
  isAccessibleForFree = false,
  breadcrumbItems = [],
  faqItems = [],
  includeFaqSchema = false,
  videoObject,
  includeVideoSchema = false,
  modules = [
    { name: 'Build Your First Bot', description: 'Create a customer service email automation bot in 14 days', duration: 'P2W' },
    { name: 'AI Fundamentals', description: 'Understand core AI concepts and how to apply them in business', duration: 'P1W' },
    { name: 'Workflow Automation', description: 'Connect AI tools to automate repetitive business tasks', duration: 'P1W' },
    { name: 'Advanced Integration', description: 'Build complex AI-powered systems for enterprise use cases', duration: 'P2W' },
  ]
}) => {
  const resolvedPageUrl = pageUrl || courseUrl;

  // Main Course schema
  const courseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: courseName,
    description: courseDescription,
    url: courseUrl,
    mainEntityOfPage: resolvedPageUrl,
    image: imageUrl,
    inLanguage: language,
    coursePrerequisites: 'No prior AI or programming experience required',
    educationalLevel: skillLevel,
    timeRequired: duration,
    
    // Provider (Organization)
    provider: {
      '@type': 'Organization',
      name: providerName,
      url: providerUrl,
      logo: `${providerUrl}/logo192.png`,
      sameAs: [
        'https://twitter.com/aiintegrationco',
      ]
    },
    
    ...(typeof price === 'number' ? {
      offers: {
        '@type': 'Offer',
        price: price,
        priceCurrency: currency,
        availability: 'https://schema.org/InStock',
        validFrom: '2024-01-01',
        url: `${providerUrl}/pricing`,
        category: 'Subscription',
        priceValidUntil: '2026-12-31',
      }
    } : {}),
    
    // Course modules as hasCourseInstance
    hasCourseInstance: modules.map((module, index) => ({
      '@type': 'CourseInstance',
      name: module.name,
      description: module.description,
      courseMode: 'online',
      courseWorkload: module.duration,
      instructor: {
        '@type': 'Person',
        name: 'Blaine Casey',
      }
    })),

    // What students will learn
    teaches: [
      'Build AI-powered automation bots',
      'Integrate AI tools into existing workflows',
      'Create customer service email automation',
      'Connect APIs and automate business processes',
      'Deploy production-ready AI solutions'
    ],
    
    // Skills gained
    competencyRequired: 'None',
    educationalCredentialAwarded: 'Certificate of Completion',
    
    // Additional metadata
    isAccessibleForFree,
    hasPart: modules.map((module, index) => ({
      '@type': 'Course',
      name: module.name,
      description: module.description,
      position: index + 1,
    }))
  };

  // ItemList schema for course modules
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${courseName} - Course Modules`,
    description: 'Complete list of modules in the AI Integration Course',
    numberOfItems: modules.length,
    itemListElement: modules.map((module, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Course',
        name: module.name,
        description: module.description,
        url: module.url || `${courseUrl}#module-${index + 1}`,
      }
    }))
  };

  const faqSchema = includeFaqSchema && faqItems.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
    } : null;

  const videoSchema = includeVideoSchema && videoObject ? {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: videoObject.name,
    description: videoObject.description,
    thumbnailUrl: [videoObject.thumbnailUrl],
    uploadDate: videoObject.uploadDate,
    duration: videoObject.duration || 'PT2M',
    contentUrl: videoObject.url,
    embedUrl: videoObject.embedUrl,
    publisher: {
      '@type': 'Organization',
      name: providerName,
      logo: {
        '@type': 'ImageObject',
        url: `${providerUrl}/logo192.png`
      }
    },
    potentialAction: {
      '@type': 'SeekToAction',
      target: `${videoObject.url}${videoObject.url.includes('?') ? '&' : '?'}t={seek_to_second_number}`,
      'startOffset-input': 'required name=seek_to_second_number'
    },
    ...(videoObject.clips && videoObject.clips.length > 0 ? {
      hasPart: videoObject.clips.map((clip) => ({
        '@type': 'Clip',
        name: clip.name,
        startOffset: clip.startOffset,
        ...(typeof clip.endOffset === 'number' ? { endOffset: clip.endOffset } : {}),
        url: clip.url
      }))
    } : {})
  } : null;

  const webpageSchema = resolvedPageUrl
    ? {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: pageTitle || courseName,
        description: pageDescription || courseDescription,
        url: resolvedPageUrl,
        isPartOf: {
          '@type': 'WebSite',
          name: providerName,
          url: providerUrl,
        },
        about: {
          '@type': 'Course',
          name: courseName,
          url: courseUrl,
        },
      }
    : null;

  const breadcrumbSchema = breadcrumbItems.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbItems.map((crumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.name,
          item: crumb.item,
        })),
      }
    : null;

  // Organization schema
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: providerName,
    url: providerUrl,
    logo: `${providerUrl}/logo192.png`,
    description: 'AI Integration Course helps professionals integrate AI into their business workflows with practical, hands-on training.',
    foundingDate: '2024',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'support@aiintegrationcourse.com',
      availableLanguage: 'English'
    },
    sameAs: [
      'https://twitter.com/aiintegrationco'
    ]
  };

  return (
    <Helmet>
      {/* Course Schema */}
      <script type="application/ld+json">
        {JSON.stringify(courseSchema)}
      </script>
      
      {/* ItemList Schema */}
      <script type="application/ld+json">
        {JSON.stringify(itemListSchema)}
      </script>

      {/* WebPage Schema */}
      {webpageSchema && (
        <script type="application/ld+json">
          {JSON.stringify(webpageSchema)}
        </script>
      )}

      {/* Breadcrumb Schema */}
      {breadcrumbSchema && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      )}
      
      {/* FAQ Schema */}
      {faqSchema && (
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      )}

      {/* VideoObject Schema */}
      {videoSchema && (
        <script type="application/ld+json">
          {JSON.stringify(videoSchema)}
        </script>
      )}
      
      {/* Organization Schema */}
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
    </Helmet>
  );
};

export default CourseSchema;

/**
 * Export individual schemas for use in specific pages
 */
export const generateCourseSchema = (props: CourseSchemaProps) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: props.courseName || 'AI Integration Course',
    description: props.courseDescription || 'Learn practical AI integration skills',
    provider: {
      '@type': 'Organization',
      name: props.providerName || 'MicroAI Studios',
      url: props.providerUrl || 'https://aiintegrationcourse.com'
    }
  };
};
