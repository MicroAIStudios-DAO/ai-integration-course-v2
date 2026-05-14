import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { useAuth } from "../../context/AuthContext";
import { useReCaptcha } from "../../hooks/useReCaptcha";
import {
  attachCheckoutSessionToCurrentUser,
  clearStoredPlanKey,
  fetchCheckoutSessionSummary,
  getCheckoutSessionIdFromSearch,
  getPlanKeyFromSearch,
  getStoredPlanKey,
  isPlanKey,
  startCheckoutForPlan,
  storePlanKey,
} from "../../utils/checkout";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { executeAndVerify, isLoaded } = useReCaptcha();
  const checkoutSessionId = getCheckoutSessionIdFromSearch(location.search);
  const [checkoutPlanKey, setCheckoutPlanKey] = useState<"explorer" | "pro" | "pro_trial" | "corporate" | null>(null);

  useEffect(() => {
    const planFromUrl = new URLSearchParams(location.search).get("plan");
    if (isPlanKey(planFromUrl)) {
      storePlanKey(planFromUrl);
    }
  }, [location.search]);

  useEffect(() => {
    if (!checkoutSessionId) return;

    let active = true;

    const loadCheckoutSummary = async () => {
      setLoadingSession(true);
      try {
        const summary = await fetchCheckoutSessionSummary(checkoutSessionId);
        if (!active) return;

        if (summary.isAttachedToCurrentUser) {
          clearStoredPlanKey();
          navigate("/welcome", { replace: true });
          return;
        }

        if (!summary.existingAccount && !summary.requiresLogin) {
          navigate(`/signup?checkout_session_id=${checkoutSessionId}`, { replace: true });
          return;
        }

        setCheckoutPlanKey(summary.planKey);
        setEmail(summary.email);
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
  }, [checkoutSessionId, navigate]);

  const intendedPlan = useMemo(() => {
    if (checkoutPlanKey) return checkoutPlanKey;
    return getPlanKeyFromSearch(location.search) || getStoredPlanKey();
  }, [checkoutPlanKey, location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLoaded) {
        const verification = await executeAndVerify("LOGIN");
        if (verification !== null && !verification.success) {
          // Score below 0.5 — likely bot or suspicious traffic. Block the attempt.
          setError("Security check failed. If you are human, please try again or contact info@aiintegrationcourse.com.");
          setLoading(false);
          return;
        }
      }
    } catch (recaptchaError) {
      // reCAPTCHA failed to load (e.g. ad blocker, network issue).
      // Allow the attempt but log for monitoring — do not block legitimate users.
      console.warn("reCAPTCHA verification failed, proceeding with login:", recaptchaError);
    }

    try {
      await login(email, password);

      if (checkoutSessionId) {
        await attachCheckoutSessionToCurrentUser(checkoutSessionId);
        clearStoredPlanKey();
        navigate("/welcome", { replace: true });
        return;
      }

      if (intendedPlan) {
        storePlanKey(intendedPlan);
        await startCheckoutForPlan(intendedPlan);
        return;
      }

      navigate("/courses");
    } catch (loginError: any) {
      setError(loginError?.message || "Failed to log in. Please check your credentials.");
    }

    setLoading(false);
  };

  const helperCopy = checkoutSessionId
    ? "Sign in with the same email you used in Stripe checkout so we can attach the purchase to your existing account."
    : "Sign in to continue your curriculum.";

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8 font-body">
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="max-w-md w-full bg-white/90 backdrop-blur p-8 sm:p-10 rounded-3xl shadow-xl border border-white/60">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            &larr; Home
          </Link>
          {!checkoutSessionId && (
            <Link
              to={intendedPlan ? `/pricing?plan=${intendedPlan}` : "/pricing"}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              New here? Choose a plan
            </Link>
          )}
        </div>

        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-headings font-extrabold text-gray-900">
            {checkoutSessionId ? "Attach your checkout" : "Welcome back"}
          </h2>
          <p className="mt-2 text-sm text-gray-600 font-body">{helperCopy}</p>
        </div>

        {loadingSession ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
            Verifying your Stripe checkout...
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px max-w-md mx-auto">
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  readOnly={Boolean(checkoutSessionId && email)}
                  className={`appearance-none rounded-none relative block w-full px-3 py-3 border placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm font-body ${checkoutSessionId && email ? "border-gray-200 bg-gray-50 text-gray-700" : "border-gray-300"}`}
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="relative">
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm font-body pr-12"
                  placeholder="Password"
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

            <div className="flex items-center justify-between mt-6">
              <div className="text-sm">
                <button
                  type="button"
                  className="font-medium text-blue-600 hover:text-blue-500 font-body bg-transparent border-none cursor-pointer p-0"
                  onClick={async () => {
                    try {
                      if (!email) {
                        setError("Enter your email above and try again.");
                        return;
                      }
                      const verification = await executeAndVerify("PASSWORD_RESET");
                      if (!verification?.success) {
                        setError("Security verification failed. Please try again.");
                        return;
                      }
                      const auth = getAuth();
                      await sendPasswordResetEmail(auth, email);
                      alert("Password reset email sent. Check your inbox.");
                    } catch (resetError: any) {
                      setError(resetError?.message || "Failed to send reset email");
                    }
                  }}
                >
                  Forgot your password?
                </button>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={loading || loadingSession}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-headings font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
              >
                {loading ? "Signing in..." : checkoutSessionId ? "Sign In & Attach Access" : "Sign in"}
              </button>
            </div>
          </form>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-4 mt-4">
            <p className="text-sm font-medium text-red-700 font-body">{error}</p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-center text-sm text-gray-600 font-body">
            {checkoutSessionId ? (
              <>
                New account?{" "}
                <Link to={`/signup?checkout_session_id=${checkoutSessionId}`} className="font-semibold text-blue-600 hover:text-blue-500 font-body">
                  Create it here
                </Link>
              </>
            ) : (
              <>
                Not a member yet?{" "}
                <Link to={intendedPlan ? `/pricing?plan=${intendedPlan}` : "/pricing"} className="font-semibold text-blue-600 hover:text-blue-500 font-body">
                  Choose your plan
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
