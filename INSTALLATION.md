# AI Integration Course - Installation & Deployment Guide

This document provides step-by-step instructions for setting up, running, and deploying the AI Integration Course website.

## Local Development Setup

### Prerequisites
- Node.js 20.x (LTS) - see `.nvmrc` file
  - Use nvm for version management: `nvm install 20 && nvm use 20`
- npm 11.x or higher
- Git

### Installation Steps

1. **Extract the project files**
   ```bash
   unzip ai_integration_course_fixed.zip -d ai_integration_course
   cd ai_integration_course
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy the `.env.example` file to `.env`
   - Fill in your Firebase configuration details
   ```bash
   cp .env.example .env
   # Edit .env with your Firebase credentials
   ```

4. **Start the development server**
   ```bash
   npm start
   ```
   The application will be available at http://localhost:3000

## Firebase Setup

1. **Create a Firebase project** at [firebase.google.com](https://firebase.google.com)

2. **Enable Authentication**
   - Go to Authentication > Sign-in method
   - Enable Email/Password authentication

3. **Set up Firestore Database**
   - Create a Firestore database
   - Start in test mode initially

4. **Update Firebase configuration**
   - Get your Firebase config from Project Settings > General > Your apps
   - Update the `.env` file with these values

## Deployment to Firebase Hosting

### Prerequisites
- A Firebase project with Hosting enabled
- Firebase CLI installed locally (`npm install -g firebase-tools`)
- Service account JSON or CI secret configured for non-interactive deploys

### Deployment Steps

1. **Authenticate with Firebase**
   ```bash
   firebase login
   # or use FIREBASE_TOKEN/FIREBASE_SERVICE_ACCOUNT_GOLDENAIGE in CI
   ```

2. **Initialize Firebase project locally (if not already set up)**
   ```bash
   firebase use --add
   # Select the project that hosts ai-integra-course-v2.web.app
   ```

3. **Run the production build**
   ```bash
   npm ci
   npm run build
   ```

4. **Deploy hosting and functions**
   ```bash
   firebase deploy --only hosting,functions
   ```

5. **Configure custom domain (optional)**
   - In the Firebase console navigate to Hosting → Add custom domain
   - Follow the DNS verification instructions and wait for propagation

## Troubleshooting

- **Build Errors**: Run `npm run build` locally to identify issues before deploying
- **Firebase Connection Issues**: Verify your Firebase configuration in the `.env` file
- **Deployment Failures**: Inspect `firebase-debug.log` and Firebase console deployment logs for specific errors

## Maintenance

- **Updates**: Pull latest changes, run `npm install` to update dependencies
- **Environment Variables**: Update both local `.env` and Firebase environment configuration when changing secrets (`firebase functions:config:set` or Remote Config as appropriate)
- **Database Backups**: Regularly export Firestore data for backup

For additional help, refer to:
- [Create React App documentation](https://create-react-app.dev/)
- [Firebase documentation](https://firebase.google.com/docs)
- [Firebase Hosting documentation](https://firebase.google.com/docs/hosting)
