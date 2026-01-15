# GCloud Deployment Architecture

## Deployment Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     DEPLOYMENT TRIGGER                              │
├─────────────────────────────────────────────────────────────────────┤
│  Manual: npm run deploy:gcloud                                      │
│  Automated: GitHub Actions on push to main                          │
│  Manual: ./scripts/gcloud-deploy.sh                                 │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  STEP 1: Prerequisites Check                        │
├─────────────────────────────────────────────────────────────────────┤
│  ✓ Node.js >= 20                                                    │
│  ✓ Google Cloud SDK installed                                       │
│  ✓ npm >= 10                                                         │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│              STEP 2: GCloud Authentication & Setup                  │
├─────────────────────────────────────────────────────────────────────┤
│  ✓ Verify active GCloud account                                     │
│  ✓ Set project to ai-integra-course-v2                                        │
│  ✓ Verify project access (project number)                          │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│               STEP 3: Enable Required GCP APIs                      │
├─────────────────────────────────────────────────────────────────────┤
│  ✓ cloudfunctions.googleapis.com      (Cloud Functions)            │
│  ✓ cloudbuild.googleapis.com          (Cloud Build)                │
│  ✓ firestore.googleapis.com           (Firestore)                  │
│  ✓ firebase.googleapis.com            (Firebase Management)        │
│  ✓ cloudresourcemanager.googleapis.com (Resource Manager)          │
│  ✓ storage-api.googleapis.com         (Cloud Storage)              │
│  ✓ artifactregistry.googleapis.com    (Artifact Registry)          │
│  ✓ run.googleapis.com                 (Cloud Run)                  │
│  ✓ eventarc.googleapis.com            (Eventarc)                   │
│  ✓ secretmanager.googleapis.com       (Secret Manager)             │
│  ✓ cloudscheduler.googleapis.com      (Cloud Scheduler)            │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│             STEP 4: Configure Firebase Settings                     │
├─────────────────────────────────────────────────────────────────────┤
│  ✓ Set default region: us-central1                                  │
│  ✓ Verify/Create Firestore database (nam5 location)                │
│  ✓ Configure Cloud Functions region                                 │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                STEP 5: Build Preparation                            │
├─────────────────────────────────────────────────────────────────────┤
│  ✓ Clean previous builds (build/, .cache/)                          │
│  ✓ Install root dependencies (npm install)                          │
│  ✓ Install functions dependencies (cd functions && npm install)    │
│  ✓ Setup Python environment (if python-requirements.txt exists)    │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  STEP 6: Production Build                           │
├─────────────────────────────────────────────────────────────────────┤
│  ✓ Build React app (npm run build:production)                       │
│  ✓ Verify build directory exists and has content                   │
│  ✓ Build Firebase Functions (cd functions && npm run build)        │
│  ✓ Report build size                                                │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 STEP 7: Firebase Deployment                         │
├─────────────────────────────────────────────────────────────────────┤
│  ✓ Verify Firebase authentication                                   │
│  ✓ Deploy to Firebase (firebase deploy --project ai-integra-course-v2)       │
│  │                                                                   │
│  ├── Deploy Hosting                                                 │
│  │   • Upload build/ directory                                      │
│  │   • Configure caching headers                                    │
│  │   • Setup SPA routing                                            │
│  │                                                                   │
│  ├── Deploy Functions                                               │
│  │   • Upload functions/lib/                                        │
│  │   • Configure runtime (Node.js 20)                              │
│  │   • Set region (us-central1)                                    │
│  │                                                                   │
│  └── Deploy Firestore Rules                                         │
│      • Update security rules                                        │
│      • Update indexes                                               │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│             STEP 8: Post-Deployment Validation                      │
├─────────────────────────────────────────────────────────────────────┤
│  ✓ Check hosting availability (HTTP 200)                            │
│  ✓ List deployed Cloud Functions                                    │
│  ✓ Display deployment summary                                       │
│  ✓ Provide useful next steps                                        │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   DEPLOYMENT COMPLETE ✅                            │
├─────────────────────────────────────────────────────────────────────┤
│  Production URLs:                                                   │
│  • https://ai-integra-course-v2.web.app                                       │
│  • https://aiintegrationcourse.com                                  │
│                                                                      │
│  Consoles:                                                          │
│  • Firebase: console.firebase.google.com/project/ai-integra-course-v2         │
│  • GCP: console.cloud.google.com/home/dashboard?project=ai-integra-course-v2  │
└─────────────────────────────────────────────────────────────────────┘
```

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         USER TRAFFIC                             │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                            ▼
                   ┌────────────────┐
                   │  Custom Domain │
                   │ aiintegration  │
                   │   course.com   │
                   └────────┬───────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FIREBASE HOSTING                              │
├──────────────────────────────────────────────────────────────────┤
│  • Static files (build/)                                         │
│  • SPA routing                                                   │
│  • SSL/TLS (automatic)                                           │
│  • CDN (global)                                                  │
│  • Cache headers                                                 │
└───────────────────────┬──────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   FIRESTORE  │ │   FIREBASE   │ │   FIREBASE   │
│   DATABASE   │ │     AUTH     │ │   FUNCTIONS  │
├──────────────┤ ├──────────────┤ ├──────────────┤
│ • Courses    │ │ • User mgmt  │ │ • AI Tutor   │
│ • Modules    │ │ • OAuth      │ │ • API proxy  │
│ • Lessons    │ │ • Sessions   │ │ • Backend    │
│ • Progress   │ │ • Claims     │ │   logic      │
└──────────────┘ └──────────────┘ └──────┬───────┘
                                          │
                                          ▼
                                  ┌──────────────┐
                                  │   OPENAI     │
                                  │     API      │
                                  ├──────────────┤
                                  │ • GPT-4o     │
                                  │ • Embeddings │
                                  └──────────────┘
```

## GCloud Services Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                    GOOGLE CLOUD PROJECT                         │
│                      (ai-integra-course-v2)                               │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────────┐   ┌──────────────┐
│ CLOUD BUILD  │    │ CLOUD FUNCTIONS  │   │  FIRESTORE   │
├──────────────┤    ├──────────────────┤   ├──────────────┤
│ • Automated  │    │ • Node.js 20     │   │ • nam5       │
│   builds     │    │ • us-central1    │   │   (location) │
│ • CI/CD      │    │ • Auto-scaling   │   │ • Multi-     │
│   pipelines  │    │ • Event triggers │   │   region     │
└──────────────┘    └──────────────────┘   └──────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────┐
│              ARTIFACT REGISTRY                               │
├──────────────────────────────────────────────────────────────┤
│ • Function builds                                            │
│ • Container images                                           │
│ • Build artifacts                                            │
└──────────────────────────────────────────────────────────────┘
```

## Deployment Methods Comparison

```
┌─────────────────────────────────────────────────────────────────┐
│                    METHOD COMPARISON                            │
├────────────────┬────────────────┬────────────────┬─────────────┤
│    Method      │ Optimization   │  Automation    │  Use Case   │
├────────────────┼────────────────┼────────────────┼─────────────┤
│ deploy:gcloud  │ ★★★★★         │ ★★★★★         │ Production  │
│                │ Full GCloud    │ Full auto      │ recommended │
├────────────────┼────────────────┼────────────────┼─────────────┤
│ deploy         │ ★★★           │ ★★★           │ Quick       │
│                │ Standard       │ Manual setup   │ deployments │
├────────────────┼────────────────┼────────────────┼─────────────┤
│ GitHub Actions │ ★★★★          │ ★★★★★         │ CI/CD       │
│                │ Good           │ Fully auto     │ automated   │
├────────────────┼────────────────┼────────────────┼─────────────┤
│ Manual         │ ★             │ ★             │ Testing     │
│                │ Basic          │ All manual     │ only        │
└────────────────┴────────────────┴────────────────┴─────────────┘
```

## Rollback Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    ROLLBACK DECISION TREE                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Issue Detected  │
                    └────────┬─────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
        ┌──────────────┐          ┌──────────────┐
        │  Hosting     │          │  Functions   │
        │  Issue?      │          │  Issue?      │
        └──────┬───────┘          └──────┬───────┘
               │                         │
               ▼                         ▼
    ┌──────────────────┐      ┌──────────────────┐
    │ firebase hosting │      │ Deploy previous  │
    │ :rollback        │      │ function version │
    └──────────────────┘      └──────────────────┘
               │                         │
               └────────────┬────────────┘
                            │
                            ▼
                ┌──────────────────────┐
                │ Verify Rollback      │
                │ Successful           │
                └──────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                            │
└─────────────────────────────────────────────────────────────────┘

Layer 1: Network Security
├── HTTPS/TLS Encryption (Firebase Hosting)
├── CORS Configuration (Firebase Functions)
└── DDoS Protection (Google Cloud CDN)

Layer 2: Authentication & Authorization
├── Firebase Authentication
│   ├── Email/Password
│   ├── OAuth Providers
│   └── Custom Claims
└── Firestore Security Rules
    ├── User-based access
    ├── Premium content protection
    └── Write validation

Layer 3: API Security
├── OpenAI API Key (server-side only)
├── Stripe Keys (environment variables)
└── Service Account Keys (GitHub Secrets)

Layer 4: Application Security
├── Environment Variables (.env.production)
├── Secret Manager (GCP)
└── Input Validation (client & server)
```

## Monitoring & Observability

```
┌─────────────────────────────────────────────────────────────────┐
│                    MONITORING STACK                             │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────────┐   ┌──────────────┐
│   FIREBASE   │    │   GCP LOGGING    │   │   FIREBASE   │
│  ANALYTICS   │    │                  │   │  PERFORMANCE │
├──────────────┤    ├──────────────────┤   ├──────────────┤
│ • User flows │    │ • Function logs  │   │ • Load times │
│ • Events     │    │ • Error logs     │   │ • Network    │
│ • Retention  │    │ • Audit logs     │   │ • App health │
└──────────────┘    └──────────────────┘   └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   DASHBOARDS     │
                    │   & ALERTS       │
                    └──────────────────┘
```

## Cost Optimization Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                  COST OPTIMIZATION                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Hosting (Firebase)                                             │
│  ├── Static files: Cached at CDN edge (reduce bandwidth)       │
│  └── Free tier: 10GB storage, 360MB/day transfer               │
│                                                                 │
│  Cloud Functions                                                │
│  ├── Auto-scaling: Pay per invocation                          │
│  ├── Free tier: 2M invocations/month                           │
│  └── Optimization: Minimize cold starts                        │
│                                                                 │
│  Firestore                                                      │
│  ├── Efficient queries: Indexed properly                       │
│  ├── Free tier: 50K reads, 20K writes/day                      │
│  └── Multi-region: nam5 (cost-effective)                       │
│                                                                 │
│  Cloud Build                                                    │
│  ├── Incremental builds: Faster, cheaper                       │
│  └── Free tier: 120 build-minutes/day                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

**Document Version:** 1.0  
**Last Updated:** October 2025  
**Project:** AI Integration Course  
**Maintainer:** Development Team
