/**
 * Community.tsx — Community Hub Page
 *
 * Route wrapper for /community. Displays the community dashboard
 * for authenticated users, or prompts sign-up for guests.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SEO } from '../components/SEO';
import CommunityDashboard from '../components/CommunityDashboard';

const CommunityPage: React.FC = () => {
  const { currentUser, loading } = useAuth();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm text-slate-400">Loading community...</p>
        </div>
      </div>
    );
  }

  // Guest CTA — encourage sign-up to access community
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SEO
          title="Community — AI Integration Course"
          description="Join a community of AI practitioners sharing insights, case studies, and implementation strategies."
          url="/community"
        />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 mb-6">
              <span className="text-3xl">🌐</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 font-headings">Join Our Learning Community</h1>
            <p className="mt-4 text-lg text-slate-600 max-w-xl mx-auto">
              Connect with fellow AI practitioners, participate in discussions, share your implementation wins, and learn from real-world case studies.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
              >
                Create Free Account
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Sign In
              </Link>
            </div>
            <p className="mt-6 text-xs text-slate-400">
              Already have an account? Sign in to access the community dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated user — show community dashboard
  return (
    <div className="min-h-screen bg-slate-50">
      <SEO
        title="Community — AI Integration Course"
        description="Your community hub for AI integration discussions, peer collaboration, and shared learning."
        url="/community"
      />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 font-headings">Community</h1>
          <p className="text-slate-500 mt-1">
            Collaborate, discuss, and grow with fellow AI practitioners.
          </p>
        </div>

        {/* Community Dashboard */}
        <CommunityDashboard />
      </div>
    </div>
  );
};

export default CommunityPage;
