/**
 * CommunityDashboard.tsx — Community Hub Dashboard
 *
 * Displays community activity feed, discussion highlights, member stats,
 * and quick-access links for peer collaboration and learning groups.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface CommunityStats {
  totalMembers: number;
  activeThisWeek: number;
  discussionTopics: number;
  labsCompleted: number;
}

interface DiscussionHighlight {
  id: string;
  title: string;
  author: string;
  replies: number;
  tag: string;
  timeAgo: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Static Data (placeholder until Firestore integration)
// ─────────────────────────────────────────────────────────────────────────────

const COMMUNITY_STATS: CommunityStats = {
  totalMembers: 247,
  activeThisWeek: 89,
  discussionTopics: 156,
  labsCompleted: 1_024,
};

const DISCUSSION_HIGHLIGHTS: DiscussionHighlight[] = [
  {
    id: '1',
    title: 'Best practices for prompt engineering in production workflows',
    author: 'Sarah K.',
    replies: 12,
    tag: 'Prompt Engineering',
    timeAgo: '2h ago',
  },
  {
    id: '2',
    title: 'How I automated my team's reporting pipeline with GPT-4',
    author: 'Marcus T.',
    replies: 8,
    tag: 'Case Study',
    timeAgo: '5h ago',
  },
  {
    id: '3',
    title: 'Governance lab feedback: ProofGuard auditor module',
    author: 'Jamie L.',
    replies: 15,
    tag: 'Governance',
    timeAgo: '1d ago',
  },
  {
    id: '4',
    title: 'Tips for passing the AI Integration certification',
    author: 'Alex R.',
    replies: 21,
    tag: 'Certification',
    timeAgo: '2d ago',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Stat Card Component
// ─────────────────────────────────────────────────────────────────────────────

const StatCard: React.FC<{ label: string; value: number | string; icon: string }> = ({
  label,
  value,
  icon,
}) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5 text-center hover:border-indigo-200 hover:shadow-sm transition-all">
    <span className="text-2xl block mb-2">{icon}</span>
    <p className="text-2xl font-bold text-slate-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
    <p className="text-xs font-medium text-slate-500 mt-1">{label}</p>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Discussion Item Component
// ─────────────────────────────────────────────────────────────────────────────

const DiscussionItem: React.FC<{ item: DiscussionHighlight }> = ({ item }) => (
  <div className="flex items-start gap-4 rounded-lg border border-slate-200 bg-white p-4 hover:border-indigo-200 hover:shadow-sm transition-all">
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700">
      {item.author.charAt(0)}
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="text-sm font-semibold text-slate-800 leading-snug">{item.title}</h4>
      <div className="flex items-center gap-3 mt-2">
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
          {item.tag}
        </span>
        <span className="text-[11px] text-slate-400">{item.author}</span>
        <span className="text-[11px] text-slate-400">·</span>
        <span className="text-[11px] text-slate-400">{item.timeAgo}</span>
      </div>
    </div>
    <div className="flex-shrink-0 flex items-center gap-1 text-slate-400">
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      <span className="text-xs font-medium">{item.replies}</span>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

const CommunityDashboard: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Welcome to the Community{currentUser?.displayName ? `, ${currentUser.displayName}` : ''}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Connect with fellow AI practitioners, share insights, and accelerate your learning journey.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="inline-flex h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-700">{COMMUNITY_STATS.activeThisWeek} active this week</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="👥" label="Total Members" value={COMMUNITY_STATS.totalMembers} />
        <StatCard icon="🔥" label="Active This Week" value={COMMUNITY_STATS.activeThisWeek} />
        <StatCard icon="💬" label="Discussion Topics" value={COMMUNITY_STATS.discussionTopics} />
        <StatCard icon="🧪" label="Labs Completed" value={COMMUNITY_STATS.labsCompleted} />
      </div>

      {/* Discussion Highlights */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Trending Discussions</h3>
          <Link to="/community" className="text-xs font-medium text-indigo-600 hover:underline">View all →</Link>
        </div>
        <div className="space-y-3">
          {DISCUSSION_HIGHLIGHTS.map((item) => (
            <DiscussionItem key={item.id} item={item} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/tutor"
          className="rounded-xl border border-slate-200 bg-white p-5 text-center hover:border-indigo-300 hover:shadow-sm transition-all group"
        >
          <span className="text-3xl block mb-3 group-hover:scale-110 transition-transform">🧠</span>
          <p className="text-sm font-semibold text-slate-800">Ask the AI Mentor</p>
          <p className="text-xs text-slate-500 mt-1">Get instant help with course material</p>
        </Link>
        <Link
          to="/courses"
          className="rounded-xl border border-slate-200 bg-white p-5 text-center hover:border-indigo-300 hover:shadow-sm transition-all group"
        >
          <span className="text-3xl block mb-3 group-hover:scale-110 transition-transform">📚</span>
          <p className="text-sm font-semibold text-slate-800">Browse Courses</p>
          <p className="text-xs text-slate-500 mt-1">Continue your learning path</p>
        </Link>
        <Link
          to="/library"
          className="rounded-xl border border-slate-200 bg-white p-5 text-center hover:border-indigo-300 hover:shadow-sm transition-all group"
        >
          <span className="text-3xl block mb-3 group-hover:scale-110 transition-transform">📖</span>
          <p className="text-sm font-semibold text-slate-800">Resource Library</p>
          <p className="text-xs text-slate-500 mt-1">Templates, guides, and tools</p>
        </Link>
      </div>

      {/* Community Guidelines */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h4 className="text-sm font-semibold text-slate-700 mb-2">Community Guidelines</h4>
        <ul className="space-y-1.5 text-xs text-slate-500">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
            Be respectful and constructive in all discussions
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
            Share real-world examples and case studies when possible
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
            Help fellow members — teaching deepens your own understanding
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
            No self-promotion or spam — focus on learning and collaboration
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CommunityDashboard;
