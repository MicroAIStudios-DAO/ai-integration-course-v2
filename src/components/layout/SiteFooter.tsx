import React from 'react';
import { Link } from 'react-router-dom';
import { BRAND } from '../../config/brand';
import { footerAiDisclosure, footerColumns } from '../../content/siteLinks';

/**
 * The single global footer (Phase 3 of the Jul 2026 SEO plan).
 *
 * Replaces three divergent footers (homepage 5-link strip, pricing's
 * "© 2025 AI Integration Course", Layout's inline footer) and links every
 * page the audit found orphaned. Link data lives in
 * src/content/siteLinks.ts, shared with the prerendered chrome.
 */
const SiteFooter: React.FC = () => (
  <footer className="bg-slate-950 text-white border-t border-white/10 font-sans">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {footerColumns.map((column) => (
          <div key={column.heading}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 mb-3">
              {column.heading}
            </p>
            <ul className="space-y-2">
              {column.links.map((link) => (
                <li key={`${column.heading}-${link.to}`}>
                  <Link
                    to={link.to}
                    className="text-sm text-slate-300 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-10 pt-6 border-t border-white/10 text-xs text-slate-400 space-y-3">
        <p>{footerAiDisclosure}</p>
        <p>
          {BRAND.copyright} {BRAND.courseName} is offered by {BRAND.academyName}, a{' '}
          {BRAND.ventureName} venture.
        </p>
      </div>
    </div>
  </footer>
);

export default SiteFooter;
