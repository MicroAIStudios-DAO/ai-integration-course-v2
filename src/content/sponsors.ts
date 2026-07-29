/**
 * Lesson sponsor slots (reserved ad inventory on lesson pages ONLY).
 *
 * Selling a slot = adding one entry here. When the list is empty the slot
 * renders as a labeled "open slot" house card, marketing the inventory.
 * Rules baked into the design: one sponsor per lesson, always labeled
 * "Sponsored", styled to match the lesson theme — never mid-paragraph.
 */

export interface LessonSponsor {
  id: string;
  /** Brand name shown on the card */
  name: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  /**
   * Optional congruence targeting: lowercase tool names. When set, the
   * sponsor only appears on lessons whose title mentions one of these
   * tools ("zapier", "gmail", "openai", ...). When omitted, the sponsor
   * is eligible for every lesson.
   */
  toolKeywords?: string[];
}

export const lessonSponsors: LessonSponsor[] = [
  // No sponsors sold yet — the slot renders its house state.
];

export const getSponsorForLesson = (lessonTitle?: string): LessonSponsor | null => {
  const title = (lessonTitle || '').toLowerCase();
  const matched = lessonSponsors.find((s) =>
    !s.toolKeywords || s.toolKeywords.some((kw) => title.includes(kw.toLowerCase()))
  );
  return matched ?? null;
};
