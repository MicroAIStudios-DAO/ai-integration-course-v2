# GCloud Deployment Checklist

Use this checklist to ensure successful deployment to production.

## Pre-Deployment Checklist

### ✅ Environment Setup

- [ ] Google Cloud SDK installed (`gcloud --version`)
- [ ] Node.js 20+ installed (`node --version`)
- [ ] npm 10+ installed (`npm --version`)
- [ ] Firebase CLI available (`firebase --version`)
- [ ] Git repository is up to date

### ✅ Authentication & Access

- [ ] Authenticated with GCloud (`gcloud auth login`)
- [ ] Application Default Credentials configured (`gcloud auth application-default login`)
- [ ] Project access verified (`gcloud projects describe ai-integra-course-v2`)
- [ ] Firebase authenticated (`firebase login`)
- [ ] Firebase project set (`firebase use ai-integra-course-v2`)

### ✅ Configuration Validation

- [ ] Run `npm run gcloud:validate` - all checks pass
- [ ] Environment variables configured (.env.production)
- [ ] Firebase configuration verified (firebase.json)
- [ ] All required APIs enabled

Required APIs:
- [ ] Cloud Functions API (cloudfunctions.googleapis.com)
- [ ] Cloud Build API (cloudbuild.googleapis.com)
- [ ] Cloud Firestore API (firestore.googleapis.com)
- [ ] Firebase Management API (firebase.googleapis.com)
- [ ] Cloud Resource Manager API (cloudresourcemanager.googleapis.com)
- [ ] Cloud Storage API (storage-api.googleapis.com)
- [ ] Artifact Registry API (artifactregistry.googleapis.com)
- [ ] Cloud Run API (run.googleapis.com)
- [ ] Eventarc API (eventarc.googleapis.com)

### ✅ Code Quality

- [ ] All tests passing (`npm test`)
- [ ] No linting errors
- [ ] Code committed to version control
- [ ] Working branch is up to date with main
- [ ] No uncommitted changes

### ✅ Build Verification

- [ ] Clean build successful (`npm run build:production`)
- [ ] Build directory contains files
- [ ] Functions build successful (`cd functions && npm run build`)
- [ ] No build warnings or errors

## Deployment Process

### Step 1: Initial Setup (First Time Only)

```bash
# Run the setup script
npm run gcloud:setup
```

Expected outcomes:
- [x] GCloud authentication complete
- [x] Project configured
- [x] All APIs enabled
- [x] Firestore database created
- [x] Dependencies installed
- [x] Service account created (for CI/CD)

### Step 2: Validation

```bash
# Validate configuration
npm run gcloud:validate
```

Expected outcomes:
- [x] All prerequisite checks pass
- [x] Authentication verified
- [x] Project access confirmed
- [x] APIs enabled
- [x] Firestore database exists

### Step 3: Deployment

```bash
# Deploy to production
npm run deploy:gcloud
```

Monitor the 8-step process:
1. [ ] Prerequisites check passed
2. [ ] GCloud setup verified
3. [ ] Required APIs enabled
4. [ ] Firebase configured
5. [ ] Build preparation complete
6. [ ] Production build successful
7. [ ] Firebase deployment complete
8. [ ] Post-deployment validation passed

## Post-Deployment Checklist

### ✅ Deployment Verification

- [ ] Hosting is live (https://ai-integra-course-v2.web.app returns 200)
- [ ] Custom domain works (https://aiintegrationcourse.com)
- [ ] No console errors in browser
- [ ] All pages load correctly
- [ ] Static assets (images, CSS, JS) load properly

### ✅ Functional Testing

- [ ] User authentication works
  - [ ] Sign up
  - [ ] Login
  - [ ] Logout
  - [ ] Password reset

- [ ] Course content loads
  - [ ] Course list displays
  - [ ] Individual lessons open
  - [ ] Video playback works
  - [ ] Markdown renders correctly

- [ ] AI Tutor functionality
  - [ ] Chat interface loads
  - [ ] Messages send successfully
  - [ ] AI responses received
  - [ ] Premium access control works

- [ ] Navigation
  - [ ] All routes work
  - [ ] Back button functions
  - [ ] Direct URL access works

### ✅ Backend Verification

- [ ] Cloud Functions deployed
  ```bash
  gcloud functions list --project=ai-integra-course-v2
  ```

- [ ] Functions are responding
  - [ ] Check function logs
  - [ ] Test API endpoints
  - [ ] Verify CORS configuration

- [ ] Firestore operations work
  - [ ] Data reads correctly
  - [ ] Data writes successfully
  - [ ] Security rules enforced

- [ ] Firebase Storage accessible
  - [ ] Files upload
  - [ ] Files download
  - [ ] Storage rules enforced

### ✅ Performance & Monitoring

- [ ] Check Firebase Console
  - [ ] Hosting metrics
  - [ ] Function invocations
  - [ ] Firestore operations
  - [ ] Error rates

- [ ] Review GCP Console
  - [ ] Cloud Functions logs
  - [ ] Billing status
  - [ ] Resource quotas
  - [ ] API usage

- [ ] Performance metrics
  - [ ] Page load time < 3 seconds
  - [ ] Time to interactive < 5 seconds
  - [ ] No JavaScript errors
  - [ ] All images optimized

### ✅ Security

- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] API keys not exposed in client code
- [ ] Firebase security rules deployed
- [ ] Environment variables secured

## Rollback Plan

If issues are discovered:

### Quick Rollback

```bash
# Rollback Firebase Hosting
firebase hosting:rollback --project=ai-integra-course-v2

# Or rollback to specific version
firebase hosting:versions:list --project=ai-integra-course-v2
firebase hosting:rollback <version-id> --project=ai-integra-course-v2
```

### Full Rollback

1. [ ] Identify last working commit
2. [ ] Checkout that commit
3. [ ] Deploy that version
4. [ ] Verify rollback successful

```bash
git checkout <last-working-commit>
npm run deploy:gcloud
```

## Monitoring Schedule

### First Hour After Deployment
- [ ] Check every 15 minutes
- [ ] Monitor error rates
- [ ] Watch function logs
- [ ] Review user feedback

### First Day
- [ ] Check every hour
- [ ] Monitor performance metrics
- [ ] Review analytics
- [ ] Check error reports

### First Week
- [ ] Daily checks
- [ ] Review weekly metrics
- [ ] Monitor costs
- [ ] Gather user feedback

## Troubleshooting Resources

If deployment fails:

1. **Check Logs**
   ```bash
   # Function logs
   gcloud functions logs read --project=ai-integra-course-v2 --limit=100
   
   # Firebase logs
   firebase functions:log --project=ai-integra-course-v2
   ```

2. **Validate Configuration**
   ```bash
   npm run gcloud:validate
   ```

3. **Review Documentation**
   - [GCLOUD_DEPLOYMENT.md](./GCLOUD_DEPLOYMENT.md) - Full deployment guide
   - [GCLOUD_QUICKSTART.md](./GCLOUD_QUICKSTART.md) - Quick reference
   - [README.md](./README.md) - Project documentation

4. **Common Issues**
   - Authentication: Run `gcloud auth login`
   - Build failures: Run `npm run clean && npm install`
   - API errors: Check if APIs are enabled
   - Permission errors: Verify IAM roles

## Success Criteria

Deployment is successful when:

- [x] All deployment steps complete without errors
- [x] Website is accessible at both URLs
- [x] All functional tests pass
- [x] No critical errors in logs
- [x] Performance metrics are acceptable
- [x] User authentication works
- [x] AI Tutor is functional
- [x] All course content loads

## Sign-Off

**Deployed By:** _________________  
**Date:** _________________  
**Commit SHA:** _________________  
**Deployment Time:** _________________  
**All Checks Passed:** [ ] Yes [ ] No  
**Issues Noted:** _________________

---

**Project:** AI Integration Course  
**Repository:** https://github.com/Gnoscenti/ai-integration-course  
**Production URL:** https://ai-integra-course-v2.web.app  
**Custom Domain:** https://aiintegrationcourse.com
