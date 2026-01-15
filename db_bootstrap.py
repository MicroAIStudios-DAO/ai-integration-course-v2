import os, psycopg

# BAAI/bge-small-en-v1.5 => 384-dim embeddings
DIM = 384
DDL = f"""
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS allie_items (
  youtube_id   TEXT PRIMARY KEY,
  title        TEXT,
  transcript   TEXT NOT NULL,
  channel_id   TEXT,
  published_at TIMESTAMPTZ,
  lang         TEXT DEFAULT 'en',
  duration_s   INT,
  embedding    VECTOR({DIM}) NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- cosine distance index for ANN search
CREATE INDEX IF NOT EXISTS allie_items_embedding_idx
  ON allie_items
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
"""

dsn = os.environ.get("DATABASE_URL")
if not dsn:
    raise SystemExit("DATABASE_URL not set in environment")

with psycopg.connect(dsn, autocommit=True) as conn:
    with conn.cursor() as cur:
        cur.execute(DDL)
        cur.execute("ANALYZE allie_items;")
print("DB bootstrap OK.")
