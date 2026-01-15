#!/usr/bin/env python3
"""Upload lesson markdown files to Firebase Storage with expected paths.

Usage:
  python3 scripts/upload_lessons_to_storage.py --project ai-integra-course-v2

This maps local files in public/course_content/lessons/lesson<N>_*.md to:
  gs://<bucket>/lessons-md/courses/<course_id>/modules/<module_id>/lessons/lesson_<N>.md
"""

import argparse
import re
import subprocess
from pathlib import Path


def module_for_lesson(num: int) -> str:
    if 1 <= num <= 5:
        return 'module_01_id'
    if 6 <= num <= 8:
        return 'module_02_id'
    if 9 <= num <= 14:
        return 'module_03_id'
    if 15 <= num <= 20:
        return 'module_04_id'
    if 21 <= num <= 26:
        return 'module_05_id'
    if 27 <= num <= 31:
        return 'module_06_id'
    if 32 <= num <= 39:
        return 'module_07_id'
    raise ValueError(f"No module mapping for lesson {num}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--project', default='ai-integra-course-v2', help='GCP project ID')
    parser.add_argument('--bucket', default='ai-integra-course-v2.firebasestorage.app', help='Storage bucket name')
    parser.add_argument('--course', default='course_01_id', help='Course ID')
    parser.add_argument('--dry-run', action='store_true', help='Print actions without copying')
    args = parser.parse_args()

    lesson_dir = Path(__file__).resolve().parents[1] / 'public' / 'course_content' / 'lessons'
    if not lesson_dir.exists():
        raise SystemExit(f"Lesson directory not found: {lesson_dir}")

    files = sorted(lesson_dir.glob('lesson*_*.md'))
    for path in files:
        match = re.match(r'lesson(\d+)_', path.name)
        if not match:
            continue
        num = int(match.group(1))
        module_id = module_for_lesson(num)
        dest = (
            f"gs://{args.bucket}/lessons-md/courses/{args.course}/"
            f"modules/{module_id}/lessons/lesson_{num}.md"
        )
        cmd = ['gcloud', 'storage', 'cp', str(path), dest]
        if args.dry_run:
            print('[dry-run]', ' '.join(cmd))
            continue
        print('[upload]', ' '.join(cmd))
        result = subprocess.run(cmd, check=False)
        if result.returncode != 0:
            raise SystemExit(f"Upload failed for {path}")

    return 0


if __name__ == '__main__':
    raise SystemExit(main())
