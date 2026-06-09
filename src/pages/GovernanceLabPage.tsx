/**
 * GovernanceLabPage.tsx — Route wrapper for /lab/:labId
 *
 * Loads lab configuration from Firestore, resolves lesson content,
 * and renders the GovernanceLab component with proper props including
 * the conceptGraphNode for competency tracking.
 */

import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import GovernanceLab from '../components/lab/GovernanceLab';

interface LabConfig {
  labId: string;
  lessonId: string;
  conceptGraphNode: string;  // DAG node ID for competency tracking
  title: string;
  description: string;
  flowiseUrl: string;
  premium: boolean;
}

const GovernanceLabPage: React.FC = () => {
  const { labId } = useParams<{ labId: string }>();
  const { currentUser } = useAuth();
  const [labConfig, setLabConfig] = useState<LabConfig | null>(null);
  const [lessonContent, setLessonContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!labId || !currentUser) return;

    const loadLab = async () => {
      try {
        // Load lab configuration from Firestore
        const labDoc = await getDoc(doc(db, 'labs', labId));
        if (!labDoc.exists()) {
          setError('Lab not found');
          setLoading(false);
          return;
        }

        const config = { labId, ...labDoc.data() } as LabConfig;
        setLabConfig(config);

        // Check user subscription status
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsSubscribed(
            userData?.isSubscribed === true ||
            userData?.premium === true ||
            userData?.role === 'admin'
          );
        }

        // Load associated lesson content (markdown)
        if (config.lessonId) {
          // Lesson content may be stored as a path reference or inline
          // Try fetching from the lessons collection first
          const parts = config.lessonId.split('/');
          const lessonRef = parts.length > 1
            ? doc(db, ...parts)
            : doc(db, 'lessons', config.lessonId);

          const lessonDoc = await getDoc(lessonRef);
          if (lessonDoc.exists()) {
            const data = lessonDoc.data();
            setLessonContent(data?.markdownContent || data?.content || data?.md || '');
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load lab');
      } finally {
        setLoading(false);
      }
    };

    loadLab();
  }, [labId, currentUser]);

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm text-slate-400">Loading Governance Lab...</p>
        </div>
      </div>
    );
  }

  if (error || !labConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center max-w-md">
          <p className="text-lg font-semibold text-slate-200 mb-2">Lab Not Found</p>
          <p className="text-sm text-slate-400">{error || 'This lab does not exist or has been moved.'}</p>
        </div>
      </div>
    );
  }

  // Render lesson content as JSX
  const renderedContent = (
    <div>
      <h1 className="text-2xl font-bold mb-4">{labConfig.title}</h1>
      <p className="text-slate-400 mb-6">{labConfig.description}</p>
      {lessonContent && (
        <div
          className="prose prose-invert prose-slate"
          dangerouslySetInnerHTML={{ __html: lessonContent }}
        />
      )}
    </div>
  );

  return (
    <GovernanceLab
      lessonId={labConfig.lessonId}
      labId={labConfig.labId}
      conceptGraphNode={labConfig.conceptGraphNode || labConfig.labId}
      lessonContent={renderedContent}
      flowiseUrl={labConfig.flowiseUrl}
      premium={labConfig.premium}
      hasAccess={!labConfig.premium || isSubscribed}
    />
  );
};

export default GovernanceLabPage;
