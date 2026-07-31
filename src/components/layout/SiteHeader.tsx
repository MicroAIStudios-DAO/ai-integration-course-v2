import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BRAND } from '../../config/brand';
import { headerNavLinks, headerLoginLink, headerTrialLink } from '../../content/siteLinks';

/**
 * The single global header (Phase 3 of the Jul 2026 SEO plan).
 *
 * Replaces three divergent headers: the homepage's anchor-only nav, the
 * pricing header (which rendered "AI IntegrationCourse" with a missing
 * space), and Layout's dropdown menu. Every route now exposes the same
 * crawlable page links; the prerendered chrome in scripts/prerender-blogs.mjs
 * renders the same list from src/content/siteLinks.ts.
 */
const SiteHeader: React.FC = () => {
  const { currentUser } = useAuth();
  const isRegisteredUser = !!currentUser && !currentUser.isAnonymous;

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-semibold tracking-wide transition-colors ${
      isActive ? 'text-amber-400' : 'text-slate-300 hover:text-white'
    }`;

  return (
    <header className="relative z-20 border-b border-white/10 bg-slate-950/95 backdrop-blur-md font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="group flex-shrink-0">
            <span className="block text-lg font-headings font-extrabold leading-none text-white uppercase tracking-tight">
              {BRAND.courseName}
            </span>
            <span className="mt-1 block text-[10px] uppercase tracking-[0.25em] text-amber-500 font-semibold">
              {BRAND.academyShortName} · {BRAND.ventureName}
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden lg:flex items-center gap-6">
            {headerNavLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={navLinkClasses}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-4 flex-shrink-0">
            {isRegisteredUser ? (
              <Link
                to="/profile"
                className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                to={headerLoginLink.to}
                className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
              >
                {headerLoginLink.label}
              </Link>
            )}
            <Link
              to={headerTrialLink.to}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm transition-all shadow-md shadow-amber-500/10 hover:shadow-amber-400/20"
            >
              {headerTrialLink.label}
            </Link>
          </div>
        </div>

        {/* Small screens: same links, wrapped row instead of a hidden menu */}
        <nav
          aria-label="Primary mobile"
          className="lg:hidden mt-3 flex flex-wrap gap-x-4 gap-y-1"
        >
          {headerNavLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={navLinkClasses}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default SiteHeader;
