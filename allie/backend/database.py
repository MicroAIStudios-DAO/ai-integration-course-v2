import os
import psycopg


def _get_db_url() -> str:
    # Prefer explicit backend URL
    url = (
        os.getenv("SUPABASE_DB_URL")
        or os.getenv("POSTGRES_URL_NON_POOLING")
        or os.getenv("POSTGRES_URL")
        or os.getenv("DATABASE_URL")
    )
    if not url:
        raise RuntimeError("Database URL not configured. Set SUPABASE_DB_URL or POSTGRES_URL_NON_POOLING.")
    return url


def get_conn():
    # Open a short-lived connection per request for cloud DBs/poolers
    url = _get_db_url()
    return psycopg.connect(url, autocommit=False)

