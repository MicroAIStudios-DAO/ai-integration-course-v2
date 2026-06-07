/**
 * AdaptiveLearningContext.tsx
 * 
 * Provides the student's adaptive learning state (StudentProfile, CompetencyGraph)
 * to all components in the tree. Handles Firestore subscriptions and lab telemetry.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import type {
  StudentProfile,
  CompetencyGraph,
  LabTelemetry,
  TutorState,
} from '../types/adaptiveLearning';

// ─────────────────────────────────────────────────────────────────────────────
// Context Type
// ─────────────────────────────────────────────────────────────────────────────

interface AdaptiveLearningContextType {
  studentProfile: StudentProfile | null;
  competencyGraph: CompetencyGraph | null;
  currentTutorState: TutorState;
  labTelemetry: LabTelemetry | null;
  isIntakeComplete: boolean;
  loading: boolean;

  // Actions
  updateLabTelemetry: (telemetry: LabTelemetry) => void;
  markNodeMastered: (nodeId: string) => Promise<void>;
  resetIntake: () => Promise<void>;
}

const AdaptiveLearningContext = createContext<AdaptiveLearningContextType | undefined>(undefined);

export const useAdaptiveLearning = () => {
  const context = useContext(AdaptiveLearningContext);
  if (context === undefined) {
    throw new Error('useAdaptiveLearning must be used within an AdaptiveLearningProvider');
  }
  return context;
};

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  children: ReactNode;
}

export const AdaptiveLearningProvider: React.FC<Props> = ({ children }) => {
  const { currentUser } = useAuth();
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [competencyGraph, setCompetencyGraph] = useState<CompetencyGraph | null>(null);
  const [labTelemetry, setLabTelemetry] = useState<LabTelemetry | null>(null);
  const [currentTutorState, setCurrentTutorState] = useState<TutorState>('INTAKE');
  const [loading, setLoading] = useState(true);

  // Subscribe to user document for profile and competency graph
  useEffect(() => {
    if (!currentUser) {
      setStudentProfile(null);
      setCompetencyGraph(null);
      setLoading(false);
      return;
    }

    const userRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      const data = snapshot.data();
      if (data?.studentProfile) {
        setStudentProfile(data.studentProfile as StudentProfile);
      } else {
        setStudentProfile(null);
      }
      if (data?.competencyGraph) {
        setCompetencyGraph(data.competencyGraph as CompetencyGraph);
      } else {
        setCompetencyGraph(null);
      }
      setLoading(false);
    }, (error) => {
      console.error('AdaptiveLearning subscription error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Determine current tutor state based on available data
  useEffect(() => {
    if (!studentProfile) {
      setCurrentTutorState('INTAKE');
      return;
    }

    if (labTelemetry) {
      if (labTelemetry.consecutiveFailures >= 3) {
        setCurrentTutorState('INTERVENTION');
        return;
      }
      if (
        labTelemetry.completionTimeMs &&
        labTelemetry.averageCompletionTimeMs > 0 &&
        labTelemetry.completionTimeMs < labTelemetry.averageCompletionTimeMs * 0.5
      ) {
        setCurrentTutorState('CHALLENGE_MODE');
        return;
      }
      setCurrentTutorState('LAB_OBSERVATION');
      return;
    }

    if (!competencyGraph || competencyGraph.currentPathIds.length === 0) {
      setCurrentTutorState('PATH_GENERATION');
      return;
    }

    setCurrentTutorState('LESSON_ASSIST');
  }, [studentProfile, competencyGraph, labTelemetry]);

  const updateLabTelemetry = useCallback((telemetry: LabTelemetry) => {
    setLabTelemetry(telemetry);
  }, []);

  const markNodeMastered = useCallback(async (nodeId: string) => {
    if (!currentUser || !competencyGraph) return;

    const updatedNodes = competencyGraph.nodes.map(node => {
      if (node.nodeId === nodeId) {
        return { ...node, status: 'mastered' as const, score: 100 };
      }
      return node;
    });

    // Unlock next node in path
    const currentIdx = competencyGraph.currentPathIds.indexOf(nodeId);
    if (currentIdx >= 0 && currentIdx < competencyGraph.currentPathIds.length - 1) {
      const nextNodeId = competencyGraph.currentPathIds[currentIdx + 1];
      const nextNodeIdx = updatedNodes.findIndex(n => n.nodeId === nextNodeId);
      if (nextNodeIdx >= 0) {
        updatedNodes[nextNodeIdx] = { ...updatedNodes[nextNodeIdx], status: 'available' };
      }
    }

    const updatedGraph: CompetencyGraph = {
      ...competencyGraph,
      nodes: updatedNodes,
      updatedAt: new Date().toISOString(),
    };

    const userRef = doc(db, 'users', currentUser.uid);
    await setDoc(userRef, { competencyGraph: updatedGraph }, { merge: true });
  }, [currentUser, competencyGraph]);

  const resetIntake = useCallback(async () => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    await setDoc(userRef, {
      studentProfile: null,
      competencyGraph: null,
    }, { merge: true });
    setStudentProfile(null);
    setCompetencyGraph(null);
  }, [currentUser]);

  const isIntakeComplete = studentProfile !== null;

  const value: AdaptiveLearningContextType = {
    studentProfile,
    competencyGraph,
    currentTutorState,
    labTelemetry,
    isIntakeComplete,
    loading,
    updateLabTelemetry,
    markNodeMastered,
    resetIntake,
  };

  return (
    <AdaptiveLearningContext.Provider value={value}>
      {children}
    </AdaptiveLearningContext.Provider>
  );
};
