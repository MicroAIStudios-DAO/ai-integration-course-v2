-- Supabase/Postgres schema for Allie embed pipeline
-- Requires pgvector extension

create extension if not exists vector;

-- Videos metadata
create table if not exists public.videos (
  id text primary key,
  title text not null default '',
  channel_id text,
  published_at timestamptz,
  lang text not null default 'en',
  duration_s integer
);

-- Embeddings table
-- Adjust dimension to match your model (bge-small-en-v1.5 = 384)
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='video_embeddings'
  ) then
    create table public.video_embeddings (
      video_id text primary key references public.videos(id) on delete cascade,
      embedding vector(384)
    );
  end if;
end $$;

-- HNSW or IVFFlat index; IVFFlat is available widely
-- You can tune lists/probes depending on data size
do $$ begin
  if not exists (
    select 1 from pg_indexes where schemaname='public' and indexname='video_embeddings_embedding_idx'
  ) then
    create index video_embeddings_embedding_idx on public.video_embeddings using ivfflat (embedding vector_l2_ops) with (lists = 100);
  end if;
end $$;

-- Helpful view for debugging
create or replace view public.video_with_emb as
select v.*, e.embedding from public.videos v left join public.video_embeddings e on e.video_id = v.id;

