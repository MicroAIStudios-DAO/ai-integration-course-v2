import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useReCaptcha } from "../../hooks/useReCaptcha";
import { trackSignUp } from "../../utils/analytics";
import SEO from "../SEO";
import { getPlan } from "../../config/pricing";
import { getStoredPlanKey, startCheckoutForPlan } from "../../utils/checkout";

const SignupPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signup, currentUser } = useAuth();
  const navigate = useNavigate();
  const { executeAndVerify, isLoaded } = useReCaptcha();
  const intendedPlan = getStoredPlanKey();
  const selectedPlan = intendedPlan ? getPlan(intendedPlan) : null;

  // Hydrate email from sessionStorage (set by landing page or pricing page)
  useEffect(() => {
    const savedEmail = sessionStorage.getItem('signup_email');
    if (savedEmail) {
      setEmail(savedEmail);
      sessionStorage.removeItem('signup_email');
    }
  }, []);

  useEffect(() => {
    if (!intendedPlan) {
      navigate('/pricing', { replace: true });
      return;
    }

    if (currentUser) {
      navigate('/pricing', { replace: true });
    }
  }, [currentUser, intendedPlan, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Try reCAPTCHA but don't block signup
    try {
      if (isLoaded) {
        const verification = await executeAndVerify('SIGNUP');
        if (verification && !verification.success) {
          console.warn("reCAPTCHA low score, proceeding anyway");
        }
      }
    } catch (recaptchaError) {
      console.warn("reCAPTCHA failed, proceeding:", recaptchaError);
    }

    try {
      await signup(email, password);
      trackSignUp('Email');
      if (!intendedPlan) {
        navigate('/pricing', { replace: true });
        return;
      }
      await startCheckoutForPlan(intendedPlan);
      return;
    } catch (err: any) {
      setError(err.message || "Failed to create an account. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 py-8 px-4 sm:px-6 lg:px-8 font-body">
      <SEO
        title="Create Account"
        description="Create your AI Integration Course account and continue directly to secure Stripe checkout for your selected plan."
        url="/signup"
        keywords={[
          'AI Integration Course checkout signup',
          'AI course account creation',
          'secure Stripe checkout',
          'AI automation course enrollment'
        ]}
        author="Blaine Casey"
      />
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl" />

      <div className="max-w-md w-full bg-white/90 backdrop-blur p-8 sm:p-10 rounded-3xl shadow-xl border border-white/60">
        {/* Login link — ELEVATED, top of card */}
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            &larr; Home
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
          >
            Already a member? Sign in
          </Link>
        </div>

        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-headings font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600 font-body">
            {selectedPlan
              ? `You picked ${selectedPlan.name}. Create your account and we will send you straight to secure checkout.`
              : 'Choose a plan first, then create your account to continue to checkout.'}
          </p>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm font-body form-input"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm font-body pr-12"
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
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-headings font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 form-button"
          >
            {loading ? "Creating account..." : "Create Account & Continue to Checkout"}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500 font-body">
          <span className="inline-flex items-center gap-1">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <path d="M7 11V8a5 5 0 0 1 10 0v3" />
            </svg>
            Secure Stripe checkout
          </span>
          <span className="h-3 w-px bg-gray-200" />
          <span>Plan selected before account creation</span>
        </div>

        <div className="mt-5 flex flex-col items-center gap-2 text-sm">
          <Link to="/pricing" className="font-medium text-blue-600 hover:text-blue-500">
            Back to pricing
          </Link>
        </div>

        {/* Login link repeated at bottom for scroll-down users */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-center text-sm text-gray-600 font-body">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500 font-body">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
