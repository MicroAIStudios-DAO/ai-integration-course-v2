import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  trackCustomEvent,
  trackProTrialValue,
  trackPurchase,
  setUserProperties,
} from "../utils/analytics";
import { plans, type PlanKey } from "../config/pricing";
import {
  clearStoredPlanKey,
  fetchCheckoutSessionSummary,
  getCheckoutSessionIdFromSearch,
} from "../utils/checkout";

const PaymentSuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const checkoutSessionId = getCheckoutSessionIdFromSearch(location.search);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirectTarget, setRedirectTarget] = useState<"signup" | "login" | "welcome" | null>(null);
  const [summary, setSummary] = useState<{
    sessionId: string;
    email: string;
    displayName: string | null;
    planKey: PlanKey;
    planName: string;
    status: string;
    existingAccount: boolean;
    attachedUid: string | null;
    isAttachedToCurrentUser: boolean;
    requiresLogin: boolean;
  } | null>(null);

  const plan = useMemo(() => {
    if (summary) return plans[summary.planKey];
    const queryPlan = new URLSearchParams(location.search).get("plan") as PlanKey | null;
    return plans[queryPlan || "explorer"] || plans.explorer;
  }, [location.search, summary]);

  useEffect(() => {
    if (!checkoutSessionId) {
      setError("No checkout session ID was returned from Stripe.");
      setLoading(false);
      return;
    }

    let active = true;

    const loadSummary = async () => {
      try {
        const nextSummary = await fetchCheckoutSessionSummary(checkoutSessionId);
        if (!active) return;
        setSummary(nextSummary);
        setError(null);
      } catch (summaryError: any) {
        if (!active) return;
        setError(summaryError?.message || "We could not verify your checkout yet.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadSummary();

    return () => {
      active = false;
    };
  }, [checkoutSessionId]);

  useEffect(() => {
    if (!summary) return;

    const analyticsKey = `checkout_analytics:${summary.sessionId}`;
    if (sessionStorage.getItem(analyticsKey)) {
      return;
    }

    const isTrial = summary.planKey === "explorer" || summary.planKey === "pro";

    if (isTrial) {
      trackCustomEvent("subscription", "trial_start", summary.planKey);
      if (summary.planKey === "pro") {
        trackProTrialValue(summary.sessionId);
      }
      setUserProperties({
        subscription_status: "trial",
        signup_date: new Date().toISOString().split("T")[0],
      });
    } else {
      trackPurchase(summary.sessionId, plan.analyticsValue, "USD", 0, plan.name, summary.planKey);
      setUserProperties({
        subscription_status: summary.planKey === "corporate" ? "corporate" : "pro",
        signup_date: new Date().toISOString().split("T")[0],
      });
    }

    sessionStorage.setItem(analyticsKey, "1");
    clearStoredPlanKey();
  }, [plan.analyticsValue, plan.name, summary]);

  useEffect(() => {
    if (!summary || !checkoutSessionId) return;

    let target: "signup" | "login" | "welcome" = "signup";
    let destination = `/signup?checkout_session_id=${checkoutSessionId}`;

    if (summary.isAttachedToCurrentUser) {
      target = "welcome";
      destination = "/welcome";
    } else if (summary.requiresLogin || summary.existingAccount) {
      target = "login";
      destination = `/login?checkout_session_id=${checkoutSessionId}`;
    }

    setRedirectTarget(target);
    const timeoutId = window.setTimeout(() => {
      navigate(destination, { replace: true });
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [checkoutSessionId, navigate, summary]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Confirming your Stripe checkout...</p>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center p-8 bg-slate-800/50 rounded-2xl border border-red-500/20">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-400 mb-4">Checkout Verification Error</h1>
          <p className="text-gray-400 mb-6">{error || "We could not verify your checkout."}</p>
          <Link to="/pricing" className="inline-flex items-center px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
            Return to pricing
          </Link>
        </div>
      </div>
    );
  }

  const heading =
    redirectTarget === "welcome"
      ? "Checkout confirmed"
      : redirectTarget === "login"
        ? "Sign in to attach your access"
        : "Set your password to unlock access";

  const body =
    redirectTarget === "welcome"
      ? "Your account is already connected to this checkout. Taking you to your welcome dashboard now."
      : redirectTarget === "login"
        ? `We found an existing account for ${summary.email}. Sign in next so this paid checkout lands on the right login.`
        : `Stripe checkout is complete for ${summary.planName}. Next you will set your password so your billing, lessons, and progress stay attached to one account.`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-lg rounded-2xl border border-emerald-400/20 bg-slate-900/70 p-8 text-center text-slate-100">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">{heading}</h1>
        <p className="text-slate-300 leading-7">{body}</p>
        <p className="mt-3 text-sm text-slate-500">Session ID: {summary.sessionId}</p>
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Checkout Summary</p>
          <p className="mt-2 text-sm text-slate-200">Plan: {summary.planName}</p>
          <p className="mt-1 text-sm text-slate-200">Email: {summary.email}</p>
          <p className="mt-1 text-sm text-slate-200">Status: {summary.status}</p>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {redirectTarget === "login" ? (
            <Link
              to={`/login?checkout_session_id=${summary.sessionId}`}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-400 px-6 py-3 font-semibold text-slate-950 transition-colors hover:bg-emerald-300"
            >
              Sign in now
            </Link>
          ) : redirectTarget === "welcome" ? (
            <Link
              to="/welcome"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-400 px-6 py-3 font-semibold text-slate-950 transition-colors hover:bg-emerald-300"
            >
              Open welcome page
            </Link>
          ) : (
            <Link
              to={`/signup?checkout_session_id=${summary.sessionId}`}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-400 px-6 py-3 font-semibold text-slate-950 transition-colors hover:bg-emerald-300"
            >
              Set your password
            </Link>
          )}
          <Link
            to="/pricing"
            className="inline-flex items-center justify-center rounded-lg border border-white/15 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/5"
          >
            Review plans
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
