# GitHub Copilot Instructions for AI Integration Course

## Project Overview

This is the AI Integration Course platform - a comprehensive educational platform that teaches users how to integrate AI technologies into their workflows and investments. The platform combines structured learning paths with AI-powered tutoring capabilities.

### Key Features
- **Structured Learning**: Organized courses, modules, and lessons with premium/free tiers
- **AI Tutoring System**: Interactive AI tutor powered by OpenAI APIs with RAG (Retrieval-Augmented Generation)
- **Premium Content**: Subscription-based access to advanced lessons and features
- **Multi-platform**: React frontend with Firebase backend and Vercel deployment

## Technology Stack & Architecture

### Frontend (React + TypeScript)
- **Framework**: React 19.1.0 with TypeScript 4.9.5
- **Styling**: TailwindCSS with custom CSS
- **Routing**: React Router DOM v6
- **State Management**: React Context API for authentication
- **Testing**: Vitest for unit tests
- **Build Tool**: React Scripts (Create React App)

### Backend & APIs
- **Firebase**: Authentication, Firestore database, Cloud Functions
- **Vercel Functions**: Serverless API endpoints (in `/api` directory)
- **OpenAI Integration**: GPT models for AI tutoring with embeddings
- **Stripe**: Payment processing for premium subscriptions

### Key Directories
```
src/
├── components/         # Reusable UI components
├── pages/             # Route components and page layouts
├── config/            # Environment and configuration
├── context/           # React Context providers
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
└── styles/            # Global CSS and styling

api/                   # Vercel serverless functions
backend/               # Flask backend (alternative implementation)
functions/             # Firebase Cloud Functions
lessons/               # Course content (Markdown files)
```

## Critical Developer Workflows

### Build & Deploy Commands
```bash
# Development
npm start              # React dev server with legacy OpenSSL provider
npm run build          # Production build with legacy OpenSSL provider

# Deployment (use specific commands, NOT generic firebase deploy)
npm run deploy         # Build + deploy to Firebase hosting only
npm run deploy:functions  # Build + deploy Firebase functions (requires functions build first)

# Firebase Functions (from functions/ directory)
npm run build          # TypeScript compilation for functions
npm run deploy         # Deploy functions only
firebase deploy --only functions  # Alternative deploy command
```

### Testing
```bash
npm test              # Run Vitest tests (not Jest)
```

### Environment Setup
- **Node Version**: 20.x (specified in package.json engines)
- **Firebase Project**: "ai-integra-course-v2" (production project ID)
- **Multiple Firebase Codebases**: Default, "new" - check firebase.json for configuration

## Architecture Patterns

### Data Flow Architecture
**Firestore Hierarchy** (critical for understanding data relationships):
```
courses/{courseId}/
├── title, description, order, imageUrl
└── modules/{moduleId}/
    ├── title, description, order
    └── lessons/{lessonId}/
        ├── title, order, durationMinutes, isFree
        ├── tier: "free"|"premium" (maps to isFree boolean in UI)
        ├── videoUrl, markdownContentPath
        └── content (lesson text for AI processing)
```

**Data Fetching Pattern** (`firebaseService.ts`):
- Always use `query(collection, orderBy('order'))` for consistent sorting
- Nested fetches: courses → modules → lessons
- Type normalization: `tier === 'free'` maps to `isFree` boolean

### AI Integration Architecture

**RAG Implementation** (`api/tutor.ts`):
- **Chunking**: 900-character chunks with 100-character overlap
- **Embeddings**: text-embedding-3-small model
- **Streaming**: Server-sent events for real-time responses
- **Model Fallback**: Try specified models, then gpt-4o-mini, then gpt-3.5-turbo

**Tutor API Flow**:
1. Vercel function proxies to Firebase Functions in production
2. Fallback to Vercel implementation if Firebase fails
3. Environment variable: `FIREBASE_TUTOR_URL` for production endpoint

### Authentication & Authorization

**Firebase Auth Pattern** (`AuthContext.tsx`):
- Context-based auth state management
- Automatic auth state persistence
- Custom claims for subscription status (not implemented in UI yet)

**Premium Access Control**:
- Check `premium && !hasAccess` before AI tutor interactions
- Graceful degradation with subscription prompts

## Component Architecture

### AI Tutor Component (`src/components/AITutor.tsx`)
- Streaming chat interface with message history
- Premium access validation
- Error handling for API failures
- Auto-scroll to latest messages

### Firebase Service (`src/firebaseService.ts`)
- Centralized data access layer
- Hierarchical data fetching (courses → modules → lessons)
- Storage integration for lesson content
- Progress tracking for user completion

## Development Patterns & Conventions

### Component Structure
```typescript
interface Props {
  // Define props with clear types
}

export default function ComponentName({ prop1, prop2 }: Props) {
  // Component logic
  return (
    <div className="tailwind-classes">
      {/* JSX content */}
    </div>
  );
}
```

### State Management
- **Local State**: useState for component-level state
- **Global State**: Context API for authentication and user data
- **Authentication**: `AuthContext` provides user state across the app

### Styling Guidelines
- **Primary Approach**: TailwindCSS utility classes
- **Custom Styles**: Inline styles for component-specific styling when needed
- **Responsive Design**: Mobile-first approach with responsive breakpoints
- **Color Scheme**: Professional blues and grays with AI-themed gradients

### API Design Patterns

#### Vercel Functions (`/api/*.ts`)
- RESTful endpoints following Vercel Edge Functions pattern
- Error handling with proper HTTP status codes
- Environment variables for API keys
- TypeScript interfaces for request/response

#### Example API Pattern:
```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // API logic here
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

## Integration Points & Dependencies

### OpenAI Integration
- **API Key**: `OPENAI_API_KEY` environment variable
- **Models**: gpt-4o-mini (primary), gpt-3.5-turbo (fallback)
- **Embeddings**: text-embedding-3-small for semantic search
- **Cost Optimization**: Model fallback chain to minimize costs

### Firebase Integration
- **Project ID**: ai-integra-course-v2 (production)
- **Multiple Codebases**: Default functions + "new" codebase
- **Emulators**: Full local development environment available
- **Security Rules**: Custom rules in `premium_rules.rules`

### Stripe Integration
- **Environment Variables**: `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- **Not Yet Implemented**: Payment flows exist but subscription logic incomplete

## Content Management

### Lesson Structure (`lessons/manifest.json`)
```json
{
  "free": [
    { "slug": "intro", "title": "Welcome", "path": "free/intro.md" }
  ],
  "premium": [
    { "slug": "advanced", "title": "Advanced Topic", "path": "premium/advanced.md" }
  ]
}
```

### Markdown Content
- Stored in `lessons/free/` and `lessons/premium/`
- Rendered via `MarkdownPage.tsx` component
- AI tutor uses content for RAG context

## Testing & Quality Assurance

### Testing Setup (`vitest.config.ts`)
- **Environment**: jsdom for DOM testing
- **Globals**: Vitest globals enabled
- **Setup**: `./src/setupTests.ts`
- **Mocking**: Firebase services mocked for testing

### Build Validation
- **Legacy OpenSSL**: Required for React Scripts compatibility
- **TypeScript**: Strict compilation in functions directory
- **Environment Injection**: Test environment variables properly configured

## Deployment & DevOps

- **Frontend**: Deployed to Vercel with automatic deployments from main branch
- **Backend**: Firebase Functions for serverless backend
- **Database**: Firestore for scalable NoSQL storage
- **Hosting**: Firebase Hosting for static assets
- **Multiple Environments**: Development (emulators) and production

## Security Considerations

1. **API Keys**: Never expose in frontend code (use environment variables)
2. **Input Validation**: Sanitize all user inputs before processing
3. **Authentication**: Verify user authentication on all protected endpoints
4. **Rate Limiting**: Implement appropriate rate limiting for AI features
5. **Content Security**: Validate and sanitize AI-generated content

## Common Patterns to Follow

### Error Handling
```typescript
// Always provide user-friendly error messages
try {
  const result = await apiCall();
} catch (error) {
  console.error('Detailed error for debugging:', error);
  setError('User-friendly message here');
}
```

### Loading States
```typescript
// Always show loading indicators for async operations
const [loading, setLoading] = useState(false);

const handleAsync = async () => {
  setLoading(true);
  try {
    await operation();
  } finally {
    setLoading(false);
  }
};
```

### Form Handling
```typescript
// Use controlled components with proper validation
const [formData, setFormData] = useState({ email: '', password: '' });
const [errors, setErrors] = useState({});

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  // Validation and submission logic
};
```

## AI-Specific Guidance

When implementing AI features:
1. **Context Management**: Always provide relevant lesson context to AI
2. **Prompt Engineering**: Use clear, structured prompts for consistent responses
3. **Fallback Handling**: Implement graceful degradation when AI services fail
4. **Cost Optimization**: Monitor token usage and implement appropriate limits
5. **User Experience**: Use streaming for real-time feedback

## Key Files for Understanding Architecture

- `src/firebaseService.ts` - Data access patterns and Firestore structure
- `api/tutor.ts` - AI integration and RAG implementation
- `src/components/AITutor.tsx` - AI tutor UI component
- `firebase.json` - Firebase configuration and multiple codebases
- `src/context/AuthContext.tsx` - Authentication state management
- `lessons/manifest.json` - Content organization structure
- `vitest.config.ts` - Testing configuration and environment setup