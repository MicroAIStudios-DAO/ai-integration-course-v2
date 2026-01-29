import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { useAuth } from "../../context/AuthContext"; // Corrected path
import { functions } from "../../config/firebase";
import { useReCaptcha } from "../../hooks/useReCaptcha";
import { trackSignUp, trackBeginCheckout } from "../../utils/analytics";
import ReactPlayer from "react-player";

const SignupPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth(); // Use AuthContext
  const navigate = useNavigate();
  const location = useLocation();
  const { executeAndVerify, isLoaded } = useReCaptcha();
  const priceId = process.env.REACT_APP_STRIPE_PRICE_ID || "price_1SmgMKKnsQ10RdBLEWL2w8e4";
  const queryParams = new URLSearchParams(location.search);
  const checkoutCancelled = queryParams.get("checkout") === "cancelled";
  const introVideoUrl = "https://youtu.be/sG9_phBnm40";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Try reCAPTCHA verification but don't block signup if it fails
    try {
      if (isLoaded) {
        const verification = await executeAndVerify('SIGNUP');
        if (verification && !verification.success) {
          console.warn("reCAPTCHA verification returned low score, proceeding anyway");
        }
      }
    } catch (recaptchaError) {
      console.warn("reCAPTCHA verification failed, proceeding with signup:", recaptchaError);
    }

    try {
      await signup(email, password);
      // Track sign_up event
      trackSignUp('Email');
      const origin = window.location.origin;
      const createCheckoutSession = httpsCallable(functions, "createCheckoutSessionV2");
      const result = await createCheckoutSession({
        priceId,
        successUrl: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/payment-cancel`
      });
      const data = result.data as { url?: string };
      if (data?.url) {
        // Track begin_checkout event before redirect
        trackBeginCheckout(49, 'USD', 'Pro Plan', 'pro_monthly');
        window.location.href = data.url;
        return;
      }
      navigate("/welcome");
    } catch (err: any) {
      setError(err.message || "Failed to create an account. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8 font-body">
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="max-w-md w-full space-y-8 bg-white/90 backdrop-blur p-10 rounded-2xl shadow-xl border border-white/60 form-container">
        <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-lg bg-slate-900">
          <ReactPlayer
            url={introVideoUrl}
            width="100%"
            height="100%"
            playing
            muted
            controls
            playsinline
          />
        </div>
        <div>
          <h2 className="mt-6 text-center text-3xl font-headings font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 font-body">
            You will be redirected to secure checkout via Stripe.
          </p>
        </div>
        {checkoutCancelled && (
          <div className="rounded-md bg-yellow-50 p-4 mt-4">
            <p className="text-sm text-yellow-800 font-body">
              Checkout was cancelled. You can try again or continue without starting your trial.
            </p>
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
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
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm font-body form-input"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm font-body"
                placeholder="Password (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4 mt-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-700 font-body">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-headings font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 form-button"
            >
              {loading ? "Creating account..." : "Continue to secure checkout"}
            </button>
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500 font-body">
              <span className="inline-flex items-center gap-1">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="11" width="18" height="10" rx="2" />
                  <path d="M7 11V8a5 5 0 0 1 10 0v3" />
                </svg>
                Secure checkout
              </span>
              <span className="h-3 w-px bg-gray-200" />
              <span>Powered by Stripe</span>
            </div>
          </div>
        </form>
        <div className="mt-6">
          <p className="text-center text-sm text-gray-600 font-body">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 font-body">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
