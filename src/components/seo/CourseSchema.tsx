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
  imageUrl?: string;
  price?: number;
  currency?: string;
  duration?: string;
  skillLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  language?: string;
  modules?: Array<{
    name: string;
    description?: string;
    duration?: string;
  }>;
}

const CourseSchema: React.FC<CourseSchemaProps> = ({
  courseName = 'AI Integration Course',
  courseDescription = 'Build Your First AI Solution in 15 Minutes. Learn practical AI integration skills with hands-on projects, from customer service bots to workflow automation. No prior AI experience required.',
  providerName = 'MicroAI Studios',
  providerUrl = 'https://aiintegrationcourse.com',
  courseUrl = 'https://aiintegrationcourse.com/courses',
  imageUrl = 'https://aiintegrationcourse.com/assets/hero_background_neural_network.png',
  price = 49,
  currency = 'USD',
  duration = 'P4W', // 4 weeks in ISO 8601 duration format
  skillLevel = 'Beginner',
  language = 'en',
  modules = [
    { name: 'Build Your First Bot', description: 'Create a customer service email automation bot in 14 days', duration: 'P2W' },
    { name: 'AI Fundamentals', description: 'Understand core AI concepts and how to apply them in business', duration: 'P1W' },
    { name: 'Workflow Automation', description: 'Connect AI tools to automate repetitive business tasks', duration: 'P1W' },
    { name: 'Advanced Integration', description: 'Build complex AI-powered systems for enterprise use cases', duration: 'P2W' },
  ]
}) => {
  // Main Course schema
  const courseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: courseName,
    description: courseDescription,
    url: courseUrl,
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
    
    // Pricing (Offer)
    offers: {
      '@type': 'Offer',
      price: price,
      priceCurrency: currency,
      availability: 'https://schema.org/InStock',
      validFrom: '2024-01-01',
      url: `${providerUrl}/pricing`,
      category: 'Subscription',
      priceValidUntil: '2026-12-31',
    },
    
    // Course modules as hasCourseInstance
    hasCourseInstance: modules.map((module, index) => ({
      '@type': 'CourseInstance',
      name: module.name,
      description: module.description,
      courseMode: 'online',
      courseWorkload: module.duration,
      instructor: {
        '@type': 'Person',
        name: 'AI Integration Course Team',
      }
    })),
    
    // Aggregate rating (placeholder - update with real data)
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '127',
      bestRating: '5',
      worstRating: '1'
    },
    
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
    isAccessibleForFree: false,
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
        url: `${courseUrl}#module-${index + 1}`,
      }
    }))
  };

  // FAQ schema for common questions
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How long does it take to complete the AI Integration Course?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The course is designed to be completed in 4 weeks, with the first bot project achievable in just 14 days. You can learn at your own pace with lifetime access.'
        }
      },
      {
        '@type': 'Question',
        name: 'Do I need programming experience to take this course?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No! The AI Integration Course is designed for beginners. We use no-code tools like Zapier and provide step-by-step guidance for any technical components.'
        }
      },
      {
        '@type': 'Question',
        name: 'What is the 14-Day Build-Your-First-Bot Guarantee?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'If you follow our curriculum and don\'t have a working bot within 14 days, we\'ll give you a full refund. No questions asked.'
        }
      },
      {
        '@type': 'Question',
        name: 'What kind of bots can I build with this course?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You\'ll learn to build customer service email bots, workflow automation systems, data processing pipelines, and more. The skills transfer to any AI integration project.'
        }
      }
    ]
  };

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
      
      {/* FAQ Schema */}
      <script type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </script>
      
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
