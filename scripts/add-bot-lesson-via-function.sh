#!/bin/bash

# Read the markdown content and escape it for JSON
CONTENT=$(cat /home/ubuntu/ai-integration-course-v2/lessons/premium/build-your-first-bot.md | jq -Rs .)

# Create the JSON payload
cat > /tmp/lesson-payload.json << EOF
{
  "courseId": "course_01_id",
  "moduleId": "module_01_id",
  "lesson": {
    "id": "lesson_mod1_project",
    "title": "MOD 1 PROJECT: Build Your First Bot",
    "order": 5.5,
    "isFree": false,
    "tier": "premium",
    "content": ${CONTENT},
    "videoUrl": null,
    "durationMinutes": 180,
    "description": "Build a Customer Service Email Bot in 14 days - complete this project or get a full refund!"
  }
}
EOF

echo "=== Payload created ==="
echo "Calling addLessonToFirestore function..."

# Call the function using Firebase CLI
firebase functions:call addLessonToFirestoreV2 --data "$(cat /tmp/lesson-payload.json)" --project ai-integra-course-v2

echo ""
echo "=== Now listing courses to verify ==="
firebase functions:call listCoursesAndModulesV2 --project ai-integra-course-v2
