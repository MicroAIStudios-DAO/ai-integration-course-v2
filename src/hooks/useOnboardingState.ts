/**
 * useOnboardingState.ts
 * 
 * Manages the onboarding tour state for the current user.
 * Persists to Firestore (users/{uid}) so the tour doesn't repeat across sessions.
 * Falls back to localStorage for anonymous browsing.
 */

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export interface OnboardingState {
  /** Whether the tour has been completed */
  tourCompleted: boolean;
  /** Whether the tour was skipped */
  tourSkipped: boolean;
  /** Whether the tour should be shown (first-time user who hasn't completed/skipped) */
  shouldShowTour: boolean;
  /** Loading state */
  loading: boolean;
  /** Mark the tour as completed */
  completeTour: () => Promise<void>;
  /** Mark the tour as skipped */
  skipTour: () => Promise<void>;
  /** Reset tour state so it can be relaunched */
  resetTour: () => Promise<void>;
}

const LOCAL_STORAGE_KEY = 'aic_onboarding_state';

export function useOnboardingState(): OnboardingState {
  const { currentUser } = useAuth();
  const [tourCompleted, setTourCompleted] = useState(false);
  const [tourSkipped, setTourSkipped] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load state from Firestore or localStorage
  useEffect(() => {
    const loadState = async () => {
      setLoading(true);

      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            setTourCompleted(data.onboardingTourCompleted === true);
            setTourSkipped(data.onboardingTourSkipped === true);
          } else {
            // New user — no doc yet
            setTourCompleted(false);
            setTourSkipped(false);
          }
        } catch (err) {
          console.warn('Failed to load onboarding state from Firestore:', err);
          // Fall back to localStorage
          loadFromLocalStorage();
        }
      } else {
        loadFromLocalStorage();
      }

      setLoading(false);
    };

    const loadFromLocalStorage = () => {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setTourCompleted(parsed.tourCompleted === true);
          setTourSkipped(parsed.tourSkipped === true);
        }
      } catch {
        // Ignore parse errors
      }
    };

    loadState();
  }, [currentUser]);

  const persistState = useCallback(async (completed: boolean, skipped: boolean) => {
    if (currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(userRef, {
          onboardingTourCompleted: completed,
          onboardingTourSkipped: skipped,
          ...(completed ? { onboardingTourCompletedAt: new Date() } : {}),
        }, { merge: true });
      } catch (err) {
        console.warn('Failed to persist onboarding state to Firestore:', err);
      }
    }

    // Always also save to localStorage as backup
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
        tourCompleted: completed,
        tourSkipped: skipped,
      }));
    } catch {
      // Ignore storage errors
    }
  }, [currentUser]);

  const completeTour = useCallback(async () => {
    setTourCompleted(true);
    setTourSkipped(false);
    await persistState(true, false);
  }, [persistState]);

  const skipTour = useCallback(async () => {
    setTourSkipped(true);
    await persistState(false, true);
  }, [persistState]);

  const resetTour = useCallback(async () => {
    setTourCompleted(false);
    setTourSkipped(false);
    await persistState(false, false);
  }, [persistState]);

  const shouldShowTour = !loading && !tourCompleted && !tourSkipped;

  return {
    tourCompleted,
    tourSkipped,
    shouldShowTour,
    loading,
    completeTour,
    skipTour,
    resetTour,
  };
}
