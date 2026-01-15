#!/usr/bin/env python3
"""
Seed lessons into Firestore for server-side protection of premium content.

Requires Google credentials with Firestore access. Set GOOGLE_APPLICATION_CREDENTIALS
to a service account JSON or use Application Default Credentials.

Usage:
  python allie/tools/seed_lessons_firestore.py --project <gcp-project-id>
  # Optional flags:
  #   --include-free   Include free lessons as well
  #   --collection     Firestore collection (default: lessons)
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Any, Dict

from google.cloud import firestore


def load_manifest(repo_root: Path) -> Dict[str, Any]:
  manifest_path = repo_root / 'lessons' / 'manifest.json'
  with open(manifest_path, 'r', encoding='utf-8') as f:
    return json.load(f)


def read_file(repo_root: Path, rel_path: str) -> str:
  p = repo_root / 'lessons' / rel_path
  return p.read_text(encoding='utf-8')


def main() -> int:
  p = argparse.ArgumentParser()
  p.add_argument('--project', help='GCP project ID (optional if ADC set)')
  p.add_argument('--include-free', action='store_true', help='Also seed free lessons')
  p.add_argument('--collection', default='lessons', help='Firestore collection name')
  args = p.parse_args()

  repo_root = Path(__file__).resolve().parents[2]
  manifest = load_manifest(repo_root)

  db = firestore.Client(project=args.project) if args.project else firestore.Client()

  def upsert(lesson: Dict[str, Any], tier: str) -> None:
    slug = lesson['slug']
    title = lesson['title']
    video_id = lesson.get('videoId')
    thumb = lesson.get('thumbnailUrl')
    
    # Construct videoUrl for frontend (ReactPlayer) if videoId is present
    video_url = None
    if video_id and video_id != "YOUR_INTRO_VIDEO_ID" and video_id != "YOUR_SETUP_VIDEO_ID":
       if video_id.startswith('http'):
           video_url = video_id
       else:
           video_url = f"https://www.youtube.com/watch?v={video_id}"

    md = read_file(repo_root, lesson['path'])
    data = {
      'slug': slug,
      'title': title,
      'tier': tier,
      'videoId': video_id,
      'videoUrl': video_url, # Added to match frontend schema
      'thumbnailUrl': thumb,
      'md': md,
      'updatedAt': firestore.SERVER_TIMESTAMP,
    }
    db.collection(args.collection).document(slug).set(data, merge=True)
    print(f'[seed] upserted {slug} ({tier})')

  if args.include_free:
    for l in manifest.get('free', []):
      upsert(l, 'free')
  for l in manifest.get('premium', []):
    upsert(l, 'premium')

  print('Done.')
  return 0


if __name__ == '__main__':
  raise SystemExit(main())
