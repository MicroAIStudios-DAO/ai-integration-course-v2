# Production Deployment Checklist

## Pre-Deployment Security & Cleanup

### 1. Remove Sensitive Data

**Check for hardcoded API keys:**
```bash
grep -r "AIzaSy\|sk_live\|sk_test\|sk-proj" --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir=node_modules --exclude-dir=build
```

**Remove mock data:**
- `mockCourseData.ts` (root level) - Not used in production, can be removed
- Verify no mock data fallbacks in production code

**Verify environment variables:**
- All Firebase keys should use `REACT_APP_*` environment variables
- No hardcoded secrets in code
- `.env` file is in `.gitignore`

### 2. Build & Test

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Build
npm run build

# Test build locally
npx serve -s build
```

### 3. Firebase Configuration

**Verify firebase.json:**
```json
{
  "hosting": {
    "public": "build",  // Must be "build" not "public"
    ...
  }
}
```

**Check Firebase project:**
```bash
firebase projects:list
firebase use ai-integra-course-v2
```

### 4. Environment Variables Setup

**For Firebase Hosting:**
Environment variables are baked into the build, so set them before building:
```bash
# .env file (development)
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
REACT_APP_FIREBASE_MEASUREMENT_ID=...
```

**For Firebase Functions:**
```bash
# Set secrets
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set OPENAI_API_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
```

**For Python Tools (Google Cloud Secret Manager):**
```bash
# Create secrets
gcloud secrets create master-password --replication-policy="automatic"
echo "your-master-password" | gcloud secrets versions add master-password --data-file=-
```

### 5. Python Virtual Environment

```bash
# Always create fresh venv for production
python3 -m venv venv
source venv/bin/activate
pip install -r python-requirements.txt
```

### 6. Deployment Commands

**Full deployment:**
```bash
npm install          # Always reinstall dependencies
npm run build        # Build fresh
firebase deploy      # Deploy everything
```

**Hosting only:**
```bash
npm run deploy       # Runs: npm install && npm run build && firebase deploy --only hosting
```

**Functions only:**
```bash
npm run deploy:functions  # Runs: npm install && npm run build && firebase deploy --only functions
```

### 7. Post-Deployment Verification

1. **Visit production site**: https://ai-integra-course-v2.web.app
2. **Test authentication**: Sign up / Sign in
3. **Verify Firebase connection**: Check browser console for errors
4. **Test premium features**: Verify gating works
5. **Check mobile responsiveness**: Test on mobile devices

### 8. Clean Up Duplicate Files (Optional)

These root-level files were duplicates from previous PR branches and have been removed so the codebase uses the `src/` versions exclusively. The one exception is `AnimatedAvatar.tsx`, which now remains as a thin re-export that points to `src/components/layout/AnimatedAvatar.tsx` so older imports continue to function while the shared component lives with the rest of the layout code.

Removed files:
- `AuthContext.tsx` (duplicate of `src/context/AuthContext.tsx`)
- `CourseOverviewPage.tsx` (duplicate of `src/pages/CourseOverviewPage.tsx`)
- `HomePage.tsx` (duplicate of `src/pages/HomePage.tsx`)
- `LandingPage.tsx` (duplicate of `src/pages/NewLandingPage.tsx`)
- `LoginPage.tsx` (duplicate of `src/components/auth/LoginPage.tsx`)
- `SignupPage.tsx` (duplicate of `src/components/auth/SignupPage.tsx`)
- `PersonalizedRecapPage.tsx` (duplicate of `src/pages/PersonalizedRecapPage.tsx`)
- `PrivacyPolicyPage.tsx` (duplicate of `src/pages/PrivacyPolicyPage.tsx`)
- `TermsOfServicePage.tsx` (duplicate of `src/pages/TermsOfServicePage.tsx`)
- `LessonPage.tsx` and `Lessonpage.tsx` (duplicates of `src/pages/LessonPage.tsx`)
- `Layout.tsx` and `HeroCTA.tsx` (duplicates of `src/components/layout/*`)
- `mockCourseData.ts` (outdated mock data)
- `firebaseService.ts`, `index.tsx`, `index.css`, and `index.html` (legacy CRA entry files replaced by the `src/` implementations)

### 9. Security Audit

**Run npm audit:**
```bash
npm audit
npm audit fix  # Fix non-breaking issues
```

**Review dependencies:**
```bash
npm outdated
```

### 10. Monitoring

**After deployment, monitor:**
- Firebase Console > Hosting
- Firebase Console > Functions (if using)
- Browser console for errors
- Firebase Analytics for user behavior

## Common Issues

### Build fails with memory error
```bash
export NODE_OPTIONS="--max-old-space-size=8192"
npm run build
```

### Firebase deploy fails
```bash
# Relogin
firebase login --reauth

# Verify project
firebase use ai-integra-course-v2

# Check firebase.json is valid
cat firebase.json | jq .
```

### Environment variables not working
- Ensure variables start with `REACT_APP_`
- Rebuild after changing .env
- Environment variables are baked into build, not runtime

## Rollback Procedure

If deployment fails:
```bash
# View deployment history
firebase hosting:channel:list

# Rollback to previous version
firebase hosting:clone <source-site-id>:<source-channel-id> <destination-site-id>:live
```
