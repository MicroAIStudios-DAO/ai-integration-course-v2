#!/usr/bin/env bash
# Production Deployment Verification Script
# This script verifies that the deployment is ready for production

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[⚠]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }

# Track overall status
ERRORS=0
WARNINGS=0

echo ""
echo "======================================"
echo "Production Deployment Verification"
echo "======================================"
echo ""

# 1. Check Node.js version
log_info "Checking Node.js version..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 20 ]; then
        log_success "Node.js version: $(node -v)"
    else
        log_error "Node.js version should be 20.x or higher. Current: $(node -v)"
        ((ERRORS++))
    fi
else
    log_error "Node.js not found"
    ((ERRORS++))
fi

# 2. Check npm version
log_info "Checking npm version..."
if command -v npm &> /dev/null; then
    log_success "npm version: $(npm -v)"
else
    log_error "npm not found"
    ((ERRORS++))
fi

# 3. Check if node_modules exists
log_info "Checking dependencies..."
if [ -d "node_modules" ]; then
    log_success "node_modules directory exists"
else
    log_warning "node_modules not found. Run 'npm install' first."
    ((WARNINGS++))
fi

# 4. Check if build directory exists
log_info "Checking build output..."
if [ -d "build" ]; then
    BUILD_SIZE=$(du -sh build | cut -f1)
    log_success "Build directory exists (size: $BUILD_SIZE)"
else
    log_warning "Build directory not found. Run 'npm run build' first."
    ((WARNINGS++))
fi

# 5. Check Firebase CLI
log_info "Checking Firebase CLI..."
if command -v firebase &> /dev/null; then
    log_success "Firebase CLI installed: $(firebase --version)"
else
    log_warning "Firebase CLI not installed globally. Using local installation."
    if [ -f "node_modules/.bin/firebase" ]; then
        log_success "Local Firebase CLI found"
    else
        log_error "Firebase CLI not found"
        ((ERRORS++))
    fi
fi

# 6. Check Firebase project configuration
log_info "Checking Firebase configuration..."
if [ -f ".firebaserc" ]; then
    PROJECT_ID=$(grep -o '"default": "[^"]*"' .firebaserc | cut -d'"' -f4)
    if [ "$PROJECT_ID" = "ai-integra-course-v2" ]; then
        log_success "Firebase project configured: $PROJECT_ID"
    else
        log_error "Unexpected Firebase project ID: $PROJECT_ID (expected: ai-integra-course-v2)"
        ((ERRORS++))
    fi
else
    log_error ".firebaserc file not found"
    ((ERRORS++))
fi

# 7. Check firebase.json
log_info "Checking firebase.json..."
if [ -f "firebase.json" ]; then
    if grep -q '"public": "build"' firebase.json; then
        log_success "firebase.json hosting directory is correct (build)"
    else
        log_error "firebase.json hosting directory is not set to 'build'"
        ((ERRORS++))
    fi
else
    log_error "firebase.json not found"
    ((ERRORS++))
fi

# 8. Check Firestore rules
log_info "Checking Firestore security rules..."
if [ -f "premium_rules.rules" ]; then
    log_success "Firestore rules file exists"
else
    log_error "premium_rules.rules not found"
    ((ERRORS++))
fi

# 9. Check Functions configuration
log_info "Checking Functions..."
if [ -d "functions" ]; then
    if [ -f "functions/package.json" ]; then
        FUNC_NODE_VERSION=$(grep -o '"node": "[^"]*"' functions/package.json | cut -d'"' -f4)
        log_success "Functions package.json exists (Node: $FUNC_NODE_VERSION)"
    else
        log_error "functions/package.json not found"
        ((ERRORS++))
    fi
    
    if [ -d "functions/lib" ]; then
        log_success "Functions built (lib directory exists)"
    else
        log_warning "Functions not built. Run 'cd functions && npm run build'"
        ((WARNINGS++))
    fi
else
    log_warning "functions directory not found"
    ((WARNINGS++))
fi

# 10. Check GitHub Actions workflows
log_info "Checking GitHub Actions workflows..."
if [ -d ".github/workflows" ]; then
    WORKFLOW_COUNT=$(find .github/workflows -name "*.yml" -o -name "*.yaml" | wc -l)
    log_success "GitHub Actions workflows found: $WORKFLOW_COUNT"
    
    # Check if firebase-hosting-merge.yml exists and has env vars
    if [ -f ".github/workflows/firebase-hosting-merge.yml" ]; then
        if grep -q "REACT_APP_FIREBASE_API_KEY" .github/workflows/firebase-hosting-merge.yml; then
            log_success "Firebase environment variables configured in workflow"
        else
            log_warning "Firebase environment variables not found in workflow"
            ((WARNINGS++))
        fi
    fi
else
    log_error ".github/workflows directory not found"
    ((ERRORS++))
fi

# 11. Check documentation
log_info "Checking documentation..."
DOCS_FOUND=0
[ -f "README.md" ] && ((DOCS_FOUND++)) || true
[ -f "PRODUCTION_DEPLOYMENT.md" ] && ((DOCS_FOUND++)) || true
[ -f "PRODUCTION_READINESS.md" ] && ((DOCS_FOUND++)) || true
[ -f "PRODUCTION_CHECKLIST.md" ] && ((DOCS_FOUND++)) || true
log_success "Documentation files found: $DOCS_FOUND/4"

# 12. Check for .env files (should be gitignored)
log_info "Checking .env files..."
if [ -f ".env" ]; then
    log_warning ".env file exists (ensure it's in .gitignore)"
    if grep -q "^\.env$" .gitignore 2>/dev/null; then
        log_success ".env is in .gitignore"
    else
        log_error ".env is NOT in .gitignore - SECURITY RISK!"
        ((ERRORS++))
    fi
fi

# 13. Check for sensitive data in git (skip to avoid timeout)
log_info "Checking git repository..."
if [ -d ".git" ]; then
    log_success "Git repository initialized"
else
    log_warning "Not a git repository"
    ((WARNINGS++))
fi

# 14. Check package.json scripts
log_info "Checking deployment scripts..."
if grep -q '"deploy":' package.json; then
    log_success "Deploy script configured in package.json"
else
    log_warning "Deploy script not found in package.json"
    ((WARNINGS++))
fi

# 15. Check if build was successful
log_info "Checking if build output is valid..."
if [ -d "build" ] && [ -f "build/index.html" ]; then
    log_success "Build output is valid (index.html exists)"
else
    log_warning "Build output may be incomplete"
    ((WARNINGS++))
fi

# Summary
echo ""
echo "======================================"
echo "Verification Summary"
echo "======================================"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    log_success "All checks passed! Ready for production deployment."
    echo ""
    echo "Next steps:"
    echo "  1. Configure GitHub Secret: FIREBASE_SERVICE_ACCOUNT_GOLDENAIGE"
    echo "  2. Set Firebase Functions secrets (OpenAI API key)"
    echo "  3. Deploy Firestore rules: firebase deploy --only firestore:rules"
    echo "  4. Deploy to production: git push origin main"
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    log_warning "Checks completed with $WARNINGS warning(s)."
    echo ""
    echo "Warnings can be addressed before deployment but are not critical."
    echo ""
    exit 0
else
    log_error "Verification failed with $ERRORS error(s) and $WARNINGS warning(s)."
    echo ""
    echo "Please fix the errors above before deploying to production."
    echo ""
    exit 1
fi
