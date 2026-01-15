#!/usr/bin/env python3
"""
Seed course structure into Firestore to match the hierarchical format expected by the app.

Usage:
  python allie/tools/seed_course_structure.py --project ai-integra-course-v2
"""
from __future__ import annotations

import argparse
import subprocess
import re
from google.cloud import firestore


def get_title_from_storage(bucket_path: str) -> str:
    """Extract title from first line of markdown file in Storage."""
    try:
        result = subprocess.run(
            ['gsutil', 'cat', bucket_path],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0:
            first_line = result.stdout.split('\n')[0]
            # Remove markdown heading prefix
            title = re.sub(r'^#+\s*', '', first_line).strip()
            return title if title else "Untitled Lesson"
    except Exception as e:
        print(f"Warning: Could not get title from {bucket_path}: {e}")
    return "Untitled Lesson"


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument('--project', default='ai-integra-course-v2', help='GCP project ID')
    args = p.parse_args()

    db = firestore.Client(project=args.project)
    bucket = 'gs://ai-integra-course-v2.firebasestorage.app'

    # Course data
    course_id = 'course_01_id'
    course_ref = db.collection('courses').document(course_id)
    course_ref.set({
        'title': 'AI Integration Course',
        'description': 'Learn to integrate AI into your applications with practical, hands-on lessons.',
    }, merge=True)
    print(f"[seed] Created/updated course: {course_id}")

    # Module definitions with their lessons from Storage
    modules = [
        {
            'id': 'module_01_id',
            'title': 'Module 1: Foundations of AI Integration',
            'description': 'Introduction to AI integration fundamentals and getting started.',
            'order': 1,
            'lessons': [
                ('lesson_1', 1, 'free'),
                ('lesson_2', 2, 'free'),
                ('lesson_3', 3, 'free'),
                ('lesson_4', 4, 'free'),
                ('lesson_5', 5, 'free'),
            ]
        },
        {
            'id': 'module_02_id',
            'title': 'Module 2: AI in Finance and Investment',
            'description': 'AI applications in finance, blockchain, and investment trends.',
            'order': 2,
            'lessons': [
                ('lesson_6', 1, 'premium'),
                ('lesson_7', 2, 'premium'),
                ('lesson_8', 3, 'premium'),
            ]
        },
        {
            'id': 'module_03_id',
            'title': 'Module 3: AI Entrepreneurship and Startups',
            'description': 'From ideas to funding: building AI-powered businesses.',
            'order': 3,
            'lessons': [
                ('lesson_9', 1, 'premium'),
                ('lesson_10', 2, 'premium'),
                ('lesson_11', 3, 'premium'),
                ('lesson_12', 4, 'premium'),
                ('lesson_13', 5, 'premium'),
                ('lesson_14', 6, 'premium'),
            ]
        },
        {
            'id': 'module_04_id',
            'title': 'Module 4: AI for Small Business',
            'description': 'Practical AI strategies for SMB growth and operations.',
            'order': 4,
            'lessons': [
                ('lesson_15', 1, 'premium'),
                ('lesson_16', 2, 'premium'),
                ('lesson_17', 3, 'premium'),
                ('lesson_18', 4, 'premium'),
                ('lesson_19', 5, 'premium'),
                ('lesson_20', 6, 'premium'),
            ]
        },
        {
            'id': 'module_05_id',
            'title': 'Module 5: AI for Real Estate',
            'description': 'Applying AI to real estate workflows and decision-making.',
            'order': 5,
            'lessons': [
                ('lesson_21', 1, 'premium'),
                ('lesson_22', 2, 'premium'),
                ('lesson_23', 3, 'premium'),
                ('lesson_24', 4, 'premium'),
                ('lesson_25', 5, 'premium'),
                ('lesson_26', 6, 'premium'),
            ]
        },
        {
            'id': 'module_06_id',
            'title': 'Module 6: AI for Executive Leadership',
            'description': 'Strategic AI leadership across the enterprise.',
            'order': 6,
            'lessons': [
                ('lesson_27', 1, 'premium'),
                ('lesson_28', 2, 'premium'),
                ('lesson_29', 3, 'premium'),
                ('lesson_30', 4, 'premium'),
                ('lesson_31', 5, 'premium'),
            ]
        },
        {
            'id': 'module_07_id',
            'title': 'Module 7: AI and Creative Industries',
            'description': 'Creative workflows powered by AI across media and entertainment.',
            'order': 7,
            'lessons': [
                ('lesson_32', 1, 'premium'),
                ('lesson_33', 2, 'premium'),
                ('lesson_34', 3, 'premium'),
                ('lesson_35', 4, 'premium'),
                ('lesson_36', 5, 'premium'),
                ('lesson_37', 6, 'premium'),
                ('lesson_38', 7, 'premium'),
                ('lesson_39', 8, 'premium'),
            ]
        },
    ]

    for module in modules:
        module_ref = course_ref.collection('modules').document(module['id'])
        module_ref.set({
            'title': module['title'],
            'description': module['description'],
            'order': module['order'],
        }, merge=True)
        print(f"[seed] Created/updated module: {module['id']}")

        for lesson_id, order, tier in module['lessons']:
            storage_path = f"{bucket}/lessons-md/courses/{course_id}/modules/{module['id']}/lessons/{lesson_id}.md"
            title = get_title_from_storage(storage_path)
            is_free = tier == 'free'

            lesson_ref = module_ref.collection('lessons').document(lesson_id)
            lesson_ref.set({
                'title': title,
                'order': order,
                'tier': tier,
                'isFree': is_free,
                'storagePath': f"lessons-md/courses/{course_id}/modules/{module['id']}/lessons/{lesson_id}.md",
            }, merge=True)
            print(f"[seed]   {lesson_id}: {title} ({tier})")

    print('\nDone seeding course structure!')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
