# Lesson Content Management Guide

## The security model (read this first)

Lesson docs at `courses/{courseId}/modules/{moduleId}/lessons/{lessonId}` are
**world-readable catalog metadata** — anyone, signed in or not, can read every
field on them (this keeps the course outline working for anonymous visitors).
Because of that, `firestore.rules` **rejects any lesson-doc write containing**
`content`, `markdown`, `md`, `html`, `videoUrl`, `youtubeUrl`, or `videoId`.

Gated material lives in the **`lessonContent/{courseId}__{moduleId}__{lessonId}`**
collection instead, whose reads are tier-gated (free / founders / premium).
Storage markdown under `lessons-md/**` is likewise gated by `storage.rules`
(paid access only, except the five free module-1 files).

Rules of thumb:

- **Free lessons** (`tier: 'free'` / `isFree: true`): `storagePath` and
  `videoUrl` may live on the lesson doc — free content must work for anonymous
  visitors, who cannot read `lessonContent`.
- **Premium / founders lessons**: body (`content`), `videoUrl`, `youtubeUrl`,
  and `storagePath` go in `lessonContent` only. Never on the lesson doc.
- If you find gated fields on a lesson doc, run
  `node scripts/migrate-protected-lesson-content.js` to move them.

## How to add lesson content

### Method 1: The admin callable (recommended)

Call `addLessonToFirestoreV2` (admin-only) with the lesson payload. It routes
fields to the right place automatically: metadata to the lesson doc, and — for
protected lessons — `content`/`storagePath`/`videoUrl` to `lessonContent`.

### Method 2: Storage markdown + seeder scripts

1. Put the markdown source under `public/course_content/lessons/` (these files
   are stripped from the hosted build by `scripts/strip-gated-content.mjs` —
   they are upload sources, not web assets).
2. Upload to Storage: `python scripts/upload_lessons_to_storage.py` (targets
   `lessons-md/courses/...`).
3. Seed the structure: `python allie/tools/seed_course_structure.py` — free
   lessons get `storagePath` on the doc; gated lessons get it in
   `lessonContent`.

### Method 3: Manual console edits

Only for **free** lessons, and only metadata plus `content`/`storagePath` on
the doc. For gated lessons, edit the `lessonContent/{courseId}__{moduleId}__{lessonId}`
document instead. A console write to a lesson doc that includes gated fields
will be rejected by the rules.

### Automatic fallback

If no content is found anywhere, the lesson page renders a professional
"Content coming soon" placeholder with the title, duration, and description.

## Adding videos

- **Free lesson**: `node scripts/set_lesson_video.cjs <lessonDocPath> <url>` —
  writes `videoUrl` on the lesson doc.
- **Premium / founders lesson**: the same script detects the tier and writes
  the URL to `lessonContent` instead (removing any copy from the public doc).
  `set_lesson_video_by_title.cjs` works the same way when you only know the
  title.

Supported: YouTube URLs, Vimeo URLs, direct video file URLs.

## Content formatting tips

### Use Markdown for rich formatting
- `# Heading 1` for main sections
- `## Heading 2` for subsections
- `**bold text**` / `*italic text*` for emphasis
- `- bullet points` for lists
- `> blockquotes` for important notes

The lesson page renders content in the locked "Liquid Glass" lesson theme
(`src/styles/lesson-content.css`, palette in `docs/brand/lesson-gradient-palette.md`):
typography, tables, code blocks, and blockquotes are styled automatically,
mobile-responsive, and print-friendly.

### Adding images
1. Upload images to Firebase Storage under a public path (`course_content/`
   images are public by rule).
2. Get the download URL.
3. Use markdown image syntax: `![Alt text](image-url)`.

## Field reference

Lesson doc (world-readable — metadata only):

```typescript
{
  id: string;           // Auto-generated
  title: string;        // Lesson title
  order: number;        // Display order
  tier: 'free' | 'premium' | 'founders';
  isFree: boolean;      // Keep in sync with tier === 'free'
  durationMinutes?: number;
  description?: string;
  storagePath?: string; // FREE lessons only
  videoUrl?: string;    // FREE lessons only
}
```

`lessonContent/{courseId}__{moduleId}__{lessonId}` (tier-gated):

```typescript
{
  courseId: string;
  moduleId: string;
  lessonId: string;
  tier: 'free' | 'premium' | 'founders';
  content?: string;     // Markdown body
  storagePath?: string; // Storage markdown pointer
  videoUrl?: string;
  youtubeUrl?: string;
}
```

## Best practices

1. **Keep content focused**: each lesson should cover 1-3 related concepts
2. **Use clear headings**: help students navigate the content
3. **Include examples**: real-world examples make concepts clearer
4. **Add takeaways**: summarize key points at the end
5. **Keep `tier` and `isFree` in sync** (the UI reads both)
6. **Never bypass the split**: Admin-SDK scripts skip the rules, so they must
   enforce the metadata/content split themselves (see the seeder scripts for
   the pattern)

## Getting help

1. Use the AI Tutor feature in each lesson
2. Contact support through the platform
3. Refer to this guide for formatting help
