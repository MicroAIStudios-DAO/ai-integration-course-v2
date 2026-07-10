# Firebase Optimization & Automated Deployment Guide

This guide explains the Firebase optimization setup using Google Cloud CLI (gcloud) and automated deployment processes.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Firebase Optimization](#firebase-optimization)
4. [Automated Deployment](#automated-deployment)
5. [Validation & Testing](#validation--testing)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

## Overview

The AI Integration Course uses Firebase for hosting, functions, and backend services. This optimization ensures:

- ✅ All required Google Cloud APIs are enabled
- ✅ Optimal configuration for performance and cost
- ✅ Automated deployment pipelines
- ✅ Pre-deployment validation
- ✅ Proper security and IAM setup

## Prerequisites

### Required Tools

1. **Node.js 20+**
   ```bash
   node --version  # Should be 20.x or higher
   ```

2. **Google Cloud CLI (gcloud)**
   ```bash
   # Install gcloud
   # Visit: https://cloud.google.com/sdk/docs/install
   
   # Verify installation
   gcloud --version
   
   # Authenticate
   gcloud auth login
   
   # Set project
   gcloud config set project ai-integra-course-v2
   ```

3. **Firebase CLI**
   ```bash
   # Install globally
   npm install -g firebase-tools
   
   # Authenticate
   firebase login
   
   # Select project
   firebase use ai-integra-course-v2
   ```

### Repository Setup

```bash
# Clone repository
git clone https://github.com/Gnoscenti/ai-integration-course.git
cd ai-integration-course

# Install dependencies
npm install
```

## Firebase Optimization

### Step 1: Run Optimization Script

The optimization script uses gcloud to configure Firebase optimally:

```bash
# Make script executable (if not already)
chmod +x scripts/optimize-firebase.sh

# Run optimization
./scripts/optimize-firebase.sh --project ai-integra-course-v2
```

**What this script does:**

1. **Enables Required Google Cloud APIs**
   - Firebase API
   - Firebase Hosting API
   - Cloud Functions API
   - Cloud Scheduler API
   - Cloud Build API
   - Artifact Registry API
   - Secret Manager API
   - Firestore API
   - Firebase Storage API
   - Identity Toolkit API
   - Cloud Run API

2. **Configures Service Accounts**
   - Creates deployment service account
   - Assigns necessary IAM roles
   - Enables automated deployments

3. **Optimizes Cloud Functions**
   - Sets default region (us-central1)
   - Configures runtime settings
   - Optimizes cold start performance

4. **Configures Storage CORS**
   - Sets up proper CORS policies
   - Enables cross-origin requests
   - Optimizes for production domains

5. **Creates Build Configuration**
   - Generates optimized cloudbuild.yaml
   - Configures build machine type
   - Sets up caching strategies

6. **Generates Configuration Files**
   - Creates .gcloudignore
   - Updates deployment settings
   - Generates optimization report

### Step 2: Review Optimization Report

After running the optimization script, review the generated report:

```bash
cat FIREBASE_OPTIMIZATION_REPORT.md
```

This report includes:
- Configuration status
- Enabled services
- Security settings
- Next steps
- Useful commands

### Step 3: Verify Configuration

Check that all configurations are correct:

```bash
# Verify firebase.json
cat firebase.json

# Check .firebaserc
cat .firebaserc

# Verify .gcloudignore
cat .gcloudignore
```

## Automated Deployment

### Local Deployment

#### Option 1: Full Production Deployment

```bash
# Run the enhanced deployment script
./scripts/deploy-production.sh
```

This script:
1. Runs optimization (if first time)
2. Validates configuration
3. Cleans previous builds
4. Installs dependencies
5. Builds for production
6. Deploys to Firebase

#### Option 2: Quick Deployment

```bash
# Deploy using npm script
npm run deploy
```

This uses the configuration from package.json:
```json
{
  "scripts": {
    "deploy": "npm run install:all && npm run build:production && firebase deploy"
  }
}
```

#### Option 3: Component-Specific Deployment

```bash
# Deploy only hosting
npm run deploy:hosting

# Deploy only functions
npm run deploy:functions

# Deploy specific service
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
```

### GitHub Actions (CI/CD)

The repository includes automated deployment workflows:

#### 1. Production Deployment (main branch)

**File:** `.github/workflows/firebase-hosting-merge.yml`

Triggered on push to `main` branch:
```yaml
name: Deploy to Firebase Hosting on merge
on:
  push:
    branches:
      - main
```

**What it does:**
- Checks out code
- Installs dependencies
- Builds production bundle
- Deploys to Firebase Hosting (live channel)

#### 2. Preview Deployment (Pull Requests)

**File:** `.github/workflows/firebase-hosting-pull-request.yml`

Triggered on pull requests:
```yaml
name: Deploy to Firebase Hosting on PR
on: pull_request
```

**What it does:**
- Creates preview deployment
- Comments PR with preview URL
- Enables testing before merge

#### 3. Manual Deployment Workflow

**File:** `.github/workflows/firebase-deploy.yml`

Manually triggered via GitHub Actions UI:
```yaml
on:
  workflow_dispatch:
```

### Required GitHub Secrets

For automated deployments to work, ensure these secrets are set:

1. **FIREBASE_SERVICE_ACCOUNT_AI-INTEGRA-COURSE-V2**
   - Service account JSON key
   - Get from Google Cloud Console
   - Required for all deployments

**How to add:**
1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `FIREBASE_SERVICE_ACCOUNT_AI-INTEGRA-COURSE-V2`
4. Value: Paste entire JSON key from service account

## Validation & Testing

### Pre-Deployment Validation

Always run validation before deploying:

```bash
# Make script executable
chmod +x scripts/validate-deployment.sh

# Run validation
./scripts/validate-deployment.sh
```

**Validation checks:**
- Prerequisites (Node.js, npm, Firebase CLI, gcloud)
- Configuration files (firebase.json, .firebaserc, package.json)
- Dependencies (node_modules, package-lock.json)
- Build artifacts (build directory, index.html)
- Functions (package.json, compiled code)
- Environment variables
- Security rules
- GitHub Actions workflows

**Exit codes:**
- `0` - All checks passed or warnings only
- `1` - Critical errors found

### Manual Testing

After deployment, test the application:

1. **Test Production Site**
   ```bash
   # Open in browser
   open https://ai-integra-course-v2.web.app
   open https://aiintegrationcourse.com
   ```

2. **Test Functions**
   ```bash
   # View function logs
   firebase functions:log
   
   # Or use gcloud
   gcloud logging read "resource.type=cloud_function" --limit 50
   ```

3. **Check Deployment Status**
   ```bash
   # Firebase Console
   firebase open hosting
   
   # Cloud Console
   gcloud app browse
   ```

### Local Testing with Emulators

```bash
# Start all emulators
firebase emulators:start

# Start specific emulators
firebase emulators:start --only hosting,functions

# With UI
firebase emulators:start --ui
```

Access emulators:
- Hosting: http://localhost:5000
- Functions: http://localhost:5001
- Firestore: http://localhost:8080
- Auth: http://localhost:9099
- UI: http://localhost:4000

## Troubleshooting

### Common Issues

#### 1. Authentication Errors

**Problem:** `gcloud` or `firebase` authentication fails

**Solution:**
```bash
# Re-authenticate gcloud
gcloud auth login
gcloud auth application-default login

# Re-authenticate Firebase
firebase login --reauth
```

#### 2. Build Fails

**Problem:** Build process fails with errors

**Solution:**
```bash
# Clean and rebuild
npm run clean
npm install
npm run build

# Check Node.js version
node --version  # Must be 20.x

# Use legacy OpenSSL provider (already configured)
NODE_OPTIONS=--openssl-legacy-provider npm run build
```

#### 3. Deploy Permissions Error

**Problem:** "Permission denied" during deployment

**Solution:**
```bash
# Verify project access
gcloud projects get-iam-policy ai-integra-course-v2

# Check service account roles
gcloud projects get-iam-policy ai-integra-course-v2 \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:firebase-deploy@ai-integra-course-v2.iam.gserviceaccount.com"

# Add missing roles
gcloud projects add-iam-policy-binding ai-integra-course-v2 \
  --member="serviceAccount:firebase-deploy@ai-integra-course-v2.iam.gserviceaccount.com" \
  --role="roles/firebase.admin"
```

#### 4. Functions Deployment Fails

**Problem:** Functions fail to deploy

**Solution:**
```bash
# Build functions first
cd functions
npm install
npm run build
cd ..

# Deploy with verbose logging
firebase deploy --only functions --debug

# Check functions configuration
cat firebase.json | grep -A 10 "functions"
```

#### 5. Invalid Configuration

**Problem:** `firebase.json` has invalid configuration

**Solution:**
```bash
# Validate JSON syntax
python3 -m json.tool firebase.json

# Re-run optimization to fix
./scripts/optimize-firebase.sh --project ai-integra-course-v2
```

### Debugging Commands

```bash
# View recent deployments
firebase hosting:channel:list

# Check quota usage
gcloud compute project-info describe --project=ai-integra-course-v2

# View active services
gcloud services list --enabled --project=ai-integra-course-v2

# Check Cloud Build history
gcloud builds list --project=ai-integra-course-v2 --limit=10

# View function details
firebase functions:list

# Check Firestore indexes
firebase firestore:indexes
```

## Best Practices

### 1. Version Control

- Always commit before deploying
- Use semantic versioning
- Tag releases
- Document changes in commit messages

```bash
# Before deployment
git status
git add .
git commit -m "feat: add new feature"
git push origin main
```

### 2. Environment Management

- Keep production credentials secure
- Use environment-specific configs
- Never commit secrets to repository
- Use Secret Manager for sensitive data

```bash
# Store secrets in Google Secret Manager
echo -n "my-secret-value" | gcloud secrets create my-secret --data-file=-

# Access in functions
const secret = await secretManagerClient.accessSecretVersion({
  name: 'projects/ai-integra-course-v2/secrets/my-secret/versions/latest'
});
```

### 3. Testing Strategy

- Test locally with emulators first
- Use preview deployments for PRs
- Validate before production deployment
- Monitor after deployment

### 4. Performance Optimization

- Enable caching in `firebase.json`
- Use CDN for static assets
- Optimize images and bundles
- Implement code splitting

### 5. Cost Management

- Monitor usage in Firebase Console
- Set up billing alerts
- Use Cloud Functions efficiently
- Implement caching strategies

```bash
# Set up budget alert
gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="AI Integration Course Budget" \
  --budget-amount=100USD
```

### 6. Security

- Keep Firestore rules up to date
- Implement proper authentication
- Use HTTPS only
- Regular security audits

```bash
# Deploy security rules separately
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

### 7. Monitoring

- Set up alerts for errors
- Monitor function performance
- Track deployment success rate
- Review logs regularly

```bash
# View error logs
gcloud logging read "severity>=ERROR" --limit=50

# Create alert policy
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="Function Errors" \
  --condition-display-name="Error rate too high"
```

## Additional Resources

### Documentation

- [Firebase Documentation](https://firebase.google.com/docs)
- [Google Cloud CLI Documentation](https://cloud.google.com/sdk/docs)
- [Cloud Functions Documentation](https://firebase.google.com/docs/functions)
- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)

### Support

- [Firebase Support](https://firebase.google.com/support)
- [Stack Overflow - Firebase](https://stackoverflow.com/questions/tagged/firebase)
- [Google Cloud Support](https://cloud.google.com/support)

### Useful Commands Reference

```bash
# Project Management
gcloud projects list
gcloud config set project ai-integra-course-v2
firebase use ai-integra-course-v2

# Deployment
firebase deploy
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules

# Monitoring
firebase hosting:channel:list
firebase functions:log
gcloud logging tail

# Configuration
firebase init
gcloud config list
firebase open

# Testing
firebase emulators:start
npm run build
npm run test

# Optimization
./scripts/optimize-firebase.sh
./scripts/validate-deployment.sh
./scripts/deploy-production.sh
```

---

**Generated:** $(date)  
**Project:** ai-integra-course-v2  
**Repository:** https://github.com/Gnoscenti/ai-integration-course
