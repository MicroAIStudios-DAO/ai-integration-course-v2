#!/bin/bash

# GCloud Firebase Initial Setup Script
# This script performs the initial GCloud and Firebase setup for the project

set -e

echo "🛠️  GCloud Firebase Initial Setup"
echo "=================================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_step() { echo -e "${CYAN}[STEP]${NC} $1"; }

PROJECT_ID="ai-integra-course-v2"
REGION="us-central1"
FIRESTORE_LOCATION="nam5"

# Check prerequisites
print_step "Checking prerequisites..."

if ! command -v gcloud &> /dev/null; then
    print_error "GCloud CLI is required but not found"
    print_error "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi
print_success "GCloud CLI found"

if ! command -v npm &> /dev/null; then
    print_error "npm is required but not found"
    exit 1
fi
print_success "npm found"

# GCloud authentication
print_step "GCloud Authentication..."

if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | grep -q "@"; then
    print_status "Authenticating with GCloud..."
    gcloud auth login || {
        print_error "GCloud authentication failed"
        exit 1
    }
fi

ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1)
print_success "Authenticated as: $ACTIVE_ACCOUNT"

# Application Default Credentials
print_status "Setting up Application Default Credentials..."
if [ -n "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    print_success "Using GOOGLE_APPLICATION_CREDENTIALS: $GOOGLE_APPLICATION_CREDENTIALS"
elif ! gcloud auth application-default print-access-token &>/dev/null; then
    print_status "Configuring Application Default Credentials..."
    gcloud auth application-default login || {
        print_warning "Application Default Credentials setup failed (optional)"
    }
else
    print_success "Application Default Credentials configured"
fi

# Set project
print_step "Configuring GCloud project..."

print_status "Setting project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID || {
    print_error "Failed to set project. Please ensure you have access to: $PROJECT_ID"
    exit 1
}
print_success "Project set to: $PROJECT_ID"

# Verify project access
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)" 2>/dev/null || echo "")
if [ -z "$PROJECT_NUMBER" ]; then
    print_error "Cannot access project: $PROJECT_ID"
    print_error "Please ensure you have the necessary permissions"
    exit 1
fi
print_success "Project number: $PROJECT_NUMBER"

# Set default region
print_status "Setting default region: $REGION"
gcloud config set functions/region $REGION 2>/dev/null || true
gcloud config set run/region $REGION 2>/dev/null || true
print_success "Default region configured"

# Enable required APIs
print_step "Enabling required GCP APIs..."

APIS=(
    "cloudfunctions.googleapis.com:Cloud Functions API"
    "cloudbuild.googleapis.com:Cloud Build API"
    "firestore.googleapis.com:Cloud Firestore API"
    "firebase.googleapis.com:Firebase Management API"
    "cloudresourcemanager.googleapis.com:Cloud Resource Manager API"
    "storage-api.googleapis.com:Google Cloud Storage JSON API"
    "storage-component.googleapis.com:Cloud Storage"
    "artifactregistry.googleapis.com:Artifact Registry API"
    "run.googleapis.com:Cloud Run API"
    "eventarc.googleapis.com:Eventarc API"
    "secretmanager.googleapis.com:Secret Manager API"
    "cloudscheduler.googleapis.com:Cloud Scheduler API"
)

for api_entry in "${APIS[@]}"; do
    api=$(echo "$api_entry" | cut -d: -f1)
    description=$(echo "$api_entry" | cut -d: -f2)
    
    print_status "Enabling $description..."
    if gcloud services enable "$api" --project="$PROJECT_ID" 2>/dev/null; then
        print_success "$description enabled"
    else
        print_warning "Could not enable $description (may already be enabled)"
    fi
done

print_success "All required APIs enabled"

# Configure Firestore
print_step "Configuring Firestore..."

FIRESTORE_EXISTS=$(gcloud firestore databases list --project=$PROJECT_ID --format="value(name)" 2>/dev/null | grep -c "(default)" || echo "0")
if [ "$FIRESTORE_EXISTS" -eq 0 ]; then
    print_status "Creating Firestore database in location: $FIRESTORE_LOCATION"
    gcloud firestore databases create --location=$FIRESTORE_LOCATION --project=$PROJECT_ID 2>/dev/null || {
        print_warning "Firestore database creation failed (may already exist)"
    }
    print_success "Firestore database created"
else
    print_success "Firestore database already exists"
fi

# Configure Firebase CLI
print_step "Configuring Firebase CLI..."

if ! command -v firebase &> /dev/null; then
    print_status "Installing Firebase CLI..."
    npm install -g firebase-tools || {
        print_error "Failed to install Firebase CLI"
        exit 1
    }
    print_success "Firebase CLI installed"
else
    print_success "Firebase CLI already installed: $(firebase --version)"
fi

# Firebase authentication
print_status "Authenticating with Firebase..."
if ! firebase projects:list &> /dev/null; then
    firebase login || {
        print_error "Firebase authentication failed"
        exit 1
    }
fi
print_success "Firebase authentication successful"

# Set Firebase project
print_status "Setting Firebase project..."
firebase use $PROJECT_ID || {
    print_error "Failed to set Firebase project"
    exit 1
}
print_success "Firebase project set to: $PROJECT_ID"

# Create service account for GitHub Actions (if needed)
print_step "Configuring service account for CI/CD..."

SERVICE_ACCOUNT_NAME="firebase-deployer"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

if gcloud iam service-accounts describe $SERVICE_ACCOUNT_EMAIL --project=$PROJECT_ID &>/dev/null; then
    print_success "Service account already exists: $SERVICE_ACCOUNT_EMAIL"
else
    print_status "Creating service account: $SERVICE_ACCOUNT_NAME"
    gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
        --display-name="Firebase Deployer for CI/CD" \
        --project=$PROJECT_ID || {
        print_warning "Service account creation failed (may already exist)"
    }
fi

# Grant necessary roles
print_status "Granting IAM roles to service account..."
ROLES=(
    "roles/firebase.admin"
    "roles/firebasehosting.admin"
    "roles/cloudfunctions.admin"
    "roles/iam.serviceAccountUser"
)

for role in "${ROLES[@]}"; do
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
        --role="$role" \
        --condition=None \
        >/dev/null 2>&1 || {
        print_warning "Could not grant $role (may already be granted)"
    }
done
print_success "IAM roles configured"

# Install project dependencies
print_step "Installing project dependencies..."

print_status "Installing root dependencies..."
npm install || {
    print_error "Failed to install root dependencies"
    exit 1
}
print_success "Root dependencies installed"

print_status "Installing functions dependencies..."
cd functions && npm install && cd .. || {
    print_error "Failed to install functions dependencies"
    exit 1
}
print_success "Functions dependencies installed"

# Setup Python environment if needed
if [ -f "python-requirements.txt" ]; then
    print_status "Setting up Python environment..."
    python3 -m venv venv 2>/dev/null || {
        print_warning "Python venv creation failed"
    }
    if [ -d "venv" ]; then
        source venv/bin/activate
        pip install -r python-requirements.txt 2>/dev/null || {
            print_warning "Python dependencies installation failed"
        }
        deactivate
        print_success "Python environment configured"
    fi
fi

echo ""
echo "=================================================="
print_success "✅ GCloud Firebase Setup Complete!"
echo "=================================================="
echo ""
echo "📊 Configuration Summary:"
echo "  • Project ID: $PROJECT_ID"
echo "  • Project Number: $PROJECT_NUMBER"
echo "  • Region: $REGION"
echo "  • Firestore Location: $FIRESTORE_LOCATION"
echo "  • Active Account: $ACTIVE_ACCOUNT"
echo ""
echo "🔧 Service Account (for CI/CD):"
echo "  • Name: $SERVICE_ACCOUNT_NAME"
echo "  • Email: $SERVICE_ACCOUNT_EMAIL"
echo ""
echo "🎯 Next Steps:"
echo "  1. Validate setup: ./scripts/gcloud-validate.sh"
echo "  2. Deploy: ./scripts/gcloud-deploy.sh"
echo "  3. Or use npm: npm run deploy:gcloud"
echo ""
echo "💡 Tips:"
echo "  • To generate service account key for GitHub:"
echo "    gcloud iam service-accounts keys create key.json \\"
echo "      --iam-account=$SERVICE_ACCOUNT_EMAIL"
echo "  • Add key.json content to GitHub Secrets as FIREBASE_SERVICE_ACCOUNT_AI_INTEGRA_COURSE_V2"
echo ""
echo "=================================================="
