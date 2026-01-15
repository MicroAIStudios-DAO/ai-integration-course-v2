# Deployment Guide

This document outlines the deployment process for the AI Integration Course application.

## Available Deployment Scripts

The following npm scripts are available for deployment:

```bash
# Standard deployment to Firebase hosting
npm run deploy

# Deploy both hosting and Firebase functions
npm run deploy:functions

# Build and preview locally before deployment
npm run preview
```

## Prerequisites

Before deploying, ensure you have:

1. **Firebase CLI**: Install globally or use the included dev dependency
   ```bash
   npm install -g firebase-tools
   # OR it's already included in package.json devDependencies
   ```

2. **Firebase Authentication**: Login to Firebase
   ```bash
   firebase login
   ```

3. **Environment Variables**: Ensure all required environment variables are set:
   - For local development: Copy `.env.example` to `.env` and fill in values
   - For Firebase deployment: Ensure production environment variables are configured
4. **gcloud CLI**: Install the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) and authenticate:
   ```bash
   gcloud auth login
   gcloud config set project ai-integra-course-v2
   ```

## Deployment Process

### 1. Local Testing
Before deploying, always test locally:
```bash
# Run tests
npm test

# Build and preview
npm run preview
```

### 2. Firebase Deployment
```bash
# Deploy hosting only
npm run deploy

# Deploy hosting and functions
npm run deploy:functions
```

### 3. Post-Deployment Verification with gcloud
After Firebase finishes deploying, verify that both hosting and Cloud Functions are live using the gcloud CLI:
```bash
# Confirm latest hosting release
gcloud firebase hosting:releases list --project ai-integra-course-v2 --site ai-integra-course-v2 --limit=1

# Confirm Cloud Functions deployment in the target region
gcloud functions list --project ai-integra-course-v2 --regions us-central1
```
The commands above provide an immediate status check for the frontend (Firebase Hosting) and backend (Cloud Functions) surfaces.

## Configuration Files

- **`firebase.json`**: Firebase hosting and functions configuration
- **`.firebaserc`**: Firebase project configuration

## Troubleshooting

### Build Issues
- Ensure all dependencies are installed: `npm install`
- Check for TypeScript errors: `npm run build`
- Verify environment variables are set correctly

### Firebase Deployment Issues
- Ensure you're logged in: `firebase login`
- Check Firebase project permissions
- Verify `.firebaserc` project configuration

### Test Failures
- Tests require Node.js environment with test configuration
- Environment variables are provided via test fallbacks
- Run with: `NODE_ENV=test npm test`

## Environment Variables

Required environment variables for production:
```
REACT_APP_FIREBASE_API_KEY
REACT_APP_FIREBASE_AUTH_DOMAIN
REACT_APP_FIREBASE_PROJECT_ID
REACT_APP_FIREBASE_STORAGE_BUCKET
REACT_APP_FIREBASE_MESSAGING_SENDER_ID
REACT_APP_FIREBASE_APP_ID
REACT_APP_FIREBASE_MEASUREMENT_ID
```

Optional:
```
REACT_APP_STRIPE_PUBLISHABLE_KEY
REACT_APP_VERSION
REACT_APP_NAME
REACT_APP_DEFAULT_LANGUAGE
```