# AI Integration Course - Allie Embed Pipeline

This repo scaffolds an end-to-end pipeline combining:

- FastAPI embedding service storing vectors in Supabase (Postgres + pgvector)
- Ingestion CLI to pull YouTube transcripts and index them
- Firebase Functions integrating Stripe for premium gating
- Course content with free and premium lessons

Structure
- `allie/backend`: FastAPI service exposing `/ingest` and `/similar`
- `allie/sql`: Database schema for Supabase/pgvector
- `allie/tools`: Ingestion CLI for YouTube transcripts
- `firebase/functions`: Stripe Checkout + webhook to set `users/{uid}.premium`
- `lessons`: Free and premium lesson content + manifest

Quickstart (local)
1) Postgres with pgvector: create DB and run `allie/sql/schema.sql`.
2) Backend: set `SUPABASE_DB_URL` and run `uvicorn allie.backend.app:app --reload`.
3) Ingest: `python allie/tools/ingest_youtube.py --ids <video_id>`.
4) Similar: `curl -X POST localhost:8000/similar -d '{"seed_id":"<video_id>","k":5}' -H 'Content-Type: application/json'`.

Stripe + Firebase
- Deploy functions from `firebase/functions` and configure `STRIPE_SECRET` and webhook secret.
- Use callable `createCheckoutSession` from your client to start checkout; webhook marks `premium: true`.

Notes
- Adjust embedding vector dimension in `allie/sql/schema.sql` to match your model.
- Lessons are plain Markdown; use `lessons/manifest.json` to present them in your UI.