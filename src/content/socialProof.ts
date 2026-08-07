/**
 * Social proof data — INTENTIONALLY EMPTY until real, permissioned proof
 * exists.
 *
 * ────────────────────────────────────────────────────────────────────────
 * TODO(owner): populate with REAL data only.
 *  - testimonials: verbatim quotes from real students who gave written
 *    permission. Never paraphrase, never invent, never use "a student
 *    said". Include the permission date in the source field.
 *  - stats: only numbers you can regenerate on demand from first-party
 *    data (Stripe, Firestore). No estimates.
 *  - credentials: real instructor/company credentials with verifiable
 *    issuers.
 * ────────────────────────────────────────────────────────────────────────
 *
 * The rendering component (SocialProofSection.tsx) hides itself entirely
 * while these arrays are empty, so this file can ship empty safely.
 *
 * HARD RULE from the site owner: no fake social proof, no invented
 * outcome claims, and no aggregateRating/Review schema anywhere — not
 * even when real testimonials exist, unless the owner explicitly adds it.
 */

export interface Testimonial {
  /** Verbatim quote, with written permission on file. */
  quote: string;
  /** Real name (or explicitly-permissioned initials). */
  name: string;
  /** Role/company line, as the person approved it. */
  attribution: string;
  /** Where the permission lives, e.g. "email 2026-08-02" — not rendered. */
  source: string;
}

export interface ProofStat {
  /** The number, exactly as regenerable from first-party data. */
  value: string;
  /** What it counts, e.g. "builds shipped by students". */
  label: string;
  /** How to regenerate it, e.g. "Firestore completedLessons query" — not rendered. */
  source: string;
}

export interface Credential {
  /** e.g. "Google Cloud Certified" */
  name: string;
  /** Issuing body. */
  issuer: string;
}

export const testimonials: Testimonial[] = [
  // TODO(owner): add real, permissioned quotes. Example shape (DO NOT ship
  // placeholder content — the section stays hidden while this is empty):
  // {
  //   quote: '…',
  //   name: '…',
  //   attribution: '…',
  //   source: 'email YYYY-MM-DD',
  // },
];

export const proofStats: ProofStat[] = [
  // TODO(owner): add regenerable first-party numbers only.
];

export const credentials: Credential[] = [
  // TODO(owner): mirror the real credential badges from /about if desired.
];
