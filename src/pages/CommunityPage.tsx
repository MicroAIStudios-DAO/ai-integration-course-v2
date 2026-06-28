import React, { useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

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

// ─── Component ──────────────────────────────────────────────────────────────

const CommunityPage: React.FC = () => {
  const { user } = useAuth();
  const [spaces, setSpaces] = useState<CircleSpace[]>([]);
  const [ssoUrl, setSsoUrl] = useState<string | null>(null);
  const [tier, setTier] = useState<string>('free');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadCommunityData = async () => {
      try {
        const [ssoResult, spacesResult] = await Promise.all([
          httpsCallable(functions, 'circleSSO')({}),
          httpsCallable(functions, 'circleGetSpaces')({}),
        ]);

        const ssoData = ssoResult.data as { communityUrl: string; tier: string };
        const spacesData = spacesResult.data as { spaces: CircleSpace[]; currentTier: string };

        setSsoUrl(ssoData.communityUrl);
        setSpaces(spacesData.spaces);
        setTier(spacesData.currentTier);
      } catch (err: any) {
        setError(err.message || 'Failed to load community data');
      } finally {
        setLoading(false);
      }
    };

    loadCommunityData();
  }, [user]);

  // ─── Not logged in ──────────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Join the AI Integration Community</h1>
          <p className="text-slate-300 text-lg mb-8">
            Connect with fellow AI practitioners, share your projects, get feedback on your governance implementations, 
            and participate in weekly challenges.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/login" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all">
              Log In
            </Link>
            <Link to="/signup" className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-all">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading community spaces...</p>
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  const accessibleSpaces = spaces.filter((s) => s.accessible);
  const lockedSpaces = spaces.filter((s) => !s.accessible);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Community</h1>
            <p className="text-slate-400">
              Your tier: <span className="text-indigo-400 font-medium capitalize">{tier}</span> — 
              {accessibleSpaces.length} spaces accessible
            </p>
          </div>
          {ssoUrl && (
            <a
              href={ssoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all flex items-center gap-2"
            >
              Open Full Community
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <p className="text-amber-400 text-sm">
              Community is being configured. Some features may be unavailable: {error}
            </p>
          </div>
        )}

        {/* Accessible Spaces */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4">Your Spaces</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accessibleSpaces.map((space) => (
              <a
                key={space.id}
                href={ssoUrl ? `${ssoUrl}&space=${space.slug}` : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-5 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center group-hover:bg-indigo-500/30 transition-colors">
                    {space.isPrivate ? (
                      <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                      </svg>
                    )}
                  </div>
                  <h3 className="text-white font-semibold text-sm">{space.name}</h3>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">{space.description}</p>
              </a>
            ))}
          </div>
        </div>

        {/* Locked Spaces */}
        {lockedSpaces.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Unlock More Spaces</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lockedSpaces.map((space) => (
                <div
                  key={space.id}
                  className="p-5 bg-slate-800/20 border border-slate-700/30 rounded-xl opacity-60"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-slate-700/50 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-slate-300 font-semibold text-sm">{space.name}</h3>
                      <span className="text-xs text-slate-500 capitalize">Requires {space.requiresTier}</span>
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed">{space.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl transition-all"
              >
                Upgrade to Unlock All Spaces
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityPage;
