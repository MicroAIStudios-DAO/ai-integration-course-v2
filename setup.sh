#!/usr/bin/env bash
# Complete setup script for AI Integration Course
# This script sets up Node.js dependencies, Python virtual environment, and Firebase configuration

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Get repository root
REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_ROOT"

log_info "Setting up AI Integration Course..."

# 1. Check Node.js version
log_info "Checking Node.js version..."
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed. Please install Node.js 20.x"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    log_warning "Node.js version should be 20.x or higher. Current: $(node -v)"
    log_warning "Consider using nvm to install Node.js 20.x: nvm install 20 && nvm use 20"
fi

# 2. Install Node.js dependencies (ALWAYS run npm install)
log_info "Installing Node.js dependencies..."
npm install
log_success "Node.js dependencies installed"

# 3. Setup Python virtual environment
log_info "Setting up Python virtual environment..."
if [ ! -d "venv" ]; then
    if command -v python3 &> /dev/null; then
        python3 -m venv venv
        log_success "Python virtual environment created"
    else
        log_warning "Python3 not found. Skipping Python setup."
        log_warning "Install Python 3.8+ if you need backend tools"
    fi
else
    log_info "Python virtual environment already exists"
fi

# 4. Install Python dependencies if venv exists
if [ -d "venv" ]; then
    log_info "Installing Python dependencies..."
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r python-requirements.txt
    deactivate
    log_success "Python dependencies installed"
fi

# 5. Check Firebase CLI
log_info "Checking Firebase CLI..."
if ! command -v firebase &> /dev/null; then
    log_warning "Firebase CLI not found globally. Using local installation from node_modules"
    log_info "To install globally: npm install -g firebase-tools"
fi

# 6. Check environment variables
log_info "Checking environment configuration..."
if [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
    log_warning "No .env or .env.local file found"
    if [ -f ".env.example" ]; then
        log_info "Creating .env from .env.example..."
        cp .env.example .env
        log_warning "Please edit .env file with your Firebase configuration"
    fi
fi

# 7. Build the project to verify setup
log_info "Building project to verify setup..."
npm run build
log_success "Build successful!"

# Summary
echo ""
log_success "=== Setup Complete ==="
echo ""
log_info "Next steps:"
echo "  1. Configure environment variables in .env file"
echo "  2. Login to Firebase: firebase login"
echo "  3. For Python tools: source venv/bin/activate"
echo "  4. Start development server: npm start"
echo "  5. Deploy to Firebase: npm run deploy"
echo ""
