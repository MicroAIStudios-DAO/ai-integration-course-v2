#!/bin/bash

# Pre-deployment validation script for Firebase
# This script validates the project configuration before deployment
# Usage: ./scripts/validate-deployment.sh

set -e

echo "🔍 Firebase Deployment Validation"
echo "=================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[⚠]${NC} $1"; WARNINGS=$((WARNINGS+1)); }
print_error() { echo -e "${RED}[✗]${NC} $1"; ERRORS=$((ERRORS+1)); }

echo ""
echo "=== Prerequisites Check ==="

# Check Node.js version
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 20 ]; then
        print_success "Node.js version: $(node --version)"
    else
        print_error "Node.js version 20+ required. Current: $(node --version)"
    fi
else
    print_error "Node.js is not installed"
fi

# Check npm
if command -v npm &> /dev/null; then
    print_success "npm version: $(npm --version)"
else
    print_error "npm is not installed"
fi

# Check Firebase CLI
if command -v firebase &> /dev/null; then
    print_success "Firebase CLI version: $(firebase --version)"
else
    print_warning "Firebase CLI is not installed (recommended)"
fi

# Check gcloud CLI
if command -v gcloud &> /dev/null; then
    print_success "gcloud CLI version: $(gcloud --version | head -1)"
    
    # Check gcloud authentication
    if gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
        ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | head -1)
        if [ -n "$ACTIVE_ACCOUNT" ]; then
            print_success "gcloud authenticated as: $ACTIVE_ACCOUNT"
        else
            print_warning "gcloud is not authenticated"
        fi
    fi
    
    # Check active project
    ACTIVE_PROJECT=$(gcloud config get-value project 2>/dev/null)
    if [ -n "$ACTIVE_PROJECT" ]; then
        print_success "Active gcloud project: $ACTIVE_PROJECT"
    else
        print_warning "No active gcloud project set"
    fi
else
    print_warning "gcloud CLI is not installed (recommended for optimization)"
fi

echo ""
echo "=== Configuration Files Check ==="

# Check firebase.json
if [ -f "firebase.json" ]; then
    print_success "firebase.json exists"
    
    # Validate JSON syntax
    if python3 -m json.tool firebase.json > /dev/null 2>&1; then
        print_success "firebase.json is valid JSON"
    else
        print_error "firebase.json has invalid JSON syntax"
    fi
    
    # Check for hosting configuration
    if grep -q '"hosting"' firebase.json; then
        print_success "Hosting configuration found"
        
        # Check build directory
        BUILD_DIR=$(grep -A 5 '"hosting"' firebase.json | grep '"public"' | cut -d'"' -f4)
        if [ -n "$BUILD_DIR" ]; then
            print_success "Build directory configured: $BUILD_DIR"
        fi
    else
        print_warning "No hosting configuration in firebase.json"
    fi
    
    # Check for functions configuration
    if grep -q '"functions"' firebase.json; then
        print_success "Functions configuration found"
    fi
    
else
    print_error "firebase.json not found"
fi

# Check .firebaserc
if [ -f ".firebaserc" ]; then
    print_success ".firebaserc exists"
    
    # Check for default project
    if grep -q '"default"' .firebaserc; then
        DEFAULT_PROJECT=$(grep -A 1 '"default"' .firebaserc | grep -v 'default' | cut -d'"' -f2)
        print_success "Default Firebase project: $DEFAULT_PROJECT"
    fi
else
    print_error ".firebaserc not found"
fi

# Check package.json
if [ -f "package.json" ]; then
    print_success "package.json exists"
    
    # Check for build script
    if grep -q '"build"' package.json; then
        print_success "Build script found in package.json"
    else
        print_warning "No build script in package.json"
    fi
    
    # Check for deploy scripts
    if grep -q '"deploy"' package.json; then
        print_success "Deploy script found in package.json"
    else
        print_warning "No deploy script in package.json"
    fi
else
    print_error "package.json not found"
fi

# Check .gcloudignore
if [ -f ".gcloudignore" ]; then
    print_success ".gcloudignore exists"
else
    print_warning ".gcloudignore not found (recommended for Cloud Build)"
fi

echo ""
echo "=== Dependencies Check ==="

# Check if node_modules exists
if [ -d "node_modules" ]; then
    print_success "node_modules directory exists"
else
    print_warning "node_modules not found. Run 'npm install' first."
fi

# Check if package-lock.json exists
if [ -f "package-lock.json" ]; then
    print_success "package-lock.json exists"
else
    print_warning "package-lock.json not found"
fi

echo ""
echo "=== Build Validation ==="

# Check if build directory exists
if [ -d "build" ]; then
    print_success "build directory exists"
    
    # Check if build has content
    if [ "$(ls -A build)" ]; then
        print_success "build directory has content"
        
        # Check for index.html
        if [ -f "build/index.html" ]; then
            print_success "build/index.html exists"
        else
            print_warning "build/index.html not found"
        fi
    else
        print_warning "build directory is empty. Run 'npm run build' first."
    fi
else
    print_warning "build directory not found. Run 'npm run build' first."
fi

echo ""
echo "=== Firebase Functions Check ==="

# Check functions directory
if [ -d "functions" ]; then
    print_success "functions directory exists"
    
    # Check functions/package.json
    if [ -f "functions/package.json" ]; then
        print_success "functions/package.json exists"
        
        # Check Node.js runtime in functions
        if grep -q '"node"' functions/package.json; then
            NODE_RUNTIME=$(grep '"node"' functions/package.json | cut -d'"' -f4)
            print_success "Functions Node.js runtime: $NODE_RUNTIME"
        fi
    else
        print_warning "functions/package.json not found"
    fi
    
    # Check if functions are built
    if [ -d "functions/lib" ]; then
        print_success "functions/lib directory exists (functions are built)"
    else
        print_warning "functions/lib not found. Run 'cd functions && npm run build'"
    fi
else
    print_warning "functions directory not found (optional)"
fi

echo ""
echo "=== Environment Variables Check ==="

# Check for environment files
if [ -f ".env.production" ]; then
    print_success ".env.production exists"
else
    print_warning ".env.production not found"
fi

if [ -f ".env.local" ]; then
    print_success ".env.local exists"
else
    print_warning ".env.local not found (optional for local development)"
fi

# Check for required environment variables
REQUIRED_ENV_VARS=(
    "REACT_APP_FIREBASE_API_KEY"
    "REACT_APP_FIREBASE_AUTH_DOMAIN"
    "REACT_APP_FIREBASE_PROJECT_ID"
)

for var in "${REQUIRED_ENV_VARS[@]}"; do
    if grep -q "$var" .env.production 2>/dev/null || grep -q "$var" .env.local 2>/dev/null; then
        print_success "Environment variable defined: $var"
    else
        print_warning "Environment variable not found: $var"
    fi
done

echo ""
echo "=== Security Rules Check ==="

# Check Firestore rules
if [ -f "premium_rules.rules" ]; then
    print_success "Firestore rules file exists: premium_rules.rules"
else
    print_warning "Firestore rules file not found"
fi

# Check Storage rules
if [ -f "storage.rules" ]; then
    print_success "Storage rules file exists: storage.rules"
else
    print_warning "Storage rules file not found"
fi

echo ""
echo "=== GitHub Actions Check ==="

# Check for GitHub workflows
if [ -d ".github/workflows" ]; then
    print_success ".github/workflows directory exists"
    
    # Check for Firebase deployment workflow
    if ls .github/workflows/firebase*.yml &> /dev/null; then
        print_success "Firebase deployment workflows found:"
        ls .github/workflows/firebase*.yml | while read file; do
            echo "    - $(basename $file)"
        done
    else
        print_warning "No Firebase deployment workflows found"
    fi
else
    print_warning ".github/workflows not found"
fi

echo ""
echo "=================================="
echo "=== Validation Summary ==="
echo "=================================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "Your project is ready for deployment:"
    echo "  $ npm run deploy"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Validation completed with $WARNINGS warning(s)${NC}"
    echo ""
    echo "You can proceed with deployment, but consider addressing the warnings:"
    echo "  $ npm run deploy"
    exit 0
else
    echo -e "${RED}✗ Validation failed with $ERRORS error(s) and $WARNINGS warning(s)${NC}"
    echo ""
    echo "Please fix the errors before deploying."
    exit 1
fi
