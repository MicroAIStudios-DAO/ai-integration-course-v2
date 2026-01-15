# GCloud Deployment Quick Reference

## Quick Start

### First Time Setup
```bash
# 1. Authenticate and setup
npm run gcloud:setup

# 2. Validate configuration
npm run gcloud:validate

# 3. Deploy
npm run deploy:gcloud
```

## Common Commands

### Deployment
```bash
npm run deploy:gcloud        # Full GCloud-optimized deployment
npm run deploy               # Standard Firebase deployment
npm run deploy:hosting       # Deploy hosting only
npm run deploy:functions     # Deploy functions only
```

### Validation & Setup
```bash
npm run gcloud:setup         # Initial GCloud setup (one-time)
npm run gcloud:validate      # Validate configuration
```

### Development
```bash
npm start                    # Start dev server
npm run build:production     # Production build
npm run clean                # Clean build artifacts
npm test                     # Run tests
```

## GCloud CLI Commands

### Authentication
```bash
gcloud auth login                              # Login to GCloud
gcloud auth application-default login          # Setup ADC
gcloud auth list                               # List accounts
```

### Project Management
```bash
gcloud config set project ai-integra-course-v2           # Set project
gcloud config get-value project                # Check current project
gcloud projects describe ai-integra-course-v2            # Project details
```

### API Management
```bash
gcloud services list --enabled                 # List enabled APIs
gcloud services enable <api-name>              # Enable API
```

### Cloud Functions
```bash
gcloud functions list                          # List all functions
gcloud functions logs read --limit=50          # View logs
gcloud functions describe <function-name>      # Function details
```

### Firestore
```bash
gcloud firestore databases list                # List databases
gcloud firestore databases describe "(default)" # Database details
```

## Firebase CLI Commands

### Deployment
```bash
firebase deploy --project ai-integra-course-v2           # Full deploy
firebase deploy --only hosting                 # Hosting only
firebase deploy --only functions               # Functions only
firebase hosting:rollback                      # Rollback hosting
```

### Project Management
```bash
firebase use ai-integra-course-v2                        # Set project
firebase projects:list                         # List projects
firebase open                                  # Open console
```

### Logs & Monitoring
```bash
firebase functions:log                         # View function logs
firebase hosting:channel:list                  # List hosting channels
```

## Environment Variables

### Required for Development
```bash
REACT_APP_FIREBASE_API_KEY=<your-api-key>
REACT_APP_FIREBASE_AUTH_DOMAIN=ai-integra-course-v2.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=ai-integra-course-v2
OPENAI_API_KEY=<your-openai-key>
```

### Required for Production
Create `.env.production` with production values.

## Troubleshooting

### Authentication Issues
```bash
# Clear and re-authenticate
gcloud auth revoke
gcloud auth login
gcloud auth application-default login
```

### Build Issues
```bash
# Clean rebuild
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build:production
```

### Deployment Failures
```bash
# Check logs
gcloud functions logs read --limit=100
firebase functions:log

# Try deploying components separately
npm run deploy:hosting
npm run deploy:functions
```

### API Not Enabled
```bash
# Enable all required APIs
gcloud services enable \
  cloudfunctions.googleapis.com \
  cloudbuild.googleapis.com \
  firestore.googleapis.com \
  firebase.googleapis.com
```

## Useful URLs

- **Firebase Console**: https://console.firebase.google.com/project/ai-integra-course-v2
- **GCP Console**: https://console.cloud.google.com/home/dashboard?project=ai-integra-course-v2
- **Production Site**: https://ai-integra-course-v2.web.app
- **Custom Domain**: https://aiintegrationcourse.com
- **Cloud Functions**: https://console.cloud.google.com/functions/list?project=ai-integra-course-v2
- **Firestore**: https://console.firebase.google.com/project/ai-integra-course-v2/firestore
- **Storage**: https://console.cloud.google.com/storage/browser?project=ai-integra-course-v2

## Script Locations

- `scripts/gcloud-setup.sh` - Initial setup
- `scripts/gcloud-validate.sh` - Validation
- `scripts/gcloud-deploy.sh` - Full deployment
- `scripts/deploy-production.sh` - Standard deployment

## Documentation

- Full Guide: [GCLOUD_DEPLOYMENT.md](./GCLOUD_DEPLOYMENT.md)
- README: [README.md](./README.md)
- Build Guide: [BUILD_DEPLOYMENT_GUIDE.md](./BUILD_DEPLOYMENT_GUIDE.md)

## Support

1. Run validation: `npm run gcloud:validate`
2. Check logs: `gcloud functions logs read`
3. Review docs: See GCLOUD_DEPLOYMENT.md
4. GitHub Issues: https://github.com/Gnoscenti/ai-integration-course/issues

---

**Project**: AI Integration Course  
**Repository**: https://github.com/Gnoscenti/ai-integration-course
