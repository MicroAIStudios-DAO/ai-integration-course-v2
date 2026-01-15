# Production Deployment Guide

This guide provides comprehensive instructions for deploying the AI Integration Course to production.

## Prerequisites

Before deploying to production, ensure you have:

1. **Firebase Project**: `ai-integra-course-v2` project configured
2. **GitHub Repository Access**: Write access to repository
3. **Firebase CLI**: Installed and authenticated (`firebase login`)
4. **Node.js**: Version 20.x (as specified in `.nvmrc`)
5. **GitHub Secrets**: Required secrets configured in repository

## Required GitHub Secrets

The following secrets must be configured in GitHub repository settings (Settings → Secrets and variables → Actions):

### 1. Firebase Service Account
```
FIREBASE_SERVICE_ACCOUNT_GOLDENAIGE
```
This is the Firebase service account JSON that enables GitHub Actions to deploy to Firebase Hosting.

**How to obtain:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project `ai-integra-course-v2`
3. Project Settings → Service Accounts
4. Generate new private key
5. Copy the entire JSON content
6. Add as GitHub secret

### 2. Firebase Environment Variables (Optional for Build)

While the current build works with default/test values, for production you may want to set:

```
REACT_APP_FIREBASE_API_KEY
REACT_APP_FIREBASE_AUTH_DOMAIN
REACT_APP_FIREBASE_PROJECT_ID
REACT_APP_FIREBASE_STORAGE_BUCKET
REACT_APP_FIREBASE_MESSAGING_SENDER_ID
REACT_APP_FIREBASE_APP_ID
REACT_APP_FIREBASE_MEASUREMENT_ID
```

**Note**: These are PUBLIC keys that will be exposed in the client-side bundle. They are safe to include in GitHub Actions as environment variables.

**How to obtain:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project `ai-integra-course-v2`
3. Project Settings → General → Your apps → Web app
4. Find your web app configuration
5. Copy each value

## Deployment Methods

### Method 1: Automatic Deployment (Recommended)

The repository is configured with GitHub Actions for automatic deployment.

**Triggers:**
- Push to `main` branch → Automatic deployment to production
- Pull request → Creates preview deployment

**Workflow files:**
- `.github/workflows/firebase-hosting-merge.yml` - Main branch deployments
- `.github/workflows/firebase-hosting-pull-request.yml` - PR preview deployments
- `.github/workflows/firebase-deploy.yml` - Alternative deployment workflow

**To deploy:**
1. Merge your changes to `main` branch
2. GitHub Actions will automatically:
   - Install dependencies (`npm ci`)
   - Build the application (`npm run build`)
   - Deploy to Firebase Hosting

**Monitor deployment:**
1. Go to GitHub repository → Actions tab
2. Watch the deployment workflow progress
3. Check for any errors

### Method 2: Manual Deployment via Script

Use the `repo_finish.sh` script for comprehensive deployment:

```bash
# Dry run (preview what will happen)
./repo_finish.sh --dry-run

# Execute deployment
./repo_finish.sh
```

**What it does:**
1. Creates/switches to `release/launch` branch
2. Sources local environment variables (if available)
3. Generates `.env.local` and `.env.production` files
4. Installs dependencies and builds the project
5. Exports Firestore backup
6. Deploys Firestore security rules
7. Runs Firestore migration
8. Verifies Stripe configuration
9. Performs health check
10. Creates PR for review

### Method 3: Manual Firebase CLI Deployment

For direct deployment using Firebase CLI:

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting --project ai-integra-course-v2

# Or use npm script
npm run deploy
```

**Deploy Functions separately:**
```bash
cd functions
npm install
npm run build
cd ..
npm run deploy:functions
```

## Deployment Verification

After deployment, verify the following:

### 1. Website Accessibility
- [ ] Visit https://ai-integra-course-v2.web.app
- [ ] Visit https://aiintegrationcourse.com (if DNS configured)
- [ ] Check that homepage loads correctly
- [ ] Verify footer shows "© 2025 MicroAI Studios™"

### 2. Authentication
- [ ] Sign up with new account
- [ ] Sign in with existing account
- [ ] Sign out successfully
- [ ] Password reset works

### 3. Course Content
- [ ] Free lessons are accessible without login
- [ ] Premium lessons require authentication
- [ ] Videos load correctly (YouTube integration)
- [ ] Lesson navigation works

### 4. AI Tutor
- [ ] AI Tutor appears on lesson pages
- [ ] Questions receive responses
- [ ] Responses include citations
- [ ] Premium gating works correctly

### 5. Firebase Services
- [ ] Firestore database is accessible
- [ ] Firebase Authentication works
- [ ] Firebase Functions are responding
- [ ] Firebase Storage serves content

## Firebase Functions Deployment

The project includes Firebase Cloud Functions for AI Tutor functionality.

### Prerequisites
```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Set project
firebase use ai-integra-course-v2
```

### Deploy Functions
```bash
# From repository root
npm run deploy:functions

# Or manually
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions --project ai-integra-course-v2
```

### Required Environment Variables for Functions

Set these using Firebase Secret Manager:

```bash
# OpenAI API Key
firebase functions:secrets:set OPENAI_API_KEY --project ai-integra-course-v2

# Stripe Secret Key (if using payments)
firebase functions:secrets:set STRIPE_SECRET_KEY --project ai-integra-course-v2
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET --project ai-integra-course-v2
```

## Firestore Configuration

### Security Rules

Security rules are defined in `premium_rules.rules`:
- Free lessons accessible to all authenticated users
- Premium lessons require active subscription
- User documents are readable/writable only by owner

**Deploy rules:**
```bash
firebase deploy --only firestore:rules --project ai-integra-course-v2
```

### Data Migration

Run the migration script to normalize Firestore data:

```bash
# Preview migration
node firestore_migrate.js --manifest ./reorg_logs/firestore_migration_manifest.json

# Apply migration
node firestore_migrate.js --apply --manifest ./reorg_logs/firestore_migration_manifest.json
```

**What it does:**
- Removes duplicate lessons
- Sets correct tier (free/premium) for lessons
- Cleans up bogus top-level lesson documents
- Ensures data consistency

## Environment Variables Reference

### Build-time Variables (REACT_APP_*)

These are embedded into the build:

| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_FIREBASE_API_KEY` | Firebase Web API Key | Yes |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | Yes |
| `REACT_APP_FIREBASE_PROJECT_ID` | Firebase Project ID | Yes |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | Yes |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | Yes |
| `REACT_APP_FIREBASE_APP_ID` | Firebase App ID | Yes |
| `REACT_APP_FIREBASE_MEASUREMENT_ID` | Firebase Analytics Measurement ID | No |
| `REACT_APP_STRIPE_PUBLISHABLE_KEY` | Stripe Publishable Key | No |
| `REACT_APP_VERSION` | Application Version | No |
| `REACT_APP_NAME` | Application Name | No |

### Runtime Variables (Functions)

These are used by Firebase Functions:

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API Key for AI Tutor | Yes (for AI features) |
| `STRIPE_SECRET_KEY` | Stripe Secret Key | No (for payments) |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Secret | No (for payments) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Service Account JSON Path | Yes (local dev) |

## Troubleshooting

### Build Fails

**Issue:** Build fails with memory error
```bash
# Increase Node.js memory
export NODE_OPTIONS="--max-old-space-size=8192"
npm run build
```

**Issue:** Build fails with OpenSSL error
```
# Already handled in package.json with --openssl-legacy-provider flag
# If still fails, check Node.js version (should be 20.x)
```

### Deployment Fails

**Issue:** Firebase deployment authentication error
```bash
# Re-authenticate
firebase login --reauth

# Verify project
firebase use ai-integra-course-v2
```

**Issue:** GitHub Actions deployment fails
```
# Check GitHub Secrets are configured:
# - FIREBASE_SERVICE_ACCOUNT_GOLDENAIGE
# Check workflow logs for specific errors
```

### Functions Deployment Issues

**Issue:** Functions require Node 22 but using Node 20
```bash
# The functions package.json specifies Node 22, but they work with Node 20
# Update functions/package.json engines.node to "20" if needed
```

**Issue:** Secret environment variables not available
```bash
# Set secrets using Firebase CLI
firebase functions:secrets:set OPENAI_API_KEY --project ai-integra-course-v2
```

## Rollback Procedure

If deployment causes issues:

### Option 1: Rollback via Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project `ai-integra-course-v2`
3. Hosting → Release history
4. Click on previous version → Rollback

### Option 2: Rollback via CLI
```bash
# List previous deployments
firebase hosting:channel:list --project ai-integra-course-v2

# Rollback to specific version (replace VERSION_ID)
firebase hosting:clone ai-integra-course-v2:VERSION_ID ai-integra-course-v2:live
```

### Option 3: Redeploy Previous Commit
```bash
# Checkout previous commit
git checkout <previous-commit-sha>

# Deploy
npm run deploy
```

## Production URLs

- **Primary**: https://ai-integra-course-v2.web.app
- **Custom Domain**: https://aiintegrationcourse.com (if configured)
- **Firebase Console**: https://console.firebase.google.com/project/ai-integra-course-v2

## Support and Monitoring

### Firebase Console
- **Hosting**: Monitor deployment status and traffic
- **Authentication**: Monitor user sign-ups and logins
- **Firestore**: Monitor database usage and queries
- **Functions**: Monitor function invocations and errors
- **Analytics**: Track user behavior

### GitHub Actions
- Monitor deployment workflows in Actions tab
- Review workflow logs for errors
- Check build artifacts

### Error Monitoring
- Check browser console for client-side errors
- Review Firebase Functions logs for backend errors
- Monitor Firebase Hosting logs for HTTP errors

## Additional Resources

- [README.md](README.md) - Project documentation
- [QUICKSTART.md](QUICKSTART.md) - Quick setup guide
- [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) - Pre-deployment checklist
- [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) - Launch verification steps
- [DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md) - Summary of deployment changes

## Security Considerations

1. **Never commit secrets**: Ensure `.env` files are in `.gitignore`
2. **Use Firebase Secret Manager**: For sensitive function environment variables
3. **Review security rules**: Regularly audit Firestore and Storage rules
4. **Monitor access**: Use Firebase Console to monitor unusual activity
5. **Keep dependencies updated**: Regularly run `npm audit` and update packages

## Post-Deployment Tasks

1. [ ] Verify all URLs are working
2. [ ] Test authentication flow
3. [ ] Verify premium content gating
4. [ ] Test AI Tutor functionality
5. [ ] Monitor Firebase Console for errors
6. [ ] Check Analytics for user activity
7. [ ] Test on multiple devices and browsers
8. [ ] Verify SEO metadata and sitemap
9. [ ] Test email deliverability (if configured)
10. [ ] Update DNS records if needed

---

**Last Updated:** October 14, 2025  
**Project:** AI Integration Course  
**Firebase Project:** ai-integra-course-v2  
**Status:** Production Ready
