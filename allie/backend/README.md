# Allie Embedding API (FastAPI)

Endpoints
- POST `/ingest`: upsert video metadata and embedding
- POST `/similar`: k-NN by cosine similarity
- GET `/healthz`: basic readiness info
- GET `/model`: returns model name and embedding dimension
- POST `/warmup`: preloads the embedding model into memory

## Setup

```bash
cd allie/backend
python3 -m venv .venv
source .venv/bin/activate

# Note: PyTorch is ~900MB. If /tmp is a small tmpfs, use a different temp dir:
TMPDIR=/home/$USER/pip_tmp pip install -r requirements.txt

# Or if you have enough space in /tmp:
pip install -r requirements.txt
```

## Run locally

1. Set `SUPABASE_DB_URL` and optional `ALLIE_EMBED_MODEL` (see `.env.example`).
2. Start the server:
   ```bash
   source .venv/bin/activate
   uvicorn allie.backend.app:app --reload
   ```

Notes
- Ensure your DB has pgvector installed and run `allie/sql/schema.sql`.
- Embedding dimension defaults to 384 (bge-small-en-v1.5). Adjust schema if using a different model.
- Configure model via env:
  - `ALLIE_EMBED_MODEL` (e.g., `BAAI/bge-m3` for multilingual)
  - `ALLIE_DEVICE` (`cpu`, `cuda`, or `mps`)
  - `ALLIE_MAX_SEQ_LENGTH` (e.g., 512)
