/**
 * DashboardPage.tsx — Student Learning Dashboard
 * 
 * Shows the student's personalized competency graph, learning path progress,
 * and quick access to their next available lab or lesson.
 */

import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAdaptiveLearning } from '../context/AdaptiveLearningContext';
// Note: subscription state is managed via Firestore user doc, not AuthContext
import CompetencyDashboard from '../components/CompetencyDashboard';

const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { isIntakeComplete, competencyGraph, studentProfile } = useAdaptiveLearning();

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to diagnostic if intake not complete
  if (!isIntakeComplete) {
    return <Navigate to="/diagnostic" replace />;
  }

  // Find the next available node for quick action
  const nextNode = competencyGraph?.nodes.find(n => n.status === 'available');
  const inProgressNode = competencyGraph?.nodes.find(n => n.status === 'in_progress');
  const activeNode = inProgressNode || nextNode;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Your Learning Dashboard</h1>
          {studentProfile && (
            <p className="text-slate-500 mt-1">
              Personalized for {studentProfile.industryContext} professionals
            </p>
          )}
        </div>

        {/* Quick Action Card */}
        {activeNode && (
          <div className="mb-6 rounded-xl border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-1">
                  {inProgressNode ? 'Continue where you left off' : 'Up next'}
                </p>
                <h3 className="text-lg font-semibold text-slate-800">{activeNode.title}</h3>
                {activeNode.score > 0 && (
                  <p className="text-sm text-slate-500 mt-0.5">{activeNode.score}% complete</p>
                )}
              </div>
              <Link
                to={activeNode.nodeId.includes('governance') || activeNode.nodeId.includes('proofguard') || activeNode.nodeId.includes('compliance')
                  ? `/lab/${activeNode.nodeId}`
                  : `/courses/ai-101/modules/core/lessons/${activeNode.nodeId}`
                }
                className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {inProgressNode ? 'Continue' : 'Start'}
              </Link>
            </div>
          </div>
        )}

        {/* Competency Dashboard */}
        <CompetencyDashboard />

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <Link
            to="/diagnostic"
            className="rounded-lg border border-slate-200 bg-white p-4 text-center hover:border-indigo-300 hover:shadow-sm transition-all"
          >
            <span className="text-2xl mb-2 block">🎯</span>
            <p className="text-xs font-medium text-slate-700">Recalibrate Profile</p>
          </Link>
          <Link
            to="/certification"
            className="rounded-lg border border-slate-200 bg-white p-4 text-center hover:border-indigo-300 hover:shadow-sm transition-all"
          >
            <span className="text-2xl mb-2 block">🏆</span>
            <p className="text-xs font-medium text-slate-700">Certifications</p>
          </Link>
          <Link
            to="/tutor"
            className="rounded-lg border border-slate-200 bg-white p-4 text-center hover:border-indigo-300 hover:shadow-sm transition-all"
          >
            <span className="text-2xl mb-2 block">🧠</span>
            <p className="text-xs font-medium text-slate-700">AI Mentor</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
