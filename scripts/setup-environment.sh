#!/bin/bash

# Environment Setup Script for AI Integration Course
# This script sets up the development and production environment

set -e

echo "🔧 Setting up AI Integration Course Environment"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 20 or higher."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    print_error "Node.js version 20 or higher is required. Current: $(node --version)"
    exit 1
fi
print_success "Node.js version check passed: $(node --version)"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.9 or higher."
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
print_success "Python version: $(python3 --version)"

# Install global tools
print_status "Installing global tools..."

# Install Firebase CLI if not present
if ! command -v firebase &> /dev/null; then
    print_status "Installing Firebase CLI..."
    npm install -g firebase-tools
    print_success "Firebase CLI installed"
else
    print_success "Firebase CLI already available"
fi

# Install or update npm to latest version
print_status "Updating npm to latest version..."
npm install -g npm@latest

# Create .env.example if it doesn't exist
if [ ! -f ".env.example" ]; then
    print_status "Creating .env.example template..."
    cat > .env.example << EOF
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Stripe Configuration
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./path-to-service-account.json
EOF
    print_success "Created .env.example template"
fi

# Create Python virtual environment
if [ ! -d "venv" ]; then
    print_status "Creating Python virtual environment..."
    python3 -m venv venv
    print_success "Python virtual environment created"
fi

# Activate virtual environment and install Python dependencies
if [ -f "python-requirements.txt" ]; then
    print_status "Installing Python dependencies..."
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r python-requirements.txt
    deactivate
    print_success "Python dependencies installed"
fi

# Install Node.js dependencies
print_status "Installing Node.js dependencies..."
npm install

# Install Functions dependencies
if [ -d "functions" ]; then
    print_status "Installing Firebase Functions dependencies..."
    cd functions
    npm install
    cd ..
    print_success "Functions dependencies installed"
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p build
mkdir -p logs
mkdir -p tmp

print_success "🎉 Environment setup completed successfully!"
print_status "Next steps:"
echo "1. Copy .env.example to .env.local and configure your environment variables"
echo "2. Run 'firebase login' to authenticate with Firebase"
echo "3. Run 'npm start' to start the development server"
echo "4. Run 'npm run deploy:prod' for production deployment"