import React from 'react';
import { getSponsorForLesson } from '../content/sponsors';

/**
 * Reserved sponsor slot on lesson pages (part of the locked lesson theme).
 * Sold state: labeled "Sponsored · Matched to this lesson" native card.
 * Unsold state: dashed house card marketing the inventory.
 * Styling lives in src/styles/lesson-content.css (.lesson-sponsor).
 */
const LessonSponsorSlot: React.FC<{ lessonTitle?: string }> = ({ lessonTitle }) => {
  const sponsor = getSponsorForLesson(lessonTitle);

  if (sponsor) {
    return (
      <aside className="lesson-sponsor sold" aria-label="Sponsored">
        <span className="lab">Sponsored · Matched to this lesson</span>
        <h4>{sponsor.name} — {sponsor.headline}</h4>
        <p>{sponsor.body}</p>
        <a className="cta" href={sponsor.ctaUrl} target="_blank" rel="noopener noreferrer sponsored">
          {sponsor.ctaLabel}
        </a>
      </aside>
    );
  }

  return (
    <aside className="lesson-sponsor" aria-label="Sponsor slot">
      <span className="lab">Open slot</span>
      <h4>Sponsor lessons that teach your tool</h4>
      <p>
        Per-lesson placements matched by the tools in the curriculum. One
        sponsor per lesson, always labeled.
      </p>
    </aside>
  );
};

export default LessonSponsorSlot;
