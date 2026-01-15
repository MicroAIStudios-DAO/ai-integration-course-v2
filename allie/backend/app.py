from fastapi import FastAPI
from pydantic import BaseModel
import os, numpy as np
from dotenv import load_dotenv
from .model import embed_text, get_model_name, get_embed_dim, warmup
from .database import get_conn
import logging
load_dotenv()
app = FastAPI(title="Allie Embed API")

class IngestReq(BaseModel):
    youtube_id: str
    title: str = ""
    transcript: str
    channel_id: str | None = None
    published_at: str | None = None
    lang: str = "en"
    duration_s: int | None = None

class SimilarReq(BaseModel):
    seed_id: str
    k: int = 20

def vec_sql(v):
    return "[" + ",".join(f"{float(x):.6f}" for x in v.tolist()) + "]"

@app.post("/ingest")
def ingest(req: IngestReq):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("""
          insert into videos (id,title,channel_id,published_at,lang,duration_s)
          values (%s,%s,%s,%s,%s,%s)
          on conflict (id) do update set
            title=excluded.title, channel_id=excluded.channel_id,
            published_at=excluded.published_at, lang=excluded.lang, duration_s=excluded.duration_s
        """,(req.youtube_id, req.title, req.channel_id, req.published_at, req.lang, req.duration_s))
        emb = embed_text(req.transcript).astype(np.float32)
        emb_sql = vec_sql(emb)
        cur.execute("""
          insert into video_embeddings (video_id, embedding)
          values (%s, %s::vector)
          on conflict (video_id) do update set embedding=%s::vector
        """,(req.youtube_id, emb_sql, emb_sql))
    return {"ok": True, "video_id": req.youtube_id}

@app.post("/similar")
def similar(req: SimilarReq):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("select embedding from video_embeddings where video_id=%s",(req.seed_id,))
        row = cur.fetchone()
        if not row: return {"results":[]}
        seed = row[0]
        if isinstance(seed, str):
            seed = seed.strip("[]")
            seed = np.array([float(x) for x in seed.split(",")], dtype=np.float32)
        else:
            seed = np.array(seed, dtype=np.float32)
        seed_sql = vec_sql(seed)
        cur.execute("""
          select v.id, v.title, 1 - (e.embedding <=> %s::vector) as cosine_sim
          from video_embeddings e join videos v on v.id=e.video_id
          where v.id <> %s
          order by e.embedding <-> %s::vector
          limit %s
        """,(seed_sql, req.seed_id, seed_sql, req.k+50))
        rows = cur.fetchall()
    out = [{"video_id": r[0], "title": r[1], "sim": float(r[2])} for r in rows[:req.k]]
    return {"results": out}


@app.get("/healthz")
def healthz():
    # Lightweight readiness info; does not force model load
    return {
        "ok": True,
        "model": get_model_name(),
        "db": bool(os.environ.get("SUPABASE_DB_URL")),
    }


@app.get("/model")
def model_info():
    # Forces a tiny load to report dimension accurately
    try:
        dim = get_embed_dim()
    except Exception as e:
        logging.exception("Error while getting embedding dimension")
        return {"model": get_model_name(), "error": "Internal error"}
    return {"model": get_model_name(), "dimension": dim}


@app.post("/warmup")
def warmup_model():
    warmup()
    return {"ok": True, "model": get_model_name()}
