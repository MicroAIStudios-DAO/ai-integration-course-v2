# Getting Started with GCloud Deployment

Welcome! This guide will help you deploy the AI Integration Course to production using Google Cloud (GCloud) optimized deployment.

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Prerequisites

**Google Cloud SDK:**
```bash
# macOS
brew install --cask google-cloud-sdk

# Linux
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Windows
# Download from: https://cloud.google.com/sdk/docs/install
```

**Verify Installation:**
```bash
gcloud --version  # Should show version 540.0.0+
node --version    # Should show v20.x.x
npm --version     # Should show 10.x.x
```

### Step 2: One-Time Setup

Run the automated setup script:

```bash
# Clone the repository (if not already done)
git clone https://github.com/Gnoscenti/ai-integration-course.git
cd ai-integration-course

# Run setup (will authenticate and configure everything)
npm run gcloud:setup
```

**What this does:**
- ✅ Authenticates you with Google Cloud
- ✅ Sets up the `ai-integra-course-v2` project
- ✅ Enables all required APIs (11 total)
- ✅ Creates Firestore database
- ✅ Installs all dependencies
- ✅ Configures Firebase CLI
- ✅ Creates service accounts for CI/CD

⏱️ **Time:** ~5-10 minutes (mostly automated)

### Step 3: Deploy to Production

```bash
# Validate everything is ready
npm run gcloud:validate

# Deploy!
npm run deploy:gcloud
```

⏱️ **Time:** ~3-5 minutes

**Done!** 🎉 Your app is now live at:
- https://ai-integra-course-v2.web.app
- https://aiintegrationcourse.com

---

## 📋 What Happens During Setup?

### Authentication Phase
1. Opens browser for Google Cloud login
2. Authenticates with your Google account
3. Sets up Application Default Credentials

### Configuration Phase
1. Sets GCloud project to `ai-integra-course-v2`
2. Verifies project access
3. Configures default regions:
   - Cloud Functions: `us-central1`
   - Firestore: `nam5` (North America)

### API Enablement Phase
Enables these APIs automatically:
- ☁️ Cloud Functions
- 🔨 Cloud Build
- 🗄️ Cloud Firestore
- 🔥 Firebase Management
- 📦 Cloud Storage
- 🎯 Artifact Registry
- 🏃 Cloud Run
- ⚡ Eventarc
- 🔐 Secret Manager
- ⏰ Cloud Scheduler
- 🌐 Cloud Resource Manager

### Dependency Installation Phase
1. Installs root project dependencies
2. Installs Firebase Functions dependencies
3. Sets up Python environment (if needed)

---

## 🔍 Validation Checklist

Before deploying, the validator checks:

| Check | What It Does |
|-------|-------------|
| ✓ GCloud CLI | Ensures gcloud is installed |
| ✓ Authentication | Verifies you're logged in |
| ✓ Project Access | Confirms access to ai-integra-course-v2 |
| ✓ Node.js Version | Checks Node.js >= 20 |
| ✓ Firebase CLI | Verifies Firebase tools |
| ✓ APIs Enabled | Confirms all APIs are active |
| ✓ Firestore DB | Checks database exists |

---

## 📦 What Gets Deployed?

### Hosting (Static Files)
```
build/
├── index.html
├── static/
│   ├── css/
│   ├── js/
│   └── media/
└── ... (all static assets)
```

**Size:** Typically 2-5 MB  
**CDN:** Global (automatic)  
**Cache:** 1 year for static assets

### Cloud Functions (Backend)
```
functions/lib/
├── index.js (AI Tutor endpoint)
└── ... (other functions)
```

**Runtime:** Node.js 20  
**Region:** us-central1  
**Scaling:** Automatic

### Firestore (Database)
```
Rules: premium_rules.rules
Indexes: firestore.indexes.json
Location: nam5 (North America)
```

---

## 🎯 Deployment Process (8 Steps)

```
1/8 ✓ Prerequisites Check
    → Node.js, GCloud, npm versions

2/8 ✓ GCloud Authentication
    → Active account, project access

3/8 ✓ Enable Required APIs
    → 11 APIs enabled automatically

4/8 ✓ Configure Firebase
    → Region, Firestore setup

5/8 ✓ Build Preparation
    → Clean, install dependencies

6/8 ✓ Production Build
    → React app + Functions

7/8 ✓ Firebase Deployment
    → Hosting + Functions + Rules

8/8 ✓ Post-Deployment Validation
    → Health checks, function list
```

**Total Time:** ~3-5 minutes (after setup)

---

## 🆘 Troubleshooting

### Problem: "gcloud: command not found"

**Solution:**
```bash
# Install Google Cloud SDK
# See: https://cloud.google.com/sdk/docs/install

# After installation, restart terminal
source ~/.bashrc  # or source ~/.zshrc
```

### Problem: "Cannot access project ai-integra-course-v2"

**Solution:**
```bash
# List your accessible projects
gcloud projects list

# Make sure you're using the right account
gcloud auth list

# Re-authenticate if needed
gcloud auth login
```

### Problem: "API not enabled"

**Solution:**
```bash
# The setup script should enable all APIs
# But you can enable them manually:
npm run gcloud:setup

# Or enable specific API:
gcloud services enable cloudfunctions.googleapis.com
```

### Problem: "Build failed"

**Solution:**
```bash
# Clean everything and rebuild
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build:production
```

### Problem: "Deployment timed out"

**Solution:**
```bash
# Try deploying components separately
npm run deploy:hosting    # Deploy hosting first
npm run deploy:functions  # Then deploy functions
```

---

## 🔄 Making Updates

After initial deployment, updates are simple:

```bash
# 1. Make your code changes
# 2. Test locally
npm start

# 3. Deploy
npm run deploy:gcloud
```

**Pro Tip:** Use GitHub Actions for automatic deployment on push to main:
- Just push to main branch
- GitHub Actions will deploy automatically
- No manual deployment needed!

---

## 📊 Monitoring Your Deployment

### Firebase Console
```
https://console.firebase.google.com/project/ai-integra-course-v2
```
View:
- Hosting metrics
- Function invocations
- Database operations
- User analytics

### GCP Console
```
https://console.cloud.google.com/home/dashboard?project=ai-integra-course-v2
```
View:
- Cloud Functions logs
- Billing
- API usage
- Resource quotas

### Check Logs
```bash
# Function logs
gcloud functions logs read --limit=50

# Or with Firebase CLI
firebase functions:log
```

---

## 🎓 Next Steps

Now that you're deployed:

1. **Test Your Site**
   - Visit https://ai-integra-course-v2.web.app
   - Test all features
   - Check browser console for errors

2. **Set Up Monitoring**
   - Enable Firebase Analytics
   - Set up error alerts
   - Monitor performance

3. **Configure Custom Domain**
   - Add your domain in Firebase Console
   - Update DNS records
   - Enable SSL (automatic)

4. **Set Up CI/CD**
   - Already configured in `.github/workflows/`
   - Add GitHub secret: `FIREBASE_SERVICE_ACCOUNT_AI-INTEGRA-COURSE-V2`
   - Push to main = auto-deploy!

---

## 📚 Additional Resources

- **Full Guide:** [GCLOUD_DEPLOYMENT.md](./GCLOUD_DEPLOYMENT.md)
- **Quick Reference:** [GCLOUD_QUICKSTART.md](./GCLOUD_QUICKSTART.md)
- **Checklist:** [GCLOUD_DEPLOYMENT_CHECKLIST.md](./GCLOUD_DEPLOYMENT_CHECKLIST.md)
- **Architecture:** [GCLOUD_ARCHITECTURE.md](./GCLOUD_ARCHITECTURE.md)

## 💬 Getting Help

1. **Validation First:** `npm run gcloud:validate`
2. **Check Logs:** `gcloud functions logs read`
3. **Review Docs:** See files listed above
4. **GitHub Issues:** [Report a problem](https://github.com/Gnoscenti/ai-integration-course/issues)

---

## ✅ Success Checklist

After your first deployment:

- [ ] Site loads at https://ai-integra-course-v2.web.app
- [ ] Can sign up/login
- [ ] Can view courses
- [ ] AI Tutor responds
- [ ] No console errors
- [ ] Firebase Console shows data
- [ ] Functions are listed in GCP Console

**All checked?** 🎉 **You're live!**

---

**Happy Deploying! 🚀**

*This guide is designed to get you from zero to production in under 15 minutes.*
