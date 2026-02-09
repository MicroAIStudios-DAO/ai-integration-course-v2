import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export type SubscriptionStatus = 
  | 'active' 
  | 'trialing' 
  | 'past_due' 
  | 'canceled' 
  | 'unpaid' 
  | 'incomplete' 
  | 'incomplete_expired'
  | 'none';

export type ContentTier = 'free' | 'premium';

interface PremiumAccessState {
  isPremium: boolean;
  isTrialing: boolean;
  hasAccess: boolean;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: Date | null;
  subscriptionEndsAt: Date | null;
  loading: boolean;
  error: Error | null;
}

interface LessonAccess {
  canAccess: boolean;
  reason: 'free' | 'premium' | 'trial' | 'no_access';
  upgradeRequired: boolean;
}

/**
 * Hook for checking user's premium access status
 * Listens to real-time updates from Firestore
 */
export function usePremiumAccess(): PremiumAccessState & {
  checkLessonAccess: (tier: ContentTier) => LessonAccess;
  refreshAccess: () => Promise<void>;
} {
  const { currentUser: user, loading: authLoading } = useAuth();
  const [state, setState] = useState<PremiumAccessState>({
    isPremium: false,
    isTrialing: false,
    hasAccess: false,
    subscriptionStatus: 'none',
    trialEndsAt: null,
    subscriptionEndsAt: null,
    loading: true,
    error: null,
  });

  // Fetch user premium status
  const fetchPremiumStatus = useCallback(async () => {
    if (!user) {
      setState(prev => ({
        ...prev,
        isPremium: false,
        isTrialing: false,
        hasAccess: false,
        subscriptionStatus: 'none',
        trialEndsAt: null,
        subscriptionEndsAt: null,
        loading: false,
        error: null,
      }));
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        setState(prev => ({
          ...prev,
          isPremium: false,
          isTrialing: false,
          hasAccess: false,
          subscriptionStatus: 'none',
          loading: false,
        }));
        return;
      }

      const userData = userDoc.data();
      const isPremium = userData.premium === true || userData.foundingMember === true;
      const subscriptionStatus = (userData.subscriptionStatus || 'none') as SubscriptionStatus;
      const isTrialing = subscriptionStatus === 'trialing';
      const isActive = subscriptionStatus === 'active';
      
      // Parse dates
      const trialEndsAt = userData.trialEndsAt?.toDate?.() || null;
      const subscriptionEndsAt = userData.subscriptionEndsAt?.toDate?.() || null;
      
      // Check if trial is still valid
      const trialValid = isTrialing && trialEndsAt && trialEndsAt > new Date();
      
      // User has access if premium, active subscription, or valid trial
      const hasAccess = isPremium || isActive || trialValid;

      setState({
        isPremium,
        isTrialing: trialValid || false,
        hasAccess,
        subscriptionStatus,
        trialEndsAt,
        subscriptionEndsAt,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching premium status:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error as Error,
      }));
    }
  }, [user]);

  // Set up real-time listener
  useEffect(() => {
    if (!user) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (snapshot) => {
        if (!snapshot.exists()) {
          setState(prev => ({
            ...prev,
            isPremium: false,
            isTrialing: false,
            hasAccess: false,
            subscriptionStatus: 'none',
            loading: false,
          }));
          return;
        }

        const userData = snapshot.data();
        const isPremium = userData.premium === true || userData.foundingMember === true;
        const subscriptionStatus = (userData.subscriptionStatus || 'none') as SubscriptionStatus;
        const isTrialing = subscriptionStatus === 'trialing';
        const isActive = subscriptionStatus === 'active';
        
        const trialEndsAt = userData.trialEndsAt?.toDate?.() || null;
        const subscriptionEndsAt = userData.subscriptionEndsAt?.toDate?.() || null;
        
        const trialValid = isTrialing && trialEndsAt && trialEndsAt > new Date();
        const hasAccess = isPremium || isActive || trialValid;

        setState({
          isPremium,
          isTrialing: trialValid || false,
          hasAccess,
          subscriptionStatus,
          trialEndsAt,
          subscriptionEndsAt,
          loading: false,
          error: null,
        });
      },
      (error) => {
        console.error('Error listening to premium status:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: error as Error,
        }));
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Check if user can access a specific lesson
  const checkLessonAccess = useCallback((tier: ContentTier): LessonAccess => {
    // Free lessons are always accessible
    if (tier === 'free') {
      return {
        canAccess: true,
        reason: 'free',
        upgradeRequired: false,
      };
    }

    // Premium lessons require access
    if (!state.hasAccess) {
      return {
        canAccess: false,
        reason: 'no_access',
        upgradeRequired: true,
      };
    }

    // User has premium access
    return {
      canAccess: true,
      reason: state.isPremium ? 'premium' : state.isTrialing ? 'trial' : 'premium',
      upgradeRequired: false,
    };
  }, [state.hasAccess, state.isPremium, state.isTrialing]);

  // Manual refresh function
  const refreshAccess = useCallback(async () => {
    await fetchPremiumStatus();
  }, [fetchPremiumStatus]);

  return {
    ...state,
    loading: authLoading || state.loading,
    checkLessonAccess,
    refreshAccess,
  };
}

/**
 * Simple hook to just check if user has premium access
 */
export function useHasPremiumAccess(): boolean {
  const { hasAccess, loading } = usePremiumAccess();
  return !loading && hasAccess;
}

/**
 * Hook to check access for a specific lesson
 */
export function useLessonAccess(tier: ContentTier): LessonAccess & { loading: boolean } {
  const { checkLessonAccess, loading } = usePremiumAccess();
  const access = checkLessonAccess(tier);
  
  return {
    ...access,
    loading,
  };
}

export default usePremiumAccess;
