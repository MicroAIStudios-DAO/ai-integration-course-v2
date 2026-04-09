import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // Corrected path
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { useReCaptcha } from "../../hooks/useReCaptcha";
import { getPlanKeyFromSearch, getStoredPlanKey, isPlanKey, startCheckoutForPlan, storePlanKey } from "../../utils/checkout";
// ReactPlayer removed from login — keeps the page lightweight for returning users

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Master access removed for production launch
  const { login } = useAuth(); // Use AuthContext
  const navigate = useNavigate();
  const location = useLocation();
  const { executeAndVerify, isLoaded } = useReCaptcha();

  // P1 FIX: On mount, read ?plan= from the URL (set by /start login link and pricing page)
  // and persist it to sessionStorage so post-login checkout knows which plan to open.
  // This ensures returning users who click "Log in" from /start are routed to checkout.
  useEffect(() => {
    const planFromUrl = new URLSearchParams(location.search).get('plan');
    if (isPlanKey(planFromUrl)) {
      storePlanKey(planFromUrl);
    }
  }, [location.search]);
  const intendedPlan = getPlanKeyFromSearch(location.search) || getStoredPlanKey();
  // Video removed from login — keeps page fast for returning users

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Try reCAPTCHA verification but don't block login if it fails
    try {
      if (isLoaded) {
        const verification = await executeAndVerify('LOGIN');
        if (verification && !verification.success) {
          console.warn("reCAPTCHA verification returned low score, proceeding anyway");
        }
      }
    } catch (recaptchaError) {
      console.warn("reCAPTCHA verification failed, proceeding with login:", recaptchaError);
    }

    try {
      await login(email, password);
      if (intendedPlan) {
        storePlanKey(intendedPlan);
        await startCheckoutForPlan(intendedPlan);
        return;
      }
      navigate("/courses");
    } catch (err: any) {
      setError(err.message || "Failed to log in. Please check your credentials.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8 font-body">
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="max-w-md w-full bg-white/90 backdrop-blur p-8 sm:p-10 rounded-3xl shadow-xl border border-white/60">
        {/* Top navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            &larr; Home
          </Link>
          <Link
            to={intendedPlan ? `/pricing?plan=${intendedPlan}` : "/pricing"}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            New here? Choose a plan
          </Link>
        </div>

        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-headings font-extrabold text-gray-900">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-gray-600 font-body">
            Sign in to continue your curriculum.
          </p>
        </div>
        {/* Regular Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <input type="hidden" name="remember" defaultValue="true" />
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
                  className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm font-body"
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
                      if (!email) { setError('Enter your email above and try again.'); return; }
                      const verification = await executeAndVerify('PASSWORD_RESET');
                      if (!verification?.success) {
                        setError('Security verification failed. Please try again.');
                        return;
                      }
                      const auth = getAuth();
                      await sendPasswordResetEmail(auth, email);
                      alert('Password reset email sent. Check your inbox.');
                    } catch (e:any) {
                      setError(e?.message || 'Failed to send reset email');
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
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-headings font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </div>
        </form>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mt-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm font-medium text-red-700 font-body">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-center text-sm text-gray-600 font-body">
            Not a member yet?{" "}
            <Link to={intendedPlan ? `/pricing?plan=${intendedPlan}` : "/pricing"} className="font-semibold text-blue-600 hover:text-blue-500 font-body">
              Choose your plan
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
