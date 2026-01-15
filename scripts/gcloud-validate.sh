#!/bin/bash

# GCloud Firebase Setup & Validation Script
# This script validates and configures GCloud for optimal Firebase deployment

set -e

echo "🔧 GCloud Firebase Setup & Validation"
echo "=================================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

PROJECT_ID="ai-integra-course-v2"
VALIDATION_PASSED=true

# Check GCloud CLI
print_status "Checking GCloud CLI installation..."
if ! command -v gcloud &> /dev/null; then
    print_error "GCloud CLI not found!"
    print_error "Install from: https://cloud.google.com/sdk/docs/install"
    VALIDATION_PASSED=false
else
    print_success "GCloud CLI installed: $(gcloud --version | head -n1)"
fi

# Check authentication
print_status "Checking GCloud authentication..."
if gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | grep -q "@"; then
    ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1)
    print_success "Authenticated as: $ACTIVE_ACCOUNT"
else
    print_warning "Not authenticated with GCloud"
    print_status "Run: gcloud auth login"
    VALIDATION_PASSED=false
fi

# Check project access
print_status "Checking project access..."
if gcloud projects describe $PROJECT_ID &>/dev/null; then
    PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
    print_success "Project accessible: $PROJECT_ID (number: $PROJECT_NUMBER)"
else
    print_error "Cannot access project: $PROJECT_ID"
    print_status "Run: gcloud config set project $PROJECT_ID"
    VALIDATION_PASSED=false
fi

# Check Firebase CLI
print_status "Checking Firebase CLI..."
if command -v firebase &> /dev/null; then
    print_success "Firebase CLI installed: $(firebase --version)"
else
    print_warning "Firebase CLI not found"
    print_status "Install: npm install -g firebase-tools"
fi

# Check Node.js version
print_status "Checking Node.js version..."
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 20 ]; then
    print_success "Node.js version: $(node --version)"
else
    print_error "Node.js 20+ required. Current: $(node --version)"
    VALIDATION_PASSED=false
fi

# Check npm
print_status "Checking npm..."
if command -v npm &> /dev/null; then
    print_success "npm version: $(npm --version)"
else
    print_error "npm not found!"
    VALIDATION_PASSED=false
fi

# Check enabled APIs
print_status "Checking required GCP APIs..."
REQUIRED_APIS=(
    "cloudfunctions.googleapis.com"
    "cloudbuild.googleapis.com"
    "firestore.googleapis.com"
    "firebase.googleapis.com"
)

APIS_OK=true
for api in "${REQUIRED_APIS[@]}"; do
    if gcloud services list --enabled --filter="name:$api" --format="value(name)" 2>/dev/null | grep -q "$api"; then
        echo "  ✓ $api"
    else
        echo "  ✗ $api (not enabled)"
        APIS_OK=false
    fi
done

if [ "$APIS_OK" = false ]; then
    print_warning "Some APIs are not enabled"
    print_status "Enable with: gcloud services enable <api-name>"
else
    print_success "All required APIs enabled"
fi

# Check Firestore
print_status "Checking Firestore database..."
if gcloud firestore databases list --project=$PROJECT_ID --format="value(name)" 2>/dev/null | grep -q "(default)"; then
    print_success "Firestore database exists"
else
    print_warning "Firestore database not found"
    print_status "Create with: gcloud firestore databases create --location=nam5"
fi

# Check IAM permissions
print_status "Checking IAM permissions..."
if gcloud projects get-iam-policy $PROJECT_ID &>/dev/null; then
    print_success "IAM policy accessible"
else
    print_warning "Cannot access IAM policy (may require permissions)"
fi

echo ""
echo "=================================================="
if [ "$VALIDATION_PASSED" = true ]; then
    print_success "✅ All validations passed!"
    print_status "Ready for deployment"
    echo ""
    print_status "Next steps:"
    echo "  1. Run: ./scripts/gcloud-deploy.sh"
    echo "  2. Or: npm run deploy:gcloud"
else
    print_error "❌ Some validations failed"
    print_status "Please fix the issues above before deploying"
    exit 1
fi
echo "=================================================="
