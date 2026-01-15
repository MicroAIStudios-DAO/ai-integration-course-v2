# GCloud-Optimized Firebase Deployment Guide

## Overview

This guide covers the automated deployment process for the AI Integration Course platform using Google Cloud (gcloud) CLI to optimize Firebase infrastructure for production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Deployment Process](#deployment-process)
4. [Validation](#validation)
5. [Troubleshooting](#troubleshooting)
6. [Advanced Configuration](#advanced-configuration)

---

## Prerequisites

### Required Software

1. **Google Cloud SDK**
   - Install from: https://cloud.google.com/sdk/docs/install
   - Verify: `gcloud --version`

2. **Node.js 20+**
   - Install from: https://nodejs.org/
   - Verify: `node --version`

3. **npm 10+**
   - Included with Node.js
   - Verify: `npm --version`

4. **Firebase CLI**
   - Installed automatically by setup script
   - Or manually: `npm install -g firebase-tools`

### Required Access

- Google Cloud Project: `ai-integra-course-v2`
- Firebase project access
- IAM permissions:
  - Firebase Admin
  - Cloud Functions Admin
  - Firestore Admin
  - Cloud Build Editor

---

## Initial Setup

### Step 1: Authenticate with Google Cloud

```bash
# Login to Google Cloud
gcloud auth login

# Login with Application Default Credentials (for local development)
gcloud auth application-default login
```

### Step 2: Run Automated Setup

The setup script will:
- Configure GCloud project
- Enable required APIs
- Setup Firestore database
- Configure Firebase CLI
- Install dependencies
- Create service accounts for CI/CD

```bash
# Run the automated setup script
npm run gcloud:setup

# Or directly
./scripts/gcloud-setup.sh
```

**What the setup does:**
1. ✅ Authenticates with GCloud and Firebase
2. ✅ Sets project to `ai-integra-course-v2`
3. ✅ Enables required GCP APIs:
   - Cloud Functions API
   - Cloud Build API
   - Cloud Firestore API
   - Firebase Management API
   - Cloud Resource Manager API
   - Cloud Storage API
   - Artifact Registry API
   - Cloud Run API
   - Eventarc API
   - Secret Manager API
   - Cloud Scheduler API
4. ✅ Creates Firestore database (if not exists)
5. ✅ Configures default regions
6. ✅ Installs npm dependencies
7. ✅ Sets up Python environment (if needed)
8. ✅ Creates service account for GitHub Actions

### Step 3: Validate Setup

```bash
# Validate your configuration
npm run gcloud:validate

# Or directly
./scripts/gcloud-validate.sh
```

The validation script checks:
- ✓ GCloud CLI installation
- ✓ Authentication status
- ✓ Project access
- ✓ Firebase CLI installation
- ✓ Node.js version
- ✓ Required API enablement
- ✓ Firestore database
- ✓ IAM permissions

---

## Deployment Process

### Quick Deployment

For a complete, optimized deployment:

```bash
# Run the GCloud-optimized deployment
npm run deploy:gcloud

# Or directly
./scripts/gcloud-deploy.sh
```

### Manual Deployment Steps

If you prefer step-by-step control:

```bash
# 1. Clean previous builds
npm run clean

# 2. Install dependencies
npm run install:all

# 3. Setup Python environment (optional)
npm run setup:python

# 4. Build for production
npm run build:production

# 5. Build Firebase Functions
cd functions && npm run build && cd ..

# 6. Deploy to Firebase
firebase deploy --project ai-integra-course-v2
```

### Deployment Process Details

The `gcloud-deploy.sh` script performs:

1. **Prerequisites Check** (Step 1/8)
   - Node.js version ≥ 20
   - GCloud CLI availability
   - npm installation

2. **GCloud Setup** (Step 2/8)
   - Authentication verification
   - Project configuration
   - Access validation

3. **API Enablement** (Step 3/8)
   - Enables all required GCP APIs
   - Verifies API status

4. **Firebase Configuration** (Step 4/8)
   - Sets default region
   - Verifies Firestore database
   - Configures Cloud Functions region

5. **Build Preparation** (Step 5/8)
   - Cleans previous builds
   - Installs all dependencies
   - Sets up Python environment

6. **Production Build** (Step 6/8)
   - Builds React application
   - Verifies build output
   - Builds Firebase Functions

7. **Firebase Deployment** (Step 7/8)
   - Deploys hosting
   - Deploys Cloud Functions
   - Updates Firestore rules

8. **Post-Deployment Validation** (Step 8/8)
   - Checks hosting availability
   - Lists deployed functions
   - Provides deployment summary

---

## Validation

### Pre-Deployment Validation

Before deploying, run:

```bash
npm run gcloud:validate
```

This ensures:
- All prerequisites are met
- Authentication is valid
- Project is accessible
- Required APIs are enabled

### Post-Deployment Validation

After deployment:

1. **Check Hosting**
   ```bash
   curl -I https://ai-integra-course-v2.web.app
   ```

2. **Check Functions**
   ```bash
   gcloud functions list --project=ai-integra-course-v2
   ```

3. **View Logs**
   ```bash
   gcloud functions logs read --project=ai-integra-course-v2 --limit=50
   ```

4. **Test Application**
   - Visit: https://ai-integra-course-v2.web.app
   - Visit: https://aiintegrationcourse.com

---

## Troubleshooting

### Common Issues

#### 1. Authentication Failed

**Problem:** `ERROR: (gcloud.auth.login) INVALID_GRANT`

**Solution:**
```bash
# Clear existing credentials
gcloud auth revoke

# Re-authenticate
gcloud auth login
gcloud auth application-default login
```

#### 2. Project Access Denied

**Problem:** `ERROR: Cannot access project ai-integra-course-v2`

**Solution:**
```bash
# List available projects
gcloud projects list

# Set the correct project
gcloud config set project ai-integra-course-v2

# Verify access
gcloud projects describe ai-integra-course-v2
```

#### 3. API Not Enabled

**Problem:** `API [cloudfunctions.googleapis.com] not enabled`

**Solution:**
```bash
# Enable specific API
gcloud services enable cloudfunctions.googleapis.com

# Or enable all required APIs
gcloud services enable \
  cloudfunctions.googleapis.com \
  cloudbuild.googleapis.com \
  firestore.googleapis.com \
  firebase.googleapis.com
```

#### 4. Build Failed

**Problem:** Build errors during deployment

**Solution:**
```bash
# Clean everything
npm run clean

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build:production
```

#### 5. Functions Deployment Failed

**Problem:** Cloud Functions deployment timeout or error

**Solution:**
```bash
# Check function logs
gcloud functions logs read --project=ai-integra-course-v2 --limit=100

# Deploy functions separately
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions --project=ai-integra-course-v2
```

#### 6. Firestore Permissions

**Problem:** Firestore database access denied

**Solution:**
```bash
# Check Firestore status
gcloud firestore databases list --project=ai-integra-course-v2

# Create database if needed
gcloud firestore databases create \
  --location=nam5 \
  --project=ai-integra-course-v2
```

### Rollback Procedure

If deployment fails or causes issues:

```bash
# Rollback Firebase Hosting
firebase hosting:rollback --project=ai-integra-course-v2

# Rollback to specific version
firebase hosting:versions:list --project=ai-integra-course-v2
firebase hosting:rollback <version-id> --project=ai-integra-course-v2
```

### Debug Mode

For verbose output during deployment:

```bash
# Enable debug logging
export DEBUG=*

# Run deployment
./scripts/gcloud-deploy.sh

# Or with Firebase debug
firebase deploy --debug --project=ai-integra-course-v2
```

---

## Advanced Configuration

### Custom Region Configuration

Edit `scripts/gcloud-deploy.sh`:

```bash
REGION="us-central1"        # Default region
FIRESTORE_LOCATION="nam5"   # North America multi-region
```

Available regions:
- `us-central1` - Iowa (default for Cloud Functions)
- `us-east1` - South Carolina
- `europe-west1` - Belgium
- `asia-northeast1` - Tokyo

Available Firestore locations:
- `nam5` - North America multi-region (default)
- `eur3` - Europe multi-region
- `us-central` - Iowa
- `europe-west` - Belgium

### Environment Variables

Create `.env.production` for production-specific variables:

```bash
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=ai-integra-course-v2.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=ai-integra-course-v2

# OpenAI Configuration
OPENAI_API_KEY=your-openai-key

# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=your-stripe-key
STRIPE_SECRET_KEY=your-stripe-secret
```

### CI/CD Integration

#### GitHub Actions Setup

1. **Generate Service Account Key**
   ```bash
   gcloud iam service-accounts keys create key.json \
     --iam-account=firebase-deployer@ai-integra-course-v2.iam.gserviceaccount.com
   ```

2. **Add to GitHub Secrets**
   - Go to: Repository → Settings → Secrets → Actions
   - Name: `GCP_SA_KEY`
   - Value: Content of `key.json`

3. **Workflow already configured**
   - File: `.github/workflows/firebase-hosting-merge.yml`
   - Triggers on push to `main` branch

#### Manual GitHub Actions Trigger

```bash
# Push to trigger deployment
git push origin main

# Or trigger manually from GitHub UI
# Actions → Deploy to Firebase Hosting on merge → Run workflow
```

### Custom Deployment Targets

Deploy to specific environments:

```bash
# Deploy to staging
firebase deploy --project=ai-integra-course-v2-staging

# Deploy only hosting
firebase deploy --only hosting --project=ai-integra-course-v2

# Deploy only functions
firebase deploy --only functions --project=ai-integra-course-v2

# Deploy only firestore rules
firebase deploy --only firestore:rules --project=ai-integra-course-v2
```

### Performance Optimization

#### 1. Build Optimization

```bash
# Use production build with optimizations
NODE_ENV=production npm run build
```

#### 2. Function Optimization

Edit `functions/package.json`:
```json
{
  "engines": {
    "node": "20"  // Use latest LTS
  }
}
```

#### 3. Firestore Indexes

Review and update `firestore.indexes.json` for optimal query performance.

#### 4. Caching Configuration

Edit `firebase.json`:
```json
{
  "hosting": {
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

### Monitoring and Logging

#### View Application Logs

```bash
# Firebase Functions logs
firebase functions:log --project=ai-integra-course-v2

# GCloud Functions logs
gcloud functions logs read --project=ai-integra-course-v2 --limit=50

# Firestore logs
gcloud logging read "resource.type=firestore_database" --project=ai-integra-course-v2
```

#### Set Up Alerts

```bash
# Create log-based metric
gcloud logging metrics create error_count \
  --description="Count of errors" \
  --log-filter='severity>=ERROR'

# Create alert policy
gcloud alpha monitoring policies create \
  --notification-channels=<channel-id> \
  --display-name="High Error Rate" \
  --condition-threshold-value=10
```

---

## Quick Reference

### Common Commands

```bash
# Setup
npm run gcloud:setup          # Initial GCloud setup
npm run gcloud:validate       # Validate configuration

# Deployment
npm run deploy:gcloud         # Full GCloud-optimized deployment
npm run deploy                # Standard deployment
npm run deploy:hosting        # Deploy hosting only
npm run deploy:functions      # Deploy functions only

# Development
npm start                     # Start dev server
npm run build                 # Build for production
npm run clean                 # Clean build artifacts

# Validation
npm test                      # Run tests
npm run preview              # Preview production build

# GCloud Commands
gcloud auth login            # Authenticate
gcloud config set project ai-integra-course-v2  # Set project
gcloud projects list         # List projects
gcloud services list --enabled  # List enabled APIs
```

### Useful Links

- **Firebase Console:** https://console.firebase.google.com/project/ai-integra-course-v2
- **GCP Console:** https://console.cloud.google.com/home/dashboard?project=ai-integra-course-v2
- **Production Site:** https://ai-integra-course-v2.web.app
- **Custom Domain:** https://aiintegrationcourse.com
- **Cloud Functions:** https://console.cloud.google.com/functions/list?project=ai-integra-course-v2
- **Firestore:** https://console.firebase.google.com/project/ai-integra-course-v2/firestore
- **Cloud Storage:** https://console.cloud.google.com/storage/browser?project=ai-integra-course-v2

---

## Support

For issues or questions:

1. **Check Logs:** `gcloud functions logs read --project=ai-integra-course-v2`
2. **Validate Setup:** `npm run gcloud:validate`
3. **Review Documentation:** This file and README.md
4. **Firebase Support:** https://firebase.google.com/support
5. **GCP Support:** https://cloud.google.com/support

---

**Last Updated:** October 2025  
**Project:** AI Integration Course  
**Repository:** https://github.com/Gnoscenti/ai-integration-course
