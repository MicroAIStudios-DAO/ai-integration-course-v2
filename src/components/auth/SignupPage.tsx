import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { updateProfile } from "firebase/auth";
import { useAuth } from "../../context/AuthContext";
import { useReCaptcha } from "../../hooks/useReCaptcha";
import { trackGoogleAdsSignupConversion, trackSignUp } from "../../utils/analytics";
import SEO from "../SEO";
import { getPlan } from "../../config/pricing";
import {
  attachCheckoutSessionToCurrentUser,
  clearStoredPlanKey,
  fetchCheckoutSessionSummary,
  getCheckoutSessionIdFromSearch,
} from "../../utils/checkout";
import { syncUserIdentityProfile } from "../../firebaseService";

const SignupPage: React.FC = () => {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const { signup, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { executeAndVerify, isLoaded } = useReCaptcha();
  const checkoutSessionId = getCheckoutSessionIdFromSearch(location.search);
  const [planKey, setPlanKey] = useState<"explorer" | "pro" | "corporate" | null>(null);

  const selectedPlan = useMemo(() => (planKey ? getPlan(planKey) : null), [planKey]);

  useEffect(() => {
    if (!checkoutSessionId) {
      navigate("/pricing", { replace: true });
      return;
    }

    let active = true;

    const loadCheckoutSummary = async () => {
      setLoadingSession(true);
      try {
        const summary = await fetchCheckoutSessionSummary(checkoutSessionId);
        if (!active) return;

        if (summary.isAttachedToCurrentUser || (currentUser && summary.attachedUid === currentUser.uid)) {
          clearStoredPlanKey();
          navigate("/welcome", { replace: true });
          return;
        }

        if (summary.existingAccount || summary.requiresLogin) {
          navigate(`/login?checkout_session_id=${checkoutSessionId}`, { replace: true });
          return;
        }

        setPlanKey(summary.planKey);
        setEmail(summary.email);
        setDisplayName(summary.displayName || "");
        setError(null);
      } catch (sessionError: any) {
        if (!active) return;
        setError(sessionError?.message || "We could not verify your checkout. Please try again.");
      } finally {
        if (active) {
          setLoadingSession(false);
        }
      }
    };

    void loadCheckoutSummary();

    return () => {
      active = false;
    };
  }, [checkoutSessionId, currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutSessionId || !email) {
      setError("Your checkout session is missing. Please return to pricing and try again.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      if (isLoaded) {
        const verification = await executeAndVerify("SIGNUP");
        if (verification && !verification.success) {
          console.warn("reCAPTCHA low score, proceeding anyway");
        }
      }
    } catch (recaptchaError) {
      console.warn("reCAPTCHA failed, proceeding:", recaptchaError);
    }

    try {
      const userCredential = await signup(email, password);
      const cleanDisplayName = displayName.trim();

      if (cleanDisplayName) {
        await updateProfile(userCredential.user, { displayName: cleanDisplayName });
      }

      await syncUserIdentityProfile(userCredential.user);
      await attachCheckoutSessionToCurrentUser(checkoutSessionId, cleanDisplayName || undefined);
      trackSignUp("Email");

      if (selectedPlan && selectedPlan.analyticsValue > 0) {
        trackGoogleAdsSignupConversion(selectedPlan.analyticsValue, "USD");
      }

      clearStoredPlanKey();
      navigate("/welcome", { replace: true });
      return;
    } catch (signupError: any) {
      if (signupError?.code === "auth/email-already-in-use") {
        setError("That email already has an account. Sign in to attach this checkout and continue.");
      } else {
        setError(signupError?.message || "Failed to secure your account. Please try again.");
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 py-8 px-4 sm:px-6 lg:px-8 font-body">
      <SEO
        title="Create Account"
        description="Finish account creation after checkout so your access, lessons, and billing stay attached to one permanent login."
        url="/signup"
        keywords={[
          "AI Integration Course account setup",
          "post checkout account creation",
          "secure account activation",
          "AI automation course enrollment",
        ]}
        author="Blaine Casey"
      />
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl" />

      <div className="max-w-md w-full bg-white/90 backdrop-blur p-8 sm:p-10 rounded-3xl shadow-xl border border-white/60">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            &larr; Home
          </Link>
          {checkoutSessionId && (
            <Link
              to={`/login?checkout_session_id=${checkoutSessionId}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
            >
              Already have an account?
            </Link>
          )}
        </div>

        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-headings font-extrabold text-gray-900">
            Create your login
          </h2>
          <p className="mt-2 text-sm text-gray-600 font-body">
            {selectedPlan
              ? `Checkout is complete for ${selectedPlan.name}. Add your username and password now so your access, progress, and billing stay on one account.`
              : "Checkout is complete. Add your username and password now so your access, progress, and billing stay on one account."}
          </p>
        </div>

        {loadingSession ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
            Verifying your Stripe checkout...
          </div>
        ) : (
          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="display-name" className="sr-only">Username</label>
                <input
                  id="display-name"
                  name="displayName"
                  type="text"
                  autoComplete="nickname"
                  required
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-body form-input"
                  placeholder="Username shown on your welcome page"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="email-address" className="sr-only">Email address</label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  readOnly
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-200 bg-gray-50 text-gray-700 rounded-md focus:outline-none sm:text-sm font-body"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="mt-2 text-xs text-gray-500">Sign-in will always use this Stripe checkout email.</p>
              </div>
              <div className="relative">
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-body pr-12"
                  placeholder="Password (min. 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M3 3l18 18" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10.5 10.5a2 2 0 0 0 3 3" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M7.1 7.1C5 8.5 3.6 10.6 3 12c1.6 3.6 5.2 6 9 6 1.2 0 2.3-.2 3.3-.6" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M14.9 14.9c2-1.4 3.5-3.5 4.1-4.9-1.6-3.6-5.2-6-9-6-1.2 0-2.3.2-3.3.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="3.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm font-medium text-red-700 font-body">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || loadingSession}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-headings font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 form-button"
            >
              {loading ? "Creating your login..." : "Create Login & Open Dashboard"}
            </button>
          </form>
        )}

        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Your payment step is already complete. This final step only creates the permanent login tied to that checkout email.
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
