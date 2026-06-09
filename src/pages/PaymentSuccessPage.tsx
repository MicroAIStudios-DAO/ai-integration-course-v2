import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../config/firebase";
import {
  trackPurchase,
  trackGoogleAdsPurchaseConversion,
  setUserProperties,
} from "../utils/analytics";
import { plans, type PlanKey } from "../config/pricing";
import {
  type CheckoutSessionSummary,
  clearStoredPlanKey,
  fetchCheckoutSessionSummary,
  getCheckoutSessionIdFromSearch,
} from "../utils/checkout";

// ─── Fix 1: Provisioning States ─────────────────────────────────────────────
// The webhook can take 2-15 seconds to process. Instead of showing a stale
// "Free" state, we show a premium provisioning animation and wait for the
// Firestore `premium` field to flip via an onSnapshot listener.
type ProvisioningState = "loading" | "provisioning" | "provisioned" | "redirect" | "error";

const PROVISIONING_MESSAGES = [
  "Provisioning your AI Sandbox...",
  "Connecting your premium workspace...",
  "Activating your learning environment...",
  "Unlocking advanced modules...",
  "Almost there — finalizing your access...",
];

const PaymentSuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const checkoutSessionId = getCheckoutSessionIdFromSearch(location.search);
  const [provisioningState, setProvisioningState] = useState<ProvisioningState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [redirectTarget, setRedirectTarget] = useState<"signup" | "login" | "welcome" | null>(null);
  const [summary, setSummary] = useState<CheckoutSessionSummary | null>(null);
  const [provisioningMessage, setProvisioningMessage] = useState(PROVISIONING_MESSAGES[0]);

  const plan = useMemo(() => {
    if (summary) return plans[summary.planKey];
    const queryPlan = new URLSearchParams(location.search).get("plan") as PlanKey | null;
    return plans[queryPlan || "explorer"] || plans.explorer;
  }, [location.search, summary]);

  // ─── Fix 1: Rotate provisioning messages for perceived progress ────────────
  useEffect(() => {
    if (provisioningState !== "provisioning") return;
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % PROVISIONING_MESSAGES.length;
      setProvisioningMessage(PROVISIONING_MESSAGES[index]);
    }, 3000);
    return () => clearInterval(interval);
  }, [provisioningState]);

  // ─── Fix 1: onSnapshot listener for real-time premium detection ────────────
  // When the user is authenticated, we listen to their Firestore user doc.
  // The webhook will set `premium: true` and `subscriptionStatus: 'active'`.
  // Once detected, we transition to the "provisioned" state immediately.
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser || provisioningState === "provisioned" || provisioningState === "error") return;

    const userDocRef = doc(db, "users", currentUser.uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      (snapshot) => {
        const data = snapshot.data();
        if (data?.premium === true || data?.subscriptionStatus === "active") {
          setProvisioningState("provisioned");
        }
      },
      (err) => {
        console.warn("onSnapshot error (non-fatal):", err);
        // Don't block the flow — the redirect logic will still work via summary
      }
    );

    // Safety timeout: if webhook hasn't fired in 30s, proceed with redirect anyway
    const timeout = setTimeout(() => {
      if (provisioningState === "provisioning") {
        console.warn("Provisioning timeout — proceeding with redirect");
        setProvisioningState("provisioned");
      }
    }, 30000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [provisioningState]);

  // ─── Fix 1: Transition from "provisioned" to redirect ──────────────────────
  useEffect(() => {
    if (provisioningState !== "provisioned" || !summary) return;

    const timeoutId = setTimeout(() => {
      if (summary.isAttachedToCurrentUser) {
        navigate("/welcome", { replace: true });
      } else if (summary.requiresLogin || summary.existingAccount) {
        navigate(`/login?checkout_session_id=${checkoutSessionId}`, { replace: true });
      } else {
        navigate(`/signup?checkout_session_id=${checkoutSessionId}`, { replace: true });
      }
    }, 1500); // Brief pause to show the success state

    return () => clearTimeout(timeoutId);
  }, [provisioningState, summary, checkoutSessionId, navigate]);

  // ─── Load checkout summary from backend ────────────────────────────────────
  useEffect(() => {
    if (!checkoutSessionId) {
      setError("No checkout session ID was returned from Stripe.");
      setProvisioningState("error");
      return;
    }

    let active = true;

    const loadSummary = async () => {
      try {
        const nextSummary = await fetchCheckoutSessionSummary(checkoutSessionId);
        if (!active) return;
        setSummary(nextSummary);
        setError(null);

        // If user is already attached and premium, skip provisioning
        if (nextSummary.isAttachedToCurrentUser) {
          setProvisioningState("provisioned");
        } else {
          // Enter provisioning state — the onSnapshot listener will detect when premium flips
          setProvisioningState("provisioning");
        }
      } catch (summaryError: any) {
        if (!active) return;
        setError(summaryError?.message || "We could not verify your checkout yet.");
        setProvisioningState("error");
      }
    };

    void loadSummary();

    return () => {
      active = false;
    };
  }, [checkoutSessionId]);

  // ─── Analytics: Fallback tracking (fires immediately) ──────────────────────
  useEffect(() => {
    if (checkoutSessionId) {
      const fallbackKey = `checkout_analytics_fallback:${checkoutSessionId}`;
      if (!sessionStorage.getItem(fallbackKey)) {
        const queryPlan = new URLSearchParams(location.search).get("plan") as PlanKey | null;
        const estimatedPlan = plans[queryPlan || "explorer"] || plans.explorer;

        if (typeof window !== "undefined" && (window as any).dataLayer) {
          (window as any).dataLayer.push({
            event: "purchase",
            ecommerce: {
              transaction_id: checkoutSessionId,
              value: estimatedPlan.analyticsValue,
              currency: "USD",
            },
          });
        }

        trackPurchase(checkoutSessionId, estimatedPlan.analyticsValue, "USD", 0, estimatedPlan.name, queryPlan || ("explorer" as PlanKey));
        trackGoogleAdsPurchaseConversion(checkoutSessionId, estimatedPlan.analyticsValue, "");

        sessionStorage.setItem(fallbackKey, "true");
      }
    }
  }, [checkoutSessionId, location.search]);

  // ─── Analytics: Enhanced tracking with summary data ────────────────────────
  useEffect(() => {
    if (!summary) return;

    const analyticsKey = `checkout_analytics:${summary.sessionId}`;
    if (sessionStorage.getItem(analyticsKey)) {
      return;
    }

    const purchaseValue = summary.analyticsValue > 0 ? summary.analyticsValue : plan.analyticsValue;

    trackPurchase(summary.sessionId, purchaseValue, "USD", 0, summary.planName, summary.planKey);
    trackGoogleAdsPurchaseConversion(summary.sessionId, purchaseValue, summary.email);

    setUserProperties({
      subscription_status:
        summary.planKey === "corporate"
          ? "corporate"
          : summary.planKey === "explorer"
            ? "explorer"
            : "pro",
      signup_date: new Date().toISOString().split("T")[0],
    });

    sessionStorage.setItem(analyticsKey, "1");
    clearStoredPlanKey();
  }, [plan.analyticsValue, summary]);

  // ─── Redirect logic (for non-authenticated users) ──────────────────────────
  useEffect(() => {
    if (!summary || !checkoutSessionId) return;
    // Only redirect if we're NOT in provisioning state (authenticated users wait for onSnapshot)
    if (auth.currentUser && provisioningState === "provisioning") return;

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

    // Non-authenticated users redirect immediately (they'll create account first)
    if (!auth.currentUser) {
      const timeoutId = window.setTimeout(() => {
        navigate(destination, { replace: true });
      }, 900);
      return () => window.clearTimeout(timeoutId);
    }
  }, [checkoutSessionId, navigate, summary, provisioningState]);

  // ─── RENDER: Loading state ─────────────────────────────────────────────────
  if (provisioningState === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Confirming your Stripe checkout...</p>
        </div>
      </div>
    );
  }

  // ─── RENDER: Provisioning state (Fix 1 — the premium animation) ────────────
  if (provisioningState === "provisioning") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-indigo-950 flex items-center justify-center px-4">
        <div className="max-w-lg text-center">
          {/* Animated orbital rings */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-2 border-indigo-500/30 animate-ping" style={{ animationDuration: "3s" }}></div>
            <div className="absolute inset-2 rounded-full border-2 border-purple-500/40 animate-ping" style={{ animationDuration: "2.5s", animationDelay: "0.5s" }}></div>
            <div className="absolute inset-4 rounded-full border-2 border-blue-500/50 animate-ping" style={{ animationDuration: "2s", animationDelay: "1s" }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <svg className="w-8 h-8 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-3">Payment Confirmed</h1>
          <p className="text-indigo-200 text-lg mb-6 animate-pulse">{provisioningMessage}</p>

          {/* Progress bar */}
          <div className="w-64 mx-auto h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 rounded-full animate-[shimmer_2s_ease-in-out_infinite]"
              style={{
                width: "70%",
                animation: "shimmer 2s ease-in-out infinite",
              }}
            ></div>
          </div>

          <p className="mt-6 text-sm text-slate-400">
            This usually takes 5-10 seconds. Your workspace is being configured...
          </p>

          {summary && (
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Your Plan</p>
              <p className="mt-2 text-sm text-slate-200">Plan: {summary.planName}</p>
              <p className="mt-1 text-sm text-slate-200">Email: {summary.email}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── RENDER: Provisioned success state ─────────────────────────────────────
  if (provisioningState === "provisioned" && summary) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-emerald-950 flex items-center justify-center px-4">
        <div className="max-w-lg text-center">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce" style={{ animationDuration: "1s", animationIterationCount: "2" }}>
            <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Welcome to the Course</h1>
          <p className="text-emerald-200 text-lg mb-6">Your premium access is fully activated. Redirecting you now...</p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-400 mx-auto"></div>
        </div>
      </div>
    );
  }

  // ─── RENDER: Error state ───────────────────────────────────────────────────
  if (provisioningState === "error" || !summary) {
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

  // ─── RENDER: Fallback redirect state (non-authenticated) ───────────────────
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
        : `Stripe checkout is complete for ${summary.planName}. Your paid access is active. Next you will set your password so your billing, lessons, and progress stay attached to one account.`;

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
