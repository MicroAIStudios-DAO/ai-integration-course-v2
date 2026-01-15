# AI Integration Course

A comprehensive platform for learning about AI integration and investment strategies in the age of artificial intelligence.

## 🚀 Quick Start for Production Deployment

**Ready to deploy?** This repository is production-ready!

```bash
# Option 1: Automatic deployment (push to main branch)
git push origin main  # GitHub Actions will auto-deploy

# Option 2: Manual deployment
npm run deploy

# Option 3: Use deployment script
./repo_finish.sh
```

📖 **See [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) for complete deployment guide**  
📋 **See [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md) for deployment checklist**

### ⚠️ Pre-Deployment Requirements
- [ ] Configure `FIREBASE_SERVICE_ACCOUNT_AI_INTEGRA_COURSE_V2` secret in GitHub
- [ ] Set OpenAI API key: `firebase functions:secrets:set OPENAI_API_KEY`
- [ ] Deploy Firestore rules: `firebase deploy --only firestore:rules`

## 🌐 Production URLs

- **Website**: https://aiintegrationcourse.com
- **Firebase Hosting**: https://ai-integra-course-v2.web.app
- **Firebase Project**: ai-integra-course-v2
- **Status**: ✅ Production Ready

## Production Setup

### Quick Start: Firebase Optimization

For automated Firebase setup and optimization, see:
- **[Firebase Optimization Quick Start](./FIREBASE_OPTIMIZATION_QUICKSTART.md)** - 5-minute setup guide
- **[Firebase Optimization Guide](./FIREBASE_OPTIMIZATION_GUIDE.md)** - Comprehensive documentation

#### Optimize Firebase (Recommended First Step)

```bash
# Authenticate with Google Cloud and Firebase
gcloud auth login
gcloud config set project ai-integra-course-v2
firebase login
firebase use ai-integra-course-v2

# Run optimization script
chmod +x scripts/optimize-firebase.sh
./scripts/optimize-firebase.sh --project ai-integra-course-v2

# Validate setup
chmod +x scripts/validate-deployment.sh
./scripts/validate-deployment.sh
```

This automatically:
- ✅ Enables all required Google Cloud APIs
- ✅ Configures service accounts and IAM roles
- ✅ Optimizes Cloud Functions and Storage settings
- ✅ Creates optimized build configuration
- ✅ Generates deployment artifacts

### Environment Setup

1. Google Cloud project with:
   - Artifact Registry enabled
   - Secret Manager enabled
   - Firebase project configured

2. Required API keys:
   - Firebase API Key
   - OpenAI API Key
   - Stripe Keys (Secret, Publishable, Webhook)

### Deployment Steps

#### Automated Deployment (Recommended)
```bash
# Clone and set up
git clone https://github.com/Gnoscenti/ai-integration-course.git
cd ai-integration-course

# Run automated environment setup
chmod +x scripts/setup-environment.sh
./scripts/setup-environment.sh

# Configure your environment variables in .env.local
cp .env.example .env.local
# Edit .env.local with your API keys

# Deploy to production
chmod +x scripts/deploy-production.sh
./scripts/deploy-production.sh
```

#### Manual Deployment Steps

1. **Clone and Install Dependencies**:
   ```bash
   git clone https://github.com/Gnoscenti/ai-integration-course.git
   cd ai-integration-course
   npm run install:all  # Installs root + functions dependencies
   ```

2. **Set Up Python Environment** (if needed):
   ```bash
   npm run setup:python
   ```

3. **Configure Environment**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

4. **Build and Deploy**:
   ```bash
   npm run deploy
   ```

## Overview

The AI Integration Course platform provides users with tools, insights, and strategies to outthink the hype and invest with confidence in the age of AI. The application features a structured learning path with courses, modules, and lessons, along with premium content gating for subscribers.

## Features

- **AI-Powered Tutor**: Interactive learning assistant with context-aware responses
- **Structured Learning Path**: Organized courses with modules and lessons
- **Premium Content**: Subscription-based access to premium lessons
- **Free Preview**: Access to introductory lessons without subscription
- **AI Tutor**: Embedded AI assistant for answering lesson-specific questions
- **Progress Tracking**: Monitor your learning journey with completion tracking
- **Video Integration**: Rich multimedia lesson content with video playback
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Firebase Integration**: Authentication and content management
- **Markdown Rendering**: Rich lesson content with markdown support
- **Real-time Streaming**: Server-sent events for responsive AI interactions

## 🤖 AI Tutor

The platform includes an advanced AI-powered tutor that provides personalized learning assistance:

### Key Capabilities
- **Interactive Q&A**: Ask questions about lesson content and get instant answers
- **Context-Aware Responses**: Uses RAG (Retrieval-Augmented Generation) for accurate answers based on lesson content
- **Real-Time Streaming**: Server-sent events for responsive, word-by-word responses
- **Source Citations**: References specific lesson content in responses
- **Premium Feature**: Available to subscribed users

### Technical Implementation
- **AI Models**: OpenAI GPT-4o-mini (primary), GPT-3.5-turbo (fallback)
- **Embeddings**: text-embedding-3-small for semantic search
- **Chunking Strategy**: 900-character chunks with 100-character overlap
- **Context Window**: ~8k tokens with automatic pruning
- **Architecture**: Firebase Functions with optional Node-based proxy handlers

## Tech Stack

- React
- TypeScript
- Firebase (Authentication, Firestore, Cloud Functions)
- TailwindCSS
- React Router
- OpenAI API (for AI Tutor embeddings and chat)

## Getting Started

### Prerequisites

- Node.js 20.x (use nvm: `nvm use` - see `.nvmrc` file)
- npm 11.x or higher
- Firebase project (for authentication and database)
- OpenAI API key (for AI tutor feature)

### Installation

1. Clone the repository
```bash
git clone https://github.com/Gnoscenti/ai-integration-course.git
cd ai-integration-course
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file in the root directory with your Firebase configuration:
```bash
# Firebase Configuration (Required)
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Stripe Configuration (Required for Payments)
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

4. Start the development server
```bash
npm start
```

The application will be available at http://localhost:3000

## Available Scripts

```bash
npm start                # Start development server
npm test                 # Run tests with Vitest
npm run build            # Create production build
npm run deploy           # Build and deploy to Firebase Hosting
npm run deploy:functions # Build and deploy Firebase Functions
npm run deploy:gcloud    # GCloud-optimized production deployment
npm run preview          # Preview production build locally
```

## 🔧 Firebase Configuration

### Firestore Database Structure

```
courses/{courseId}
├── title: string
├── description: string
├── order: number
├── imageUrl: string
└── modules/{moduleId}
    ├── title: string
    ├── description: string
    ├── order: number
    └── lessons/{lessonId}
        ├── title: string
        ├── order: number
        ├── durationMinutes: number
        ├── tier: "free" | "premium"
        ├── isFree: boolean
        ├── videoUrl: string (optional)
        ├── content: string
        └── embeddings: array (optional)

users/{userId}
├── email: string
├── premium: boolean
├── subscriptionStatus: string
├── completedLessons: array
└── progress: map
```

### Security Rules

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🔗 Links

- **Production**: https://aiintegrationcourse.com
- **Firebase**: https://ai-integra-course-v2.web.app
- **Repository**: https://github.com/Gnoscenti/ai-integration-course
