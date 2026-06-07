/**
 * CompetencyDashboard.tsx — Visual Knowledge Graph & Learning Path
 * 
 * Displays the student's personalized DAG path through the curriculum,
 * showing mastered nodes, current progress, and locked future content.
 * Integrates with the AdaptiveLearningContext.
 */

import React from 'react';
import { useAdaptiveLearning } from '../context/AdaptiveLearningContext';
import { CURRICULUM_GRAPH } from '../types/adaptiveLearning';
import type { CompetencyNode, NodeStatus } from '../types/adaptiveLearning';

// ─────────────────────────────────────────────────────────────────────────────
// Node Status Visual Config
// ─────────────────────────────────────────────────────────────────────────────

const statusConfig: Record<NodeStatus, { bg: string; border: string; text: string; icon: string }> = {
  locked: { bg: 'bg-slate-100', border: 'border-slate-200', text: 'text-slate-400', icon: '🔒' },
  available: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', icon: '▶️' },
  in_progress: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', icon: '🔄' },
  mastered: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', icon: '✅' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Progress Bar Component
// ─────────────────────────────────────────────────────────────────────────────

const ProgressBar: React.FC<{ score: number; status: NodeStatus }> = ({ score, status }) => {
  const colorMap: Record<NodeStatus, string> = {
    locked: 'bg-slate-200',
    available: 'bg-blue-400',
    in_progress: 'bg-amber-400',
    mastered: 'bg-green-500',
  };

  return (
    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${colorMap[status]}`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

const CompetencyDashboard: React.FC = () => {
  const { competencyGraph, studentProfile, isIntakeComplete } = useAdaptiveLearning();

  if (!isIntakeComplete) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <div className="text-4xl mb-4">🗺️</div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Your Learning Path</h3>
        <p className="text-sm text-slate-500 mb-4">
          Complete the intake diagnostic with your AI Mentor to unlock your personalized curriculum path.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-700">
          <span>🎯</span>
          <span>Start by asking the AI Mentor a question</span>
        </div>
      </div>
    );
  }

  if (!competencyGraph) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <div className="animate-pulse text-4xl mb-4">⏳</div>
        <p className="text-sm text-slate-500">Generating your personalized path...</p>
      </div>
    );
  }

  // Calculate overall progress
  const totalNodes = competencyGraph.nodes.length;
  const masteredNodes = competencyGraph.nodes.filter(n => n.status === 'mastered').length;
  const overallProgress = totalNodes > 0 ? Math.round((masteredNodes / totalNodes) * 100) : 0;

  // Get nodes in path order
  const orderedNodes: CompetencyNode[] = competencyGraph.currentPathIds
    .map(id => competencyGraph.nodes.find(n => n.nodeId === id))
    .filter((n): n is CompetencyNode => n !== undefined);

  // Nodes not in path (skipped based on profile)
  const skippedNodes = competencyGraph.nodes.filter(
    n => !competencyGraph.currentPathIds.includes(n.nodeId)
  );

  return (
    <div className="space-y-6">
      {/* Header with Overall Progress */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-indigo-50 to-blue-50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Your Learning Path</h3>
            {studentProfile && (
              <p className="text-sm text-slate-500 mt-0.5">
                Personalized for {studentProfile.industryContext} · {studentProfile.technicalVector} level
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-indigo-700">{overallProgress}%</p>
            <p className="text-xs text-slate-500">{masteredNodes}/{totalNodes} mastered</p>
          </div>
        </div>
        <div className="w-full h-3 bg-white/80 rounded-full overflow-hidden border border-slate-200">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-700"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Path Nodes */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide px-1">
          Your Path ({orderedNodes.length} modules)
        </h4>
        {orderedNodes.map((node, idx) => {
          const config = statusConfig[node.status];
          const curriculumNode = CURRICULUM_GRAPH.find(c => c.id === node.nodeId);

          return (
            <div
              key={node.nodeId}
              className={`relative rounded-lg border-2 p-4 transition-all ${config.bg} ${config.border} ${
                node.status === 'available' ? 'ring-2 ring-blue-200 ring-offset-2' : ''
              }`}
            >
              {/* Connection line */}
              {idx < orderedNodes.length - 1 && (
                <div className="absolute left-7 -bottom-3 w-0.5 h-3 bg-slate-200 z-10" />
              )}

              <div className="flex items-start gap-3">
                {/* Status Icon */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-sm">
                  {config.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h5 className={`text-sm font-semibold ${config.text}`}>
                      {node.title}
                    </h5>
                    {node.score > 0 && (
                      <span className={`text-xs font-medium ${config.text}`}>
                        {node.score}%
                      </span>
                    )}
                  </div>
                  {curriculumNode && (
                    <p className="text-xs text-slate-500 mt-0.5">{curriculumNode.description}</p>
                  )}
                  {node.attempts > 0 && (
                    <p className="text-[10px] text-slate-400 mt-1">
                      {node.attempts} attempt{node.attempts !== 1 ? 's' : ''}
                      {node.lastAttemptAt && ` · Last: ${new Date(node.lastAttemptAt).toLocaleDateString()}`}
                    </p>
                  )}
                  {node.status !== 'locked' && (
                    <div className="mt-2">
                      <ProgressBar score={node.score} status={node.status} />
                    </div>
                  )}
                </div>

                {/* Governance Badge */}
                {curriculumNode?.isGovernance && (
                  <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-medium bg-purple-100 text-purple-700 rounded-full border border-purple-200">
                    🛡️ Governance
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Skipped Nodes (if any) */}
      {skippedNodes.length > 0 && (
        <details className="rounded-lg border border-slate-200 bg-white">
          <summary className="px-4 py-3 text-xs font-medium text-slate-500 cursor-pointer hover:text-slate-700">
            {skippedNodes.length} module{skippedNodes.length !== 1 ? 's' : ''} skipped (not in your path)
          </summary>
          <div className="px-4 pb-3 space-y-2">
            {skippedNodes.map(node => (
              <div key={node.nodeId} className="flex items-center gap-2 text-xs text-slate-400">
                <span>⏭️</span>
                <span>{node.title}</span>
              </div>
            ))}
            <p className="text-[10px] text-slate-400 mt-2">
              These modules were skipped based on your profile. You can unlock them by updating your learning preferences.
            </p>
          </div>
        </details>
      )}
    </div>
  );
};

export default CompetencyDashboard;
