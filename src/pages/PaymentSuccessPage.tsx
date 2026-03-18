import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserProfile } from '../firebaseService';
import { UserProfile } from '../types/course';
import { trackPurchase, setUserProperties } from '../utils/analytics';

const PaymentSuccessPage: React.FC = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const sId = queryParams.get('session_id');
    setSessionId(sId);

    if (sId) {
      // Track purchase event (GA4)
      // NOTE: Server-side tracking via Stripe webhook is preferred for accuracy
      // This is a fallback for client-side tracking
      trackPurchase(
        sId,           // transaction_id
        49,            // value (Pro plan price)
        'USD',         // currency
        0,             // tax
        'Pro Plan',    // plan name
        'pro_monthly'  // plan id
      );

      // Update user properties for audience segmentation
      setUserProperties({
        subscription_status: 'pro',
        signup_date: new Date().toISOString().split('T')[0],
      });

      setLoading(false);
    } else {
      setError("No session ID found. Payment status cannot be confirmed.");
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      if (!currentUser) {
        setProfile(null);
        return;
      }

      try {
        const nextProfile = await getUserProfile(currentUser.uid);
        if (active) {
          setProfile(nextProfile);
        }
      } catch (profileError) {
        console.error('Failed to load payment success profile:', profileError);
      }
    };

    void loadProfile();
    return () => {
      active = false;
    };
  }, [currentUser]);

  const isPioneerCohort = useMemo(() => profile?.isBetaTester === true, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Confirming your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8 bg-slate-800/50 rounded-2xl border border-red-500/20">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-400 mb-4">Payment Verification Error</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link 
            to="/" 
            className="inline-flex items-center px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
      <div className="max-w-lg mx-auto text-center p-8 bg-slate-800/50 rounded-2xl border border-green-500/20">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-white mb-4">
          {isPioneerCohort ? 'Vanguard Access Confirmed' : 'Welcome to Pro! 🎉'}
        </h1>
        <p className="text-gray-300 mb-2">
          {isPioneerCohort
            ? 'Your $49/mo founding rate is active. The Pioneer cohort tag now unlocks the paid dashboard, feedback lane, and build path.'
            : 'Your payment was successful and your account has been upgraded.'}
        </p>
        <p className="text-sm text-gray-500 mb-6">Transaction ID: {sessionId}</p>

        {isPioneerCohort && (
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-semibold text-cyan-300 mb-2">Founder's Scholarship Layer</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>$50 in builder credits is the gift, not free site access.</li>
              <li>Use the credits to reduce the cost of Gemini, search, and experimentation in the first month.</li>
              <li>Complete the first 4 modules and a 15-minute feedback call to earn month 2 back as a credit.</li>
            </ul>
          </div>
        )}

        {/* 14-Day Guarantee Reminder */}
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">🛡️</span>
            <span className="font-semibold text-indigo-400">14-Day Build-Your-First-Bot Guarantee</span>
          </div>
          <p className="text-sm text-gray-400">
            Build your first working bot in 14 days or get a full refund. No questions asked.
          </p>
        </div>

        {/* Next Steps */}
        <div className="bg-slate-700/50 rounded-xl p-4 mb-6 text-left">
          <h3 className="font-semibold text-white mb-3">🚀 Your Next Steps:</h3>
          <ol className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="bg-indigo-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              <span>{isPioneerCohort ? 'Open the Vanguard dashboard and launch Content Architect v1.1' : 'Start the "Build Your First Bot" lesson to claim your guarantee'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-indigo-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              <span>{isPioneerCohort ? 'Request your builder-credit pack and begin the first implementation sprint' : 'Set up your AI tools (Gmail, Zapier, OpenAI)'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-indigo-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
              <span>{isPioneerCohort ? 'Complete 4 modules and book the 15-minute feedback call to earn your month 2 credit' : 'Deploy your first customer service email bot'}</span>
            </li>
          </ol>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link 
            to={isPioneerCohort ? "/welcome" : "/courses"} 
            className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors"
          >
            {isPioneerCohort ? 'Open Vanguard Dashboard →' : 'Start Building Now →'}
          </Link>
          <Link 
            to="/" 
            className="inline-flex items-center justify-center px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
