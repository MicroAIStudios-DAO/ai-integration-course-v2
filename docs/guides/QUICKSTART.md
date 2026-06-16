# 🚀 Quick Start Guide - AI Integration Course

## One-Command Setup

```bash
./setup.sh
```

That's it! The setup script will:
- ✅ Install Node.js dependencies
- ✅ Create Python virtual environment
- ✅ Install Python dependencies
- ✅ Create `.env` from `.env.example`
- ✅ Build the project to verify everything works

## Manual Setup (If setup.sh fails)

### 1. Install Dependencies

```bash
# Node.js dependencies (ALWAYS run this first)
npm install

# Python virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r python-requirements.txt
deactivate
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your Firebase config
# Get values from: https://console.firebase.google.com/project/ai-integra-course-v2/settings/general
nano .env
```

Required environment variables:
- `REACT_APP_FIREBASE_API_KEY`
- `REACT_APP_FIREBASE_AUTH_DOMAIN`
- `REACT_APP_FIREBASE_PROJECT_ID`
- `REACT_APP_FIREBASE_STORAGE_BUCKET`
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
- `REACT_APP_FIREBASE_APP_ID`
- `REACT_APP_FIREBASE_MEASUREMENT_ID`

### 3. Start Development

```bash
npm start
```

Opens at: http://localhost:3000

## Production Deployment

### Quick Deploy

```bash
npm run deploy
```

This runs:
1. `npm install` - Fresh dependency install
2. `npm run build` - Production build
3. `firebase deploy --only hosting` - Deploy to Firebase

### Deploy Everything (Functions + Hosting)

```bash
firebase deploy
```

### Deploy Functions Only

```bash
npm run deploy:functions
```

## Common Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start development server |
| `npm run build` | Build for production |
| `npm test` | Run tests |
| `npm run deploy` | Deploy to Firebase Hosting |
| `npm run deploy:functions` | Deploy Firebase Functions |
| `npm run preview` | Preview production build locally |
| `./setup.sh` | Run complete setup |

## Python Backend Tools

```bash
# Activate virtual environment
source venv/bin/activate

# Seed lessons to Firestore
python allie/tools/seed_lessons_firestore.py --project ai-integra-course-v2

# Deactivate when done
deactivate
```

## Firebase Setup

### Login to Firebase

```bash
firebase login
```

### Check Current Project

```bash
firebase projects:list
firebase use ai-integra-course-v2
```

### View Deployment

Production: https://ai-integra-course-v2.web.app

## Troubleshooting

### Build Fails

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Port 3000 in Use

```bash
PORT=3001 npm start
```

### Python Dependencies Fail

```bash
pip install --upgrade pip
pip install -r python-requirements.txt
```

### Firebase Login Issues

```bash
firebase login --reauth
```

## Project Structure

```
ai-integration-course/
├── src/                  # React app source
├── public/              # Static assets
├── build/               # Production build (generated)
├── functions/           # Firebase Cloud Functions
├── backend/             # Python Flask backend
├── allie/               # Python tools & FastAPI
├── venv/                # Python venv (generated)
├── .env                 # Environment vars (create from .env.example)
├── setup.sh             # Automated setup script
└── package.json         # Node.js dependencies
```

## Need Help?

- 📖 [Full README](../../README.md)
- ✅ [Production Checklist](../deployment/PRODUCTION_CHECKLIST.md)
- 🚀 [Deployment Guide](../deployment/DEPLOYMENT.md)
- 📋 [Build Guide](../deployment/BUILD_DEPLOYMENT_GUIDE.md)

## Security Notes

- ⚠️ Never commit `.env` files
- ⚠️ Use environment variables for all secrets
- ⚠️ Rotate API keys regularly
- ⚠️ Keep dependencies updated

---

**Made with ❤️ for the AI Integration Course**
