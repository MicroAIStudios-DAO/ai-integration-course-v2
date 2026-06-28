import React, { useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';

// ─── Types ──────────────────────────────────────────────────────────────────

interface CircleSpace {
  id: string;
  name: string;
  slug: string;
  description: string;
  isPrivate: boolean;
  accessible: boolean;
  requiresTier: string;
}

interface CircleDiscussionProps {
  /** The lesson or module context for discussion threading */
  contextId: string;
  /** Display title for the discussion section */
  title?: string;
  /** Which Circle space slug to embed (defaults to 'community') */
  spaceSlug?: string;
  /** Compact mode for sidebar embedding */
  compact?: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────────

const CircleDiscussion: React.FC<CircleDiscussionProps> = ({
  contextId,
  title = 'Community Discussion',
  spaceSlug = 'community',
  compact = false,
}) => {
  const { user } = useAuth();
  const [ssoUrl, setSsoUrl] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<CircleSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(!compact);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadCommunity = async () => {
      try {
        // Get SSO token and available spaces in parallel
        const [ssoResult, spacesResult] = await Promise.all([
          httpsCallable(functions, 'circleSSO')({}),
          httpsCallable(functions, 'circleGetSpaces')({}),
        ]);

        const ssoData = ssoResult.data as { communityUrl: string; tier: string };
        const spacesData = spacesResult.data as { spaces: CircleSpace[] };

        setSsoUrl(ssoData.communityUrl);
        setSpaces(spacesData.spaces);
      } catch (err: any) {
        // Non-fatal — community is an enhancement, not a blocker
        setError(err.message || 'Community unavailable');
      } finally {
        setLoading(false);
      }
    };

    loadCommunity();
  }, [user]);

  // ─── Not logged in ──────────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className={`${compact ? 'p-4' : 'p-6'} bg-slate-800/30 border border-slate-700/50 rounded-xl`}>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-slate-400 text-sm">
          Log in to join the community discussion for this lesson.
        </p>
      </div>
    );
  }

  // ─── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={`${compact ? 'p-4' : 'p-6'} bg-slate-800/30 border border-slate-700/50 rounded-xl`}>
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
          <span className="text-slate-400 text-sm">Loading community...</span>
        </div>
      </div>
    );
  }

  // ─── Error (non-fatal, show fallback) ───────────────────────────────────────

  if (error) {
    return (
      <div className={`${compact ? 'p-4' : 'p-6'} bg-slate-800/30 border border-slate-700/50 rounded-xl`}>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-slate-400 text-sm">
          Community features are being configured. Check back soon.
        </p>
      </div>
    );
  }

  // ─── Find the target space ──────────────────────────────────────────────────

  const targetSpace = spaces.find((s) => s.slug === spaceSlug);
  const isAccessible = targetSpace?.accessible ?? false;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={`${compact ? '' : 'mt-8'} bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="text-white font-semibold text-sm">{title}</h3>
            <p className="text-slate-500 text-xs">
              {targetSpace ? targetSpace.name : 'Community'} — {isAccessible ? 'Join the conversation' : 'Upgrade to access'}
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-slate-700/50 p-4">
          {isAccessible && ssoUrl ? (
            <div>
              {/* Embedded Circle discussion iframe */}
              <div className="rounded-lg overflow-hidden border border-slate-600/30 bg-slate-900/50">
                <iframe
                  src={`${ssoUrl}&space=${spaceSlug}&context=${contextId}`}
                  className="w-full border-0"
                  style={{ height: compact ? '300px' : '450px' }}
                  title={`${title} - Circle Community`}
                  allow="clipboard-write"
                  loading="lazy"
                />
              </div>

              {/* Open in new tab */}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Discussing: {contextId.replace(/-/g, ' ')}
                </span>
                <a
                  href={ssoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  Open full community
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-slate-400 text-sm mb-2">
                This discussion space requires the <strong className="text-white">{targetSpace?.requiresTier || 'Explorer'}</strong> tier.
              </p>
              <a
                href="/pricing"
                className="inline-flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300"
              >
                Upgrade to join →
              </a>
            </div>
          )}

          {/* Available Spaces Preview */}
          {!compact && spaces.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-700/30">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Your Spaces</p>
              <div className="flex flex-wrap gap-2">
                {spaces
                  .filter((s) => s.accessible)
                  .map((space) => (
                    <span
                      key={space.id}
                      className="text-xs px-2 py-1 bg-indigo-500/10 text-indigo-300 rounded-md"
                    >
                      {space.name}
                    </span>
                  ))}
                {spaces.filter((s) => !s.accessible).length > 0 && (
                  <span className="text-xs px-2 py-1 bg-slate-700/50 text-slate-500 rounded-md">
                    +{spaces.filter((s) => !s.accessible).length} locked
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CircleDiscussion;
