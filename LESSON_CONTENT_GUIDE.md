# Lesson Content Management Guide

## How to Add Lesson Content

The AI Integration Course now supports multiple ways to add lesson content. Here's how to add content to your lessons:

### Method 1: Direct Content in Firestore (Recommended)

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project**: AI-INTEGRA-COURSE-V2
3. **Navigate to Firestore Database**
4. **Find your lesson**: `courses/{courseId}/modules/{moduleId}/lessons/{lessonId}`
5. **Add a `content` field** with your lesson text in Markdown format

Example content structure:
```markdown
# Investment Strategies: VC, Public Markets, ETFs

## Introduction
Welcome to this comprehensive lesson on investment strategies in the AI sector.

## Learning Objectives
By the end of this lesson, you will:
- Understand different investment vehicles for AI companies
- Learn how to evaluate AI investment opportunities
- Discover strategies for portfolio diversification

## Venture Capital (VC) Investments
Venture capital represents one of the most direct ways to invest in early-stage AI companies...

## Public Markets
Public market investments offer liquidity and transparency...

## Exchange-Traded Funds (ETFs)
ETFs provide diversified exposure to the AI sector...

## Key Takeaways
- Diversification is crucial in AI investing
- Each investment vehicle has unique risk/reward profiles
- Due diligence is essential for all AI investments
```

### Method 2: Firebase Storage (Advanced)

1. Upload markdown files to Firebase Storage
2. Set the `storagePath` field in your lesson document
3. The system will automatically fetch and display the content

### Method 3: Automatic Fallback

If no content is provided, the system automatically generates a professional placeholder with:
- Lesson title and overview
- Duration information
- Learning objectives template
- "Content coming soon" message

## Content Formatting Tips

### Use Markdown for Rich Formatting
- `# Heading 1` for main sections
- `## Heading 2` for subsections
- `**bold text**` for emphasis
- `*italic text*` for emphasis
- `- bullet points` for lists
- `> blockquotes` for important notes

### Textbook-Style Features
The lesson content is automatically styled to look like a professional textbook with:
- Beautiful typography
- Proper spacing and margins
- Professional color scheme
- Mobile-responsive design
- Print-friendly layout

### Adding Images
To add images to your lessons:
1. Upload images to Firebase Storage
2. Get the download URL
3. Use markdown image syntax: `![Alt text](image-url)`

### Adding Videos
Set the `videoUrl` field in your lesson document with:
- YouTube URLs
- Vimeo URLs
- Direct video file URLs

## Lesson Fields Reference

```typescript
{
  id: string;           // Auto-generated
  title: string;        // Lesson title
  order: number;        // Display order
  isFree: boolean;      // Free or premium
  content?: string;     // Direct markdown content (recommended)
  storagePath?: string; // Path to markdown file in storage
  videoUrl?: string;    // Video URL (YouTube, Vimeo, etc.)
  durationMinutes?: number; // Estimated duration
  description?: string; // Short description
}
```

## Best Practices

1. **Keep content focused**: Each lesson should cover 1-3 related concepts
2. **Use clear headings**: Help students navigate the content
3. **Include examples**: Real-world examples make concepts clearer
4. **Add takeaways**: Summarize key points at the end
5. **Optimize for mobile**: Content is automatically responsive
6. **Test on different devices**: Ensure readability across platforms

## Content Ideas for AI Integration Course

### Introduction to AI Module
- AI fundamentals and terminology
- Current AI landscape overview
- AI adoption in different industries
- Future trends and predictions

### Investment Strategies Module
- VC investment basics
- Public market analysis
- ETF selection criteria
- Risk management strategies

### Practical Applications Module
- AI tools for business
- Implementation strategies
- Case studies and examples
- ROI measurement

## Getting Help

If you need assistance adding content:
1. Use the AI Tutor feature in each lesson
2. Contact support through the platform
3. Refer to this guide for formatting help

The lesson content system is designed to be flexible and user-friendly, allowing you to create professional, engaging educational content for your students.

