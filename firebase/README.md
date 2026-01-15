Firebase Functions
- Functions in `firebase/functions` implement Stripe checkout and a webhook.
- On premium purchase, the user's Firestore doc `users/{uid}` gets `premium: true`.

Setup
- Install Firebase CLI and login.
- Configure env: set `STRIPE_SECRET` and `STRIPE_WEBHOOK_SECRET` via `.env` or `firebase functions:config:set stripe.secret=... stripe.webhook=...`.
- Deploy functions: `npm --prefix firebase/functions install && npm --prefix firebase/functions run build && firebase deploy --only functions`.

Local emulation
- Use `firebase emulators:start --only functions` after building.

Seeding premium lessons to Firestore
- Ensure your credentials are set (e.g., `export GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccount.json`).
- Optionally set `--project <gcp-project-id>`.
- Run: `python allie/tools/seed_lessons_firestore.py` to upsert premium lessons into `lessons/{slug}` with fields: `title, tier, videoId, md`.
- Add `--include-free` to also seed free lessons.

Photos (Firebase Storage)
- Rules are in `firebase/storage.rules` (public read; writes under `uploads/{uid}/**` require login).
- Deploy rules: `firebase deploy --only storage`.
- Use the web uploader at `/upload` (sign in first) to select and upload an image. The page returns a public URL and copies it to your clipboard.
- Add the URL to `thumbnailUrl` in `lessons/manifest.json` or embed it directly in Markdown: `![](https://...)`.
