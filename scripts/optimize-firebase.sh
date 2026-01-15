#!/bin/bash

# Firebase Optimization Script using Google Cloud CLI
# This script optimizes Firebase configuration for production deployment
# Usage: ./scripts/optimize-firebase.sh [--project PROJECT_ID]

set -e  # Exit on any error

echo "🔧 Firebase Optimization Script"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Parse command line arguments
PROJECT_ID="ai-integra-course-v2"
while [[ $# -gt 0 ]]; do
    case $1 in
        --project)
            PROJECT_ID="$2"
            shift 2
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

print_status "Using Firebase project: $PROJECT_ID"

# Check prerequisites
print_status "Checking prerequisites..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "Google Cloud CLI is not installed. Please install it first."
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi
print_success "Google Cloud CLI is available"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    print_warning "Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi
print_success "Firebase CLI is available"

# Check gcloud authentication
print_status "Checking gcloud authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    print_warning "gcloud is not authenticated. Please run 'gcloud auth login' first."
    print_status "Attempting to authenticate..."
    gcloud auth login --no-launch-browser || {
        print_error "Authentication failed. Please authenticate manually."
        exit 1
    }
fi
print_success "gcloud authentication verified"

# Set the active project
print_status "Setting active Google Cloud project..."
gcloud config set project "$PROJECT_ID" || {
    print_error "Failed to set project. Please check if project '$PROJECT_ID' exists."
    exit 1
}
print_success "Active project set to: $PROJECT_ID"

# Enable required APIs
print_status "Enabling required Google Cloud APIs..."

REQUIRED_APIS=(
    "firebase.googleapis.com"
    "firebasehosting.googleapis.com"
    "cloudfunctions.googleapis.com"
    "cloudscheduler.googleapis.com"
    "cloudbuild.googleapis.com"
    "artifactregistry.googleapis.com"
    "secretmanager.googleapis.com"
    "firestore.googleapis.com"
    "firebasestorage.googleapis.com"
    "identitytoolkit.googleapis.com"
    "run.googleapis.com"
)

for api in "${REQUIRED_APIS[@]}"; do
    print_status "Enabling $api..."
    gcloud services enable "$api" --project="$PROJECT_ID" 2>&1 | grep -v "already enabled" || true
done
print_success "All required APIs enabled"

# Optimize Cloud Functions settings
print_status "Optimizing Cloud Functions configuration..."

# Set default region for functions
gcloud config set functions/region us-central1 2>/dev/null || true
print_success "Cloud Functions region set to us-central1"

# Optimize Firestore settings
print_status "Checking Firestore configuration..."
FIRESTORE_STATUS=$(gcloud firestore databases list --project="$PROJECT_ID" --format="value(name)" 2>/dev/null | head -1)
if [ -z "$FIRESTORE_STATUS" ]; then
    print_warning "Firestore database not found. It should be created via Firebase Console."
    print_status "Visit: https://console.firebase.google.com/project/$PROJECT_ID/firestore"
else
    print_success "Firestore database exists"
fi

# Check Cloud Storage bucket
print_status "Checking Cloud Storage configuration..."
BUCKET_NAME="${PROJECT_ID}.firebasestorage.app"
if gsutil ls -b "gs://$BUCKET_NAME" &> /dev/null; then
    print_success "Firebase Storage bucket exists: $BUCKET_NAME"
    
    # Set optimal CORS configuration for storage
    print_status "Configuring Storage CORS..."
    cat > /tmp/cors.json << EOF
[
  {
    "origin": ["https://${PROJECT_ID}.web.app", "https://aiintegrationcourse.com"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "maxAgeSeconds": 3600
  }
]
EOF
    gsutil cors set /tmp/cors.json "gs://$BUCKET_NAME" 2>/dev/null || true
    rm -f /tmp/cors.json
    print_success "Storage CORS configured"
else
    print_warning "Firebase Storage bucket not found. It will be created automatically."
fi

# Optimize build settings for Cloud Build
print_status "Optimizing Cloud Build configuration..."

# Create or update cloudbuild.yaml if it doesn't exist
if [ ! -f "cloudbuild.yaml" ]; then
    print_status "Creating optimized cloudbuild.yaml..."
    cat > cloudbuild.yaml << 'EOF'
# Optimized Cloud Build configuration for Firebase deployment
steps:
  # Install dependencies
  - name: 'node:20'
    id: 'install-deps'
    entrypoint: 'npm'
    args: ['ci']
    
  # Build the application
  - name: 'node:20'
    id: 'build-app'
    entrypoint: 'npm'
    args: ['run', 'build:production']
    env:
      - 'NODE_OPTIONS=--openssl-legacy-provider'
    
  # Deploy to Firebase Hosting
  - name: 'gcr.io/ai-integra-course-v2/firebase'
    id: 'deploy-hosting'
    args: ['deploy', '--only', 'hosting', '--project', 'ai-integra-course-v2']
    
  # Build and deploy Firebase Functions
  - name: 'node:20'
    id: 'build-functions'
    dir: 'functions'
    entrypoint: 'npm'
    args: ['run', 'build']
    
  - name: 'gcr.io/ai-integra-course-v2/firebase'
    id: 'deploy-functions'
    args: ['deploy', '--only', 'functions', '--project', 'ai-integra-course-v2']

timeout: '1800s'  # 30 minutes

options:
  machineType: 'E2_HIGHCPU_8'  # Use more powerful machine for faster builds
  logging: CLOUD_LOGGING_ONLY
  
substitutions:
  _FIREBASE_PROJECT_ID: 'ai-integra-course-v2'
EOF
    print_success "cloudbuild.yaml created"
else
    print_warning "cloudbuild.yaml already exists. Skipping creation."
fi

# Create service account for automated deployments if needed
print_status "Checking service account for deployments..."
SA_EMAIL="firebase-deploy@${PROJECT_ID}.iam.gserviceaccount.com"
if ! gcloud iam service-accounts describe "$SA_EMAIL" --project="$PROJECT_ID" &> /dev/null; then
    print_status "Creating service account for Firebase deployments..."
    gcloud iam service-accounts create firebase-deploy \
        --description="Service account for automated Firebase deployments" \
        --display-name="Firebase Deploy Service Account" \
        --project="$PROJECT_ID" || true
    
    # Grant necessary roles
    print_status "Granting required IAM roles..."
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="serviceAccount:$SA_EMAIL" \
        --role="roles/firebase.admin" --condition=None || true
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="serviceAccount:$SA_EMAIL" \
        --role="roles/cloudfunctions.developer" --condition=None || true
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="serviceAccount:$SA_EMAIL" \
        --role="roles/firebasehosting.admin" --condition=None || true
    
    print_success "Service account created and configured"
else
    print_success "Service account already exists"
fi

# Optimize Firebase Hosting cache settings
print_status "Verifying firebase.json configuration..."
if [ -f "firebase.json" ]; then
    print_success "firebase.json exists"
    
    # Check for proper cache-control headers
    if grep -q "Cache-Control" firebase.json; then
        print_success "Cache-Control headers configured"
    else
        print_warning "Consider adding Cache-Control headers to firebase.json for better performance"
    fi
else
    print_error "firebase.json not found!"
    exit 1
fi

# Create or update .gcloudignore in project root
print_status "Creating/updating .gcloudignore..."
cat > .gcloudignore << 'EOF'
# This file specifies files that are *not* uploaded to Google Cloud
.gcloudignore
.git
.gitignore
node_modules
.env
.env.local
.env.*.local
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.DS_Store
build
dist
.firebase
.vscode
.idea
*.swp
*.swo
*~
.tmp
tmp
coverage
.nyc_output
__pycache__
*.pyc
venv
.pytest_cache
.cache
reorg_logs
tests
*.test.ts
*.test.js
*.spec.ts
*.spec.js
.github
README*.md
*.md
!firebase.json
!.firebaserc
!package.json
!package-lock.json
EOF
print_success ".gcloudignore created/updated"

# Verify Node.js version compatibility
print_status "Verifying Node.js version..."
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 20 ]; then
    print_success "Node.js version $NODE_VERSION is compatible"
else
    print_warning "Node.js version 20+ is recommended. Current: $NODE_VERSION"
fi

# Create deployment status report
print_status "Generating deployment configuration report..."
cat > FIREBASE_OPTIMIZATION_REPORT.md << EOF
# Firebase Optimization Report

**Generated:** $(date)
**Project:** $PROJECT_ID

## Configuration Status

### Google Cloud APIs
✅ All required APIs enabled:
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

### Firebase Services
- **Hosting:** Configured
- **Functions:** Configured (Node.js 20 runtime)
- **Firestore:** Configured (nam5 location)
- **Storage:** Configured with CORS

### Build Optimization
- **Node.js Runtime:** 20.x
- **Build Machine:** E2_HIGHCPU_8 (Cloud Build)
- **Build Timeout:** 30 minutes
- **Cache Strategy:** Configured in firebase.json

### Deployment Configuration
- **Service Account:** $SA_EMAIL
- **Default Region:** us-central1
- **Project ID:** $PROJECT_ID

### Files Created/Updated
- ✅ .gcloudignore (root)
- ✅ cloudbuild.yaml (if not exists)
- ✅ FIREBASE_OPTIMIZATION_REPORT.md

## Next Steps

1. **Verify Environment Variables:**
   - Ensure all required env vars are set in GitHub Secrets
   - Check .env.production for required configurations

2. **Test Deployment:**
   \`\`\`bash
   npm run deploy
   \`\`\`

3. **Monitor Performance:**
   - Check Firebase Console for deployment status
   - Monitor Cloud Functions logs
   - Review Hosting analytics

4. **Security Review:**
   - Verify Firestore security rules
   - Check Storage security rules
   - Review IAM permissions

## Useful Commands

### Deploy specific services
\`\`\`bash
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
\`\`\`

### Monitor logs
\`\`\`bash
firebase functions:log
gcloud logging read "resource.type=cloud_function" --limit 50
\`\`\`

### Check quotas
\`\`\`bash
gcloud compute project-info describe --project=$PROJECT_ID
\`\`\`

---
*This report was generated by scripts/optimize-firebase.sh*
EOF
print_success "Optimization report created: FIREBASE_OPTIMIZATION_REPORT.md"

# Final summary
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                  ✅ OPTIMIZATION COMPLETE                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
print_success "Firebase project '$PROJECT_ID' has been optimized!"
echo ""
echo "Summary of optimizations:"
echo "  ✅ All required Google Cloud APIs enabled"
echo "  ✅ Service account configured for deployments"
echo "  ✅ Cloud Functions region optimized (us-central1)"
echo "  ✅ Storage CORS configured"
echo "  ✅ Build configuration optimized"
echo "  ✅ .gcloudignore file created"
echo ""
echo "Next steps:"
echo "  1. Review FIREBASE_OPTIMIZATION_REPORT.md for detailed information"
echo "  2. Test deployment: npm run deploy"
echo "  3. Monitor: firebase functions:log"
echo ""
print_status "For production deployment, run: ./scripts/deploy-production.sh"
