# Quick Deployment Guide

**Status**: ✅ Ready for Production  
**Last Updated**: October 14, 2025

## TL;DR - Deploy Now

```bash
# Option 1: Push to main (automatic via GitHub Actions)
git push origin main

# Option 2: Manual deploy
npm run deploy

# Option 3: Complete deployment script
./repo_finish.sh
```

## Before First Deployment

### 1. Add GitHub Secret (One-time)

Go to: https://github.com/Gnoscenti/ai-integration-course/settings/secrets/actions

Add: `FIREBASE_SERVICE_ACCOUNT_GOLDENAIGE`

Get value from: Firebase Console → Project Settings → Service Accounts → Generate new private key

### 2. Set Firebase Secrets (One-time)

```bash
firebase functions:secrets:set OPENAI_API_KEY --project ai-integra-course-v2
```

### 3. Deploy Security Rules (One-time)

```bash
firebase deploy --only firestore:rules --project ai-integra-course-v2
```

## Verification

```bash
# Run automated checks
./verify-deployment.sh
```

## Post-Deployment Check

Visit: https://ai-integra-course-v2.web.app

Test:
- [ ] Sign up / Sign in works
- [ ] Free lessons load
- [ ] Premium lessons show "Premium" badge
- [ ] AI Tutor responds to questions

## Need Help?

- **Full Guide**: [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)
- **Checklist**: [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md)
- **Status**: [DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md)

## Rollback

```bash
# Via Firebase Console
# Hosting → Release history → Previous version → Rollback
```

---

**Project**: AI Integration Course  
**Firebase Project**: ai-integra-course-v2  
**Production URL**: https://ai-integra-course-v2.web.app
