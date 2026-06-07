/**
 * GovernanceLabPage.tsx — Route wrapper for the Governance Lab
 * 
 * Loads the lab configuration and lesson content, then renders
 * the GovernanceLab split-pane component.
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
  title: string;
  description: string;
  flowiseUrl: string;
  proofguardApiUrl: string;
  premium: boolean;
}

const GovernanceLabPage: React.FC = () => {
  const { labId } = useParams<{ labId: string }>();
  const { currentUser } = useAuth();
  // Subscription check is handled by Firestore rules; assume access if authenticated
  const isSubscribed = true; // TODO: Wire to actual subscription state from user doc
  const [labConfig, setLabConfig] = useState<LabConfig | null>(null);
  const [lessonContent, setLessonContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!labId) return;

    const loadLab = async () => {
      try {
        // Load lab configuration from Firestore
        const labDoc = await getDoc(doc(db, 'labs', labId));
        if (!labDoc.exists()) {
          setError('Lab not found');
          setLoading(false);
          return;
        }

        const config = labDoc.data() as LabConfig;
        setLabConfig(config);

        // Load associated lesson content
        if (config.lessonId) {
          const lessonDoc = await getDoc(doc(db, config.lessonId));
          if (lessonDoc.exists()) {
            const data = lessonDoc.data();
            setLessonContent(data?.md || data?.content || data?.markdownContent || '');
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load lab');
      } finally {
        setLoading(false);
      }
    };

    loadLab();
  }, [labId]);

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm text-slate-500">Loading Governance Lab...</p>
        </div>
      </div>
    );
  }

  if (error || !labConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md">
          <p className="text-lg font-semibold text-slate-800 mb-2">Lab Not Found</p>
          <p className="text-sm text-slate-500">{error || 'This lab does not exist or has been moved.'}</p>
        </div>
      </div>
    );
  }

  // Render lesson content as markdown (simplified — in production use a markdown renderer)
  const renderedContent = (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-4">{labConfig.title}</h1>
      <p className="text-slate-600 mb-6">{labConfig.description}</p>
      <div
        className="prose prose-slate"
        dangerouslySetInnerHTML={{ __html: lessonContent }}
      />
    </div>
  );

  return (
    <GovernanceLab
      lessonId={labConfig.lessonId}
      labId={labConfig.labId}
      lessonContent={renderedContent}
      flowiseUrl={labConfig.flowiseUrl}
      proofguardApiUrl={labConfig.proofguardApiUrl}
      premium={labConfig.premium}
      hasAccess={!labConfig.premium || isSubscribed}
    />
  );
};

export default GovernanceLabPage;
