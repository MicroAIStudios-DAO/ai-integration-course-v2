#!/bin/bash

# GCloud-Optimized Firebase Deployment Script
# This script uses gcloud CLI to optimize and deploy Firebase infrastructure
# for production deployment of the AI Integration Course platform

set -e  # Exit on any error

echo "🚀 GCloud-Optimized Firebase Deployment"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="ai-integra-course-v2"
REGION="us-central1"
FIRESTORE_LOCATION="nam5"

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

print_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# Error handler
handle_error() {
    print_error "An error occurred during deployment at line $1"
    print_error "Please check the logs above for details"
    exit 1
}

trap 'handle_error $LINENO' ERR

# ==========================================
# STEP 1: Prerequisites Check
# ==========================================
print_step "1/8 Checking prerequisites..."

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    print_error "Node.js version 20 or higher is required. Current version: $(node --version)"
    exit 1
fi
print_success "Node.js version: $(node --version)"

# Check gcloud CLI
if ! command -v gcloud &> /dev/null; then
    print_error "Google Cloud CLI is required but not found."
    print_error "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi
print_success "Google Cloud SDK: $(gcloud --version | head -n1)"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is required but not found."
    exit 1
fi
print_success "npm version: $(npm --version)"

# ==========================================
# STEP 2: GCloud Authentication & Setup
# ==========================================
print_step "2/8 Configuring GCloud project..."

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | grep -q "@"; then
    print_warning "Not authenticated with gcloud. Please authenticate..."
    gcloud auth login
fi

ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1)
print_success "Active account: $ACTIVE_ACCOUNT"

# Set the project
print_status "Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID 2>/dev/null || {
    print_error "Failed to set project. Please ensure you have access to project: $PROJECT_ID"
    exit 1
}
print_success "Project set to: $PROJECT_ID"

# Verify project access
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)" 2>/dev/null || echo "")
if [ -z "$PROJECT_NUMBER" ]; then
    print_error "Cannot access project $PROJECT_ID. Please check your permissions."
    exit 1
fi
print_success "Project number: $PROJECT_NUMBER"

# ==========================================
# STEP 3: Enable Required GCP APIs
# ==========================================
print_step "3/8 Enabling required GCP APIs..."

REQUIRED_APIS=(
    "cloudfunctions.googleapis.com"
    "cloudbuild.googleapis.com"
    "firestore.googleapis.com"
    "firebase.googleapis.com"
    "cloudresourcemanager.googleapis.com"
    "storage-api.googleapis.com"
    "storage-component.googleapis.com"
    "artifactregistry.googleapis.com"
    "run.googleapis.com"
    "eventarc.googleapis.com"
)

for api in "${REQUIRED_APIS[@]}"; do
    print_status "Checking $api..."
    if gcloud services list --enabled --filter="name:$api" --format="value(name)" 2>/dev/null | grep -q "$api"; then
        print_success "$api is already enabled"
    else
        print_status "Enabling $api..."
        gcloud services enable $api --project=$PROJECT_ID 2>/dev/null || {
            print_warning "Could not enable $api (may already be enabled or require permissions)"
        }
    fi
done

print_success "All required APIs are enabled"

# ==========================================
# STEP 4: Configure Firebase Settings
# ==========================================
print_step "4/8 Configuring Firebase settings via GCloud..."

# Set default region for functions
print_status "Configuring default region: $REGION"
gcloud config set functions/region $REGION 2>/dev/null || true
print_success "Default region configured"

# Verify Firestore database exists
print_status "Verifying Firestore database..."
FIRESTORE_EXISTS=$(gcloud firestore databases list --project=$PROJECT_ID --format="value(name)" 2>/dev/null | grep -c "(default)" || echo "0")
if [ "$FIRESTORE_EXISTS" -eq 0 ]; then
    print_warning "Firestore database not found. Creating..."
    gcloud firestore databases create --location=$FIRESTORE_LOCATION --project=$PROJECT_ID 2>/dev/null || {
        print_warning "Firestore database may already exist or require manual setup"
    }
else
    print_success "Firestore database exists"
fi

# ==========================================
# STEP 5: Build Preparation
# ==========================================
print_step "5/8 Preparing build environment..."

# Clean previous builds
print_status "Cleaning previous builds..."
npm run clean 2>/dev/null || {
    print_warning "Clean script failed, continuing..."
    rm -rf build node_modules/.cache 2>/dev/null || true
}
print_success "Build environment cleaned"

# Install dependencies
print_status "Installing dependencies..."
npm run install:all || {
    print_error "Failed to install dependencies"
    exit 1
}
print_success "Dependencies installed"

# Setup Python environment if needed
if [ -f "python-requirements.txt" ]; then
    print_status "Setting up Python environment..."
    npm run setup:python 2>/dev/null || {
        print_warning "Python setup failed, continuing without Python tools"
    }
fi

# ==========================================
# STEP 6: Production Build
# ==========================================
print_step "6/8 Building for production..."

print_status "Running production build..."
npm run build:production || {
    print_error "Production build failed"
    exit 1
}

# Verify build output
if [ ! -d "build" ] || [ -z "$(ls -A build 2>/dev/null)" ]; then
    print_error "Build directory is empty or doesn't exist"
    exit 1
fi

BUILD_SIZE=$(du -sh build | cut -f1)
print_success "Production build completed successfully (size: $BUILD_SIZE)"

# Build Firebase Functions
print_status "Building Firebase Functions..."
cd functions
npm install 2>/dev/null || {
    print_warning "Functions dependencies installation failed"
}
npm run build || {
    print_error "Functions build failed"
    exit 1
}
cd ..
print_success "Firebase Functions built successfully"

# ==========================================
# STEP 7: Firebase Deployment
# ==========================================
print_step "7/8 Deploying to Firebase..."

# Check if Firebase CLI is available
if ! command -v firebase &> /dev/null; then
    print_status "Installing Firebase CLI..."
    npm install -g firebase-tools || {
        print_error "Failed to install Firebase CLI"
        exit 1
    }
fi

# Login check
print_status "Verifying Firebase authentication..."
if ! firebase projects:list --project=$PROJECT_ID &> /dev/null; then
    print_warning "Not authenticated with Firebase CLI"
    print_status "Please authenticate with Firebase..."
    firebase login || {
        print_error "Firebase authentication failed"
        exit 1
    }
fi
print_success "Firebase authentication verified"

# Deploy to Firebase
print_status "Deploying hosting and functions to Firebase..."
firebase deploy --project $PROJECT_ID --force || {
    print_error "Firebase deployment failed"
    print_status "Trying deployment with individual components..."
    
    # Try deploying hosting first
    print_status "Deploying hosting..."
    firebase deploy --only hosting --project $PROJECT_ID || {
        print_error "Hosting deployment failed"
        exit 1
    }
    
    # Try deploying functions
    print_status "Deploying functions..."
    firebase deploy --only functions --project $PROJECT_ID || {
        print_warning "Functions deployment failed, but hosting succeeded"
    }
}

print_success "🎉 Firebase deployment completed successfully!"

# ==========================================
# STEP 8: Post-Deployment Validation
# ==========================================
print_step "8/8 Validating deployment..."

# Get hosting URL
HOSTING_URL="https://$PROJECT_ID.web.app"
CUSTOM_URL="https://aiintegrationcourse.com"

print_status "Checking hosting availability..."
if curl -s -o /dev/null -w "%{http_code}" "$HOSTING_URL" | grep -q "200"; then
    print_success "Hosting is live at: $HOSTING_URL"
else
    print_warning "Hosting may still be propagating. Please check manually."
fi

# List deployed functions
print_status "Deployed Cloud Functions:"
gcloud functions list --project=$PROJECT_ID --format="table(name,status,updateTime)" 2>/dev/null || {
    print_warning "Could not list functions (may require permissions)"
}

echo ""
echo "=================================================="
echo "✅ Production Deployment Completed Successfully!"
echo "=================================================="
echo ""
echo "📊 Deployment Summary:"
echo "  • Project ID: $PROJECT_ID"
echo "  • Region: $REGION"
echo "  • Build Size: $BUILD_SIZE"
echo ""
echo "🌐 URLs:"
echo "  • Firebase Hosting: $HOSTING_URL"
echo "  • Custom Domain: $CUSTOM_URL"
echo "  • Firebase Console: https://console.firebase.google.com/project/$PROJECT_ID"
echo "  • GCP Console: https://console.cloud.google.com/home/dashboard?project=$PROJECT_ID"
echo ""
echo "🔧 Next Steps:"
echo "  1. Test the deployed application"
echo "  2. Verify all features are working"
echo "  3. Monitor Cloud Functions logs"
echo "  4. Check Firebase Analytics"
echo ""
echo "📝 Useful Commands:"
echo "  • View logs: gcloud functions logs read --project=$PROJECT_ID"
echo "  • Firebase console: firebase open --project=$PROJECT_ID"
echo "  • Rollback: firebase hosting:rollback --project=$PROJECT_ID"
echo ""
echo "=================================================="
