/**
 * Centralized brand identity.
 *
 * Hierarchy:
 *   Synconis Logic Systems  (parent company — copyright holder)
 *   └── Synconis Labs       (venture)
 *       └── The Foundation for Applied Artificial Intelligence & Systems Design  (Academy)
 *           └── AI Integration Course  (premier specialized training program)
 */
export const BRAND = {
  courseName: 'AI Integration Course',
  academyName: 'The Foundation for Applied Artificial Intelligence & Systems Design',
  academyShortName: 'The Foundation',
  ventureName: 'Synconis Labs',
  parentCompanyName: 'Synconis Logic Systems',
  /** Header sub-tagline shown beneath the course name */
  headerTagline:
    'an initiative from The Foundation for Applied Artificial Intelligence & Systems Design, a Synconis Labs venture',
  copyright: '© 2026 Synconis Logic Systems. All rights reserved.',
} as const;
