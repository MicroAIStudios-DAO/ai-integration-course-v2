#!/usr/bin/env python3
import os, sys, json, subprocess, shlex, re, time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'tools' / 'suggested_lesson_video_matches.json'
LOG_DIR = ROOT / 'reorg_logs'
LOG_DIR.mkdir(parents=True, exist_ok=True)

def log(msg):
    ts = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    print(f"[{ts}] {msg}", file=sys.stderr)

def have(cmd):
    from shutil import which
    return which(cmd) is not None

def list_lessons():
    # Placeholder list; adjust to fetch from Firestore on deploy
    return [
        'The AI Revolution: An Introductory Overview',
        'Future Trends and Next Frontiers in AI Investments',
    ]

VIDEO_EXTS = {'.mp4','.mov','.mkv','.webm'}

def iter_videos(home):
    for root, dirs, files in os.walk(home):
        if any(part in {'.cache','.local','snap','.nvm','.rustup','.cargo','.conda','.pyenv','node_modules','.git'} for part in root.split(os.sep)):
            continue
        for f in files:
            p = Path(root)/f
            if p.suffix.lower() in VIDEO_EXTS:
                yield p

def ffprobe_title(path):
    if not have('ffprobe'): return None
    try:
        cmd = f"ffprobe -v error -show_entries format_tags=title -of default=noprint_wrappers=1:nokey=1 {shlex.quote(str(path))}"
        out = subprocess.check_output(cmd, shell=True, stderr=subprocess.DEVNULL, text=True).strip()
        return out or None
    except Exception:
        return None

def norm(s):
    return re.sub(r"[^a-z0-9]+"," ", s.lower()).strip()

def score(a,b):
    ta = set(norm(a).split()); tb = set(norm(b).split())
    if not ta or not tb: return 0.0
    inter = len(ta & tb); union = len(ta | tb)
    return inter/union

def main():
    home = Path.home()
    lessons = list_lessons()
    result = {t: [] for t in lessons}
    for p in iter_videos(home):
        meta = ffprobe_title(p) or p.stem
        for t in lessons:
            s = score(t, meta)
            if s >= 0.10:
                result[t].append({"path": str(p), "score": round(s,3)})
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(result, indent=2))
    log(f"Wrote {OUT}")

if __name__ == '__main__':
    main()

