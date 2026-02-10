# Quick Start: Firebase Optimization

This guide helps you quickly optimize Firebase for automated deployment.

## Prerequisites

Ensure you have:
- ✅ Node.js 20+ installed
- ✅ Google Cloud CLI (gcloud) installed
- ✅ Firebase CLI installed
- ✅ Access to Firebase project `ai-integra-course-v2`

## Quick Setup (5 minutes)

### Step 1: Authenticate

```bash
# Authenticate with Google Cloud
gcloud auth login

# Set the project
gcloud config set project ai-integra-course-v2

# Authenticate with Firebase
firebase login

# Select the project
firebase use ai-integra-course-v2
```

### Step 2: Run Optimization

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run the optimization script
./scripts/optimize-firebase.sh --project ai-integra-course-v2
```

This will:
- ✅ Enable all required Google Cloud APIs
- ✅ Configure service accounts and IAM roles
- ✅ Optimize Cloud Functions settings
- ✅ Configure Storage CORS
- ✅ Create optimized build configuration
- ✅ Generate `.gcloudignore` file
- ✅ Create optimization report

### Step 3: Validate Setup

```bash
# Run validation script
./scripts/validate-deployment.sh
```

Review the output and address any errors or warnings.

### Step 4: Deploy

```bash
# Option 1: Full production deployment
./scripts/deploy-production.sh

# Option 2: Quick deployment
npm run deploy

# Option 3: Deploy specific components
npm run deploy:hosting
npm run deploy:functions
```

## What Gets Optimized?

### 1. Google Cloud APIs
All required APIs are automatically enabled:
- Firebase API
- Firebase Hosting API
- Cloud Functions API
- Cloud Build API
- Artifact Registry API
- Secret Manager API
- Firestore API
- Cloud Run API

### 2. Service Accounts
A dedicated service account is created with proper IAM roles:
- `roles/firebase.admin`
- `roles/cloudfunctions.developer`
- `roles/firebasehosting.admin`

### 3. Build Configuration
Optimized `cloudbuild.yaml` with:
- Faster build machines (E2_HIGHCPU_8)
- Efficient dependency caching
- Parallel build steps
- Proper timeout settings

### 4. Cloud Functions
- Default region: `us-central1`
- Node.js 20 runtime
- Optimized memory and timeout settings

### 5. Storage
- CORS configuration for production domains
- Proper caching headers
- Security rules

### 6. Deployment Files
- `.gcloudignore` - Excludes unnecessary files from deployment
- `cloudbuild.yaml` - Optimized build pipeline
- Updated deployment scripts

## Viewing the Optimization Report

After running the optimization:

```bash
# View the report
cat FIREBASE_OPTIMIZATION_REPORT.md

# Or open in your editor
code FIREBASE_OPTIMIZATION_REPORT.md
```

The report includes:
- Configuration status
- Enabled services
- Deployment settings
- Next steps
- Useful commands

## Automated Optimization

The repository includes a GitHub Actions workflow that runs weekly:

**File:** `.github/workflows/firebase-optimize.yml`

**Features:**
- Runs every Sunday at midnight UTC
- Can be triggered manually
- Creates PRs with optimization changes
- Uploads optimization reports as artifacts

**Manual Trigger:**
1. Go to GitHub Actions
2. Select "Optimize Firebase Configuration"
3. Click "Run workflow"

## Troubleshooting

### Issue: "gcloud not authenticated"

```bash
gcloud auth login
gcloud auth application-default login
```

### Issue: "Permission denied"

```bash
# Check project access
gcloud projects get-iam-policy ai-integra-course-v2

# Request access from project owner
```

### Issue: "API not enabled"

The optimization script automatically enables APIs. If manual action is needed:

```bash
# Enable a specific API
gcloud services enable firebase.googleapis.com --project=ai-integra-course-v2
```

### Issue: "Build fails"

```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

## Next Steps

1. **Review Configuration**
   - Check `FIREBASE_OPTIMIZATION_REPORT.md`
   - Verify `firebase.json` settings
   - Review `cloudbuild.yaml`

2. **Test Deployment**
   ```bash
   npm run deploy
   ```

3. **Monitor**
   ```bash
   # View logs
   firebase functions:log
   
   # Check deployment status
   firebase hosting:channel:list
   ```

4. **Set Up CI/CD**
   - Ensure GitHub secret `FIREBASE_SERVICE_ACCOUNT_AI-INTEGRA-COURSE-V2` is set
   - Test automated deployment by pushing to `main` branch

5. **Security Review**
   ```bash
   # Deploy security rules
   firebase deploy --only firestore:rules
   firebase deploy --only storage:rules
   ```

## Common Commands

```bash
# Optimization
./scripts/optimize-firebase.sh --project ai-integra-course-v2

# Validation
./scripts/validate-deployment.sh

# Deployment
./scripts/deploy-production.sh
npm run deploy
npm run deploy:hosting
npm run deploy:functions

# Monitoring
firebase functions:log
firebase hosting:channel:list
gcloud logging read "severity>=ERROR" --limit=50

# Configuration
firebase open
gcloud config list
firebase projects:list
```

## Support

For detailed information, see:
- [FIREBASE_OPTIMIZATION_GUIDE.md](./FIREBASE_OPTIMIZATION_GUIDE.md) - Comprehensive guide
- [BUILD_DEPLOYMENT_GUIDE.md](./BUILD_DEPLOYMENT_GUIDE.md) - Build and deployment details
- [README.md](./README.md) - Project documentation

## Quick Reference

| Task | Command |
|------|---------|
| Optimize Firebase | `./scripts/optimize-firebase.sh` |
| Validate setup | `./scripts/validate-deployment.sh` |
| Deploy to production | `./scripts/deploy-production.sh` |
| Deploy hosting only | `npm run deploy:hosting` |
| Deploy functions only | `npm run deploy:functions` |
| View logs | `firebase functions:log` |
| Start emulators | `firebase emulators:start` |
| Check status | `firebase hosting:channel:list` |

---

**Need Help?**
- Check [FIREBASE_OPTIMIZATION_GUIDE.md](./FIREBASE_OPTIMIZATION_GUIDE.md) for detailed troubleshooting
- Review the optimization report: `FIREBASE_OPTIMIZATION_REPORT.md`
- Run validation: `./scripts/validate-deployment.sh`
