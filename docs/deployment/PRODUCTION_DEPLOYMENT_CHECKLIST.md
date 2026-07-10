# Production Deployment Checklist

## Pre-Deployment Checklist

### ✅ Repository Setup
- [ ] Branch compared against `main` (`git fetch origin main && git diff --stat origin/main`)
- [x] All dependencies installed (`npm run install:all`)
- [x] Production build working (`npm run build:production`)
- [x] Functions build working (`cd functions && npm run build`)
- [x] Python environment configured (`npm run setup:python`)
- [x] Environment variables configured
- [x] Firebase configuration optimized
- [x] Deployment scripts created and tested

### ✅ Configuration Files
- [x] `package.json` - Updated with production scripts
- [x] `firebase.json` - Optimized for production deployment
- [x] `functions/package.json` - Node.js 20, correct dependencies
- [x] `.env.example` - Template for environment variables
- [x] `.gitignore` - Excludes sensitive files and build artifacts

### ✅ Scripts Ready
- [x] `scripts/setup-environment.sh` - Automated environment setup
- [x] `scripts/deploy-production.sh` - Full production deployment
- [x] All scripts executable (`chmod +x`)

### ✅ Build System
- [x] Consistent `npm install` usage throughout
- [x] Python virtual environment setup
- [x] Production optimizations enabled
- [x] Asset caching configured
- [x] Clean build process (`npm run clean`)

## Deployment Requirements

### Required Accounts & Access
- [ ] Firebase project access (ai-integra-course-v2)
- [ ] Google Cloud Platform access
- [ ] OpenAI API account and key
- [ ] Stripe account and keys
- [ ] Domain configuration (if using custom domain)

### Required Environment Variables
```bash
# Firebase
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=ai-integra-course-v2.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=ai-integra-course-v2
REACT_APP_FIREBASE_STORAGE_BUCKET=ai-integra-course-v2.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=

# OpenAI
OPENAI_API_KEY=

# Stripe
REACT_APP_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

### Firebase Services
- [ ] Authentication enabled
- [ ] Firestore database configured
- [ ] Cloud Functions enabled
- [ ] Hosting enabled
- [ ] Storage enabled (if needed)
- [ ] Security rules deployed

## Deployment Commands

### Quick Deployment
```bash
./scripts/deploy-production.sh
```

### Manual Deployment
```bash
# 1. Clean and install
npm run clean
npm run install:all

# 2. Set up Python environment
npm run setup:python

# 3. Build for production
npm run build:production

# 4. Deploy to Firebase
firebase deploy --project ai-integra-course-v2
```

### Selective Deployment
```bash
# Deploy only hosting
npm run deploy:hosting

# Deploy only functions
npm run deploy:functions

# Full production deployment
npm run deploy:prod
```

## Post-Deployment Verification

### ✅ Frontend Checks
- [ ] Website loads at https://ai-integra-course-v2.web.app
- [ ] All pages render correctly
- [ ] Authentication flow works
- [ ] Responsive design working
- [ ] No console errors

### ✅ Backend Checks
- [ ] Firebase Functions deployed successfully
- [ ] API endpoints responding
- [ ] Authentication working
- [ ] Database connections working
- [ ] Error handling functioning

### ✅ Integration Checks
- [ ] OpenAI API integration working
- [ ] Stripe payment flow working (if implemented)
- [ ] Course content loading
- [ ] User registration/login working
- [ ] Premium features accessible

### ✅ gcloud Verification
- [ ] Hosting release confirmed (`gcloud firebase hosting:releases list --project ai-integra-course-v2 --site ai-integra-course-v2 --limit=1`)
- [ ] Functions present in target region (`gcloud functions list --project ai-integra-course-v2 --regions us-central1`)

## Monitoring & Maintenance

### Firebase Console Monitoring
- Function execution logs
- Database usage metrics
- Authentication metrics
- Error reporting

### Performance Monitoring
- Website loading times
- Function execution times
- Database query performance
- Error rates

## Rollback Plan

If deployment fails or issues arise:

1. **Revert to previous version**:
   ```bash
   firebase hosting:clone SOURCE_SITE_ID:SOURCE_VERSION_ID TARGET_SITE_ID
   ```

2. **Check logs for errors**:
   ```bash
   firebase functions:log
   ```

3. **Redeploy specific components**:
   ```bash
   # Redeploy only functions
   firebase deploy --only functions
   
   # Redeploy only hosting
   firebase deploy --only hosting
   ```

## Support Resources

- Firebase Console: https://console.firebase.google.com/project/ai-integra-course-v2
- Google Cloud Console: https://console.cloud.google.com/
- Repository: https://github.com/Gnoscenti/ai-integration-course
- Documentation: See README.md

---

**Status**: ✅ Ready for Production Deployment

The AI Integration Course platform is now fully configured and ready for production deployment to Firebase.