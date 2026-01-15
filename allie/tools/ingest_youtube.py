#!/usr/bin/env python3
"""
CLI to fetch YouTube transcripts and ingest into the Allie embed API.

Usage:
  python -m allie.tools.ingest_youtube --ids video1,video2
  python -m allie.tools.ingest_youtube --file ids.txt
  echo "id1\nid2" | python -m allie.tools.ingest_youtube

Env:
  ALLIE_API_URL: default http://localhost:8000
"""
from __future__ import annotations

import argparse
import os
import sys
from typing import Iterable, List

import httpx
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled


def iter_ids(args: argparse.Namespace) -> Iterable[str]:
    if args.ids:
        for x in args.ids.split(","):
            x = x.strip()
            if x:
                yield x
    if args.file:
        with open(args.file) as f:
            for line in f:
                line = line.strip()
                if line:
                    yield line
    if not args.ids and not args.file:
        for line in sys.stdin:
            line = line.strip()
            if line:
                yield line


def fetch_transcript(video_id: str, lang: str = "en") -> str:
    try:
        transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=[lang])
    except TranscriptsDisabled:
        # try auto-generated
        transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=[f"{lang}", "en"])
    text = " ".join(chunk["text"] for chunk in transcript)
    return text


def ingest(api: str, video_id: str, transcript: str, title: str = "", lang: str = "en") -> bool:
    payload = {
        "youtube_id": video_id,
        "title": title,
        "transcript": transcript,
        "lang": lang,
    }
    with httpx.Client(timeout=60.0) as client:
        r = client.post(f"{api.rstrip('/')}/ingest", json=payload)
        if r.status_code != 200:
            print(f"[ERROR] {video_id}: {r.status_code} {r.text}", file=sys.stderr)
            return False
        print(f"[OK] {video_id}")
        return True


def main(argv: List[str] | None = None) -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--ids", help="Comma-separated YouTube IDs")
    p.add_argument("--file", help="File with YouTube IDs (one per line)")
    p.add_argument("--lang", default="en")
    p.add_argument("--api", default=os.getenv("ALLIE_API_URL", "http://localhost:8000"))
    args = p.parse_args(argv)

    api = args.api
    ok = True
    for vid in iter_ids(args):
        try:
            text = fetch_transcript(vid, lang=args.lang)
        except Exception as e:
            print(f"[ERROR] {vid}: transcript fetch failed: {e}", file=sys.stderr)
            ok = False
            continue
        if not ingest(api, vid, text, lang=args.lang):
            ok = False
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())

