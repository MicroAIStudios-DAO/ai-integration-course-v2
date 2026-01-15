#!/bin/bash

# Production Deployment Script for AI Integration Course
# This script handles the complete production deployment process
# Enhanced with gcloud optimization

set -e  # Exit on any error

echo "🚀 Starting Production Deployment for AI Integration Course"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
PROJECT_ID=${FIREBASE_PROJECT_ID:-ai-integra-course-v2}

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

# Check prerequisites
print_status "Checking prerequisites..."

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    print_error "Node.js version 20 or higher is required. Current version: $(node --version)"
    exit 1
fi
print_success "Node.js version check passed: $(node --version)"

# Check if Firebase CLI is available
if ! command -v firebase &> /dev/null; then
    print_warning "Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi
print_success "Firebase CLI is available"

# Check if gcloud CLI is available (optional)
if ! command -v gcloud &> /dev/null; then
    print_warning "Google Cloud CLI not found. Some optimizations will be skipped."
    print_status "For optimal deployment, install gcloud: https://cloud.google.com/sdk/docs/install"
    GCLOUD_AVAILABLE=false
else
    print_success "Google Cloud CLI is available: $(gcloud --version | head -n1)"
    GCLOUD_AVAILABLE=true
    
    # Verify gcloud project is set
    CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
    if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
        print_status "Setting gcloud project to $PROJECT_ID..."
        gcloud config set project "$PROJECT_ID" 2>/dev/null || {
            print_warning "Could not set gcloud project (continuing anyway)"
        }
    fi
fi

# Run Firebase optimization if not already done
if [ ! -f "FIREBASE_OPTIMIZATION_REPORT.md" ]; then
    print_status "Running Firebase optimization for first-time setup..."
    if [ -f "scripts/optimize-firebase.sh" ]; then
        ./scripts/optimize-firebase.sh --project "$PROJECT_ID" || print_warning "Optimization script encountered issues (non-critical)"
    else
        print_warning "Optimization script not found. Skipping optimization."
    fi
fi

# Run pre-deployment validation
if [ -f "scripts/validate-deployment.sh" ]; then
    print_status "Running pre-deployment validation..."
    ./scripts/validate-deployment.sh || {
        print_error "Pre-deployment validation failed. Please fix errors before deploying."
        exit 1
    }
else
    print_warning "Validation script not found. Skipping validation checks."
fi

# Clean previous builds
print_status "Cleaning previous builds..."
npm run clean
print_success "Cleaned previous builds"

# Install all dependencies
print_status "Installing all dependencies..."
npm run install:all
print_success "Dependencies installed"

# Set up Python environment if requirements exist
if [ -f "python-requirements.txt" ]; then
    print_status "Setting up Python virtual environment..."
    npm run setup:python
    print_success "Python environment set up"
fi

# Build for production
print_status "Building for production..."
npm run build:production
print_success "Production build completed"

# Check if build directory exists and has content
if [ ! -d "build" ] || [ -z "$(ls -A build)" ]; then
    print_error "Build directory is empty or doesn't exist"
    exit 1
fi
print_success "Build artifacts verified"

# Deploy to Firebase
print_status "Deploying to Firebase..."

# Respect overrides while defaulting to the production IDs
SITE_ID=${FIREBASE_HOSTING_SITE:-$PROJECT_ID}
FUNCTIONS_REGION=${FIREBASE_FUNCTIONS_REGION:-us-central1}

# Prepare authentication flags for non-interactive environments
FIREBASE_FLAGS=("--project" "$PROJECT_ID")

if [ -n "${FIREBASE_TOKEN}" ]; then
    print_status "Using FIREBASE_TOKEN for authentication"
    FIREBASE_FLAGS+=("--token" "${FIREBASE_TOKEN}")
else
    print_status "Checking Firebase authentication state..."
    if ! firebase projects:list &> /dev/null; then
        print_error "Authentication with Firebase failed. Set FIREBASE_TOKEN or run 'firebase login'."
        exit 1
    fi
fi

# Validate that the resolved PROJECT_ID exists and is accessible
if ! firebase projects:list --json | grep -q "\"projectId\": \"$PROJECT_ID\""; then
    print_error "The resolved PROJECT_ID '$PROJECT_ID' does not exist or is not accessible. Please check your configuration and permissions."
    exit 1
fi
print_success "Verified that PROJECT_ID '$PROJECT_ID' exists and is accessible."

# Deploy hosting and functions
firebase deploy "${FIREBASE_FLAGS[@]}"

if [ $? -eq 0 ]; then
    print_success "🎉 Production deployment completed successfully!"
    print_status "Your application is now live at: https://$SITE_ID.web.app"
else
    print_error "Deployment failed. Please check the logs above."
    exit 1
fi

print_status "Verifying hosting release with gcloud..."
if gcloud firebase hosting:releases list --project "$PROJECT_ID" --site "$SITE_ID" --limit=1; then
    print_success "Latest Firebase Hosting release confirmed for site '$SITE_ID'."
else
    print_warning "Unable to list hosting releases with gcloud. Verify the Firebase CLI output manually."
fi

print_status "Verifying Cloud Functions deployment with gcloud..."
if gcloud functions list --project "$PROJECT_ID" --regions "$FUNCTIONS_REGION"; then
    print_success "Cloud Functions are deployed in region '$FUNCTIONS_REGION'."
else
    print_warning "Failed to enumerate Cloud Functions with gcloud. Ensure functions were deployed and gcloud components are up to date."
fi

echo "=================================================="
echo "✅ Production deployment completed!"
echo "🌐 Frontend: https://$SITE_ID.web.app"
echo "🔧 Firebase Console: https://console.firebase.google.com/project/$PROJECT_ID"
echo "=================================================="
