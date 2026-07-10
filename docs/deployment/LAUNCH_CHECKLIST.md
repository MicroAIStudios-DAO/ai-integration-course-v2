Title: AI Tutor Launch Handoff — Commands and Verification

Scope
- Project: dev/ai-integration-course
- Provider(s): Firebase (Firestore/Functions/Hosting), Microsoft 365 (email)
- This checklist executes the planned launch safely, with backups and verifications.

Pre‑requisites
- Node 20+ and npm 11
- Firebase CLI (firebase login)
- Google ADC credentials available locally (DO NOT commit):
  - export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/your-service-account.json
- Access to Firebase Hosting project for aiintegrationcourse.com

0) Set environment and install dependencies
```bash
export GOOGLE_APPLICATION_CREDENTIALS=/home/microai/Downloads/ai-integra-course-v2-3619158f2924.json
cd ~/dev/ai-integration-course
npm ci
(cd functions && npm ci)
```

1) Deploy Firestore rules + Tutor function
```bash
firebase deploy --only firestore:rules,functions:tutor --project ai-integra-course-v2
```

2) Remove bogus root lessons (backup first)
```bash
node scripts/cleanup_bogus_lessons.cjs
# Backup is written to reorg_logs/backup_root_lessons_<timestamp>.json
```

3) Normalize lessons and tiers; dedupe; set video for first free lesson
```bash
node firestore_migrate.js --apply
# If needed, set the first free lesson video explicitly by title:
node scripts/set_lesson_video_by_title.cjs "The AI Revolution: An Introductory Overview" "https://youtu.be/yegyaYCQhgs"
# Or by explicit document path:
# node scripts/set_lesson_video.cjs "courses/<courseId>/modules/<moduleId>/lessons/<lessonId>" "https://youtu.be/yegyaYCQhgs"
```

4) Grant admin access (premium bypass) to livetrue2u@gmail.com
```bash
node scripts/grant_admin.cjs livetrue2u@gmail.com
# Sets custom claims { admin: true, subscriptionActive: true } and mirrors user profile { isAdmin: true, role: 'admin', isSubscribed: true }
```

5) Wire proxy API to Cloud Function (if not already)
- Ensure any deployed proxy endpoints have the same environment variables as Firebase Functions
  - FIREBASE_TUTOR_URL = https://us-central1-ai-integra-course-v2.cloudfunctions.net/tutor
- Redeploy the project.

6) Post‑deploy verifications
- Website
  - Open https://aiintegrationcourse.com — footer says "© 2025 MicroAI Studios™ — All rights reserved."
  - Courses → open “The AI Revolution: An Introductory Overview” → YouTube video loads.
  - “Future Trends and Next Frontiers in AI Investments” shows Free; all other lessons show Premium.
- Auth gating
  - Log in as livetrue2u@gmail.com → premium lessons open.
  - Log out → only two lessons are free.
- Tutor
  - On a lesson, ask a question → tokens stream; inline citations look like (Lesson §1) and (Lesson §2–3).
  - Verify no raw API responses are stored.

7) DNS/email quick checks (already configured)
```bash
dig MX aiintegrationcourse.com +short
dig TXT aiintegrationcourse.com +short | sed 's/\"//g'
dig TXT _dmarc.aiintegrationcourse.com +short
nslookup -type=CNAME selector1._domainkey.aiintegrationcourse.com
nslookup -type=CNAME selector2._domainkey.aiintegrationcourse.com
```
- Send a test to a Gmail account, check Show Original → SPF=pass, DKIM=pass, DMARC=pass.

8) Rollback/Recovery
- Firestore root lessons backup at `reorg_logs/backup_root_lessons_<timestamp>.json`.
- To restore one backup doc:
```bash
node -e 'const fs=require("fs");const admin=require("firebase-admin");try{admin.initializeApp()}catch{};const db=admin.firestore();const b=JSON.parse(fs.readFileSync("reorg_logs/backup_root_lessons_<timestamp>.json","utf-8"));Promise.all(Object.entries(b).map(([p,d])=>db.doc(p).set(d))).then(()=>console.log("restored"))'
```

9) Operations notes
- Secrets:
  - OPENAI_API_KEY is read from environment on Functions runtime; do not commit keys.
- Cost guard:
  - Tutor caps context ~8k tokens and limits output to ~600 tokens; fallbacks: o3-mini → gpt-4o-mini → gpt-3.5-turbo.
- Caching:
  - Optional per-lesson embeddings cache at `indexes/lesson_<id>_embeddings.json` in Firebase Storage.

10) After a few days
- Tighten DMARC to `p=quarantine` then `p=reject` once all senders are aligned.

Contact points
- Admin account: livetrue2u@gmail.com (custom claim admin: true)
- Tutor Function: us-central1: `tutor`

