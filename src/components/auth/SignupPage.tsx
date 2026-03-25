import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { useAuth } from "../../context/AuthContext"; // Corrected path
import { functions } from "../../config/firebase";
import { useReCaptcha } from "../../hooks/useReCaptcha";
import { trackSignUp, trackBeginCheckout } from "../../utils/analytics";
import ReactPlayer from "react-player";
import FoundingAccessFloatingButton from "../founding/FoundingAccessFloatingButton";
import SEO from "../SEO";
import RoiGuaranteeBadge from "../conversion/RoiGuaranteeBadge";
import { CheckoutPlanKey, getCheckoutPlan } from "../../config/pricing";

type AccessCodeClaimResult = {
  accessType?: 'beta' | 'scholarship';
  checkoutPlanKey?: CheckoutPlanKey;
  checkoutRequired?: boolean;
  cohort?: string;
  priceCents?: number;
  success?: boolean;
  grantPremium?: boolean;
  skipCheckout?: boolean;
  usesRemaining?: number;
};

const SignupPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [offerCode, setOfferCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth(); // Use AuthContext
  const navigate = useNavigate();
  const location = useLocation();
  const { executeAndVerify, isLoaded } = useReCaptcha();
  const queryParams = new URLSearchParams(location.search);
  const checkoutCancelled = queryParams.get("checkout") === "cancelled";
  const introVideoUrl = "https://youtu.be/sG9_phBnm40";

  const startCheckout = async (planKey: CheckoutPlanKey) => {
    const origin = window.location.origin;
    const plan = getCheckoutPlan(planKey);
    const createCheckoutSession = httpsCallable(functions, "createCheckoutSessionV2");
    const result = await createCheckoutSession({
      planKey,
      priceId: plan.priceId,
      successUrl: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/payment-cancel`
    });
    const data = result.data as { url?: string };
    if (data?.url) {
      trackBeginCheckout(plan.amount, 'USD', plan.name, planKey);
      window.location.href = data.url;
      return;
    }
    throw new Error("Unable to start checkout. Please try again.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const normalizedOfferCode = offerCode.trim().toUpperCase();

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

      // Offer-code based beta enrollment (best practice: separate from password).
      if (normalizedOfferCode) {
        try {
          const claimBetaTester = httpsCallable(functions, "claimBetaTesterV2");
          const result = await claimBetaTester({ code: normalizedOfferCode, cohort: "Pioneer" });
          const data = result.data as AccessCodeClaimResult;
          trackSignUp('Email');
          if (data?.accessType === 'scholarship' || data?.grantPremium) {
            navigate("/courses");
            setLoading(false);
            return;
          }

          if (data?.skipCheckout) {
            navigate("/welcome");
            setLoading(false);
            return;
          }

          await startCheckout(data?.checkoutPlanKey || 'beta_monthly');
          return;
        } catch (betaErr) {
          console.error("Beta enrollment failed after signup:", betaErr);
          setError(
            "Your account was created, but the access code could not be applied. Sign in and contact support before continuing if this code should unlock a special access path."
          );
          setLoading(false);
          trackSignUp('Email');
          return;
        }
      }

      // Track sign_up event
      trackSignUp('Email');
      await startCheckout('pro_monthly');
    } catch (err: any) {
      setError(err.message || "Failed to create an account. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8 font-body">
      <SEO
        title="Sign Up"
        description="Create your AI Integration Course account. Use PIONEER or an approved cohort code to unlock the $29.99/mo tester rate, or join the standard Pro path."
        url="/signup"
        keywords={[
          'AI Integration Course signup',
          'PIONEER beta signup',
          'paid beta testing',
          'beta cohort pricing',
          'AI course account creation'
        ]}
        author="Blaine Casey"
      />
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="max-w-2xl w-full space-y-8 bg-white/90 backdrop-blur p-10 rounded-3xl shadow-xl border border-white/60 form-container">
        <div className="w-full aspect-video rounded-3xl overflow-hidden shadow-2xl bg-slate-900">
          <ReactPlayer
            url={introVideoUrl}
            width="100%"
            height="100%"
            playing
            controls
            playsinline
          />
        </div>
        <div>
          <h2 className="mt-6 text-center text-3xl font-headings font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 font-body">
            `PIONEER` and approved cohort codes unlock the paid tester rate at $29.99/mo. Standard signup still flows into the normal Pro checkout.
          </p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-900">
          <p className="font-semibold">Choose the right path:</p>
          <ul className="mt-3 space-y-2">
            <li>1. Standard signup: create your account, then continue to checkout.</li>
            <li>2. Cohort signup: enter `PIONEER` or your approved invite code to claim the $29.99/mo tester rate, then continue straight to checkout.</li>
            <li>3. Founding member: create your account first, then redeem the separate founding code in the next step.</li>
          </ul>
        </div>
        {checkoutCancelled && (
          <div className="rounded-md bg-yellow-50 p-4 mt-4">
            <p className="text-sm text-yellow-800 font-body">
              Checkout was cancelled. You can try again or continue without starting your trial.
            </p>
          </div>
        )}
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
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm font-body form-input"
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
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm font-body pr-12"
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
            <div>
              <label htmlFor="offer-code" className="sr-only">
                Offer Code
              </label>
              <input
                id="offer-code"
                name="offerCode"
                type="text"
                autoComplete="off"
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm font-body"
                placeholder="Offer code (optional) - e.g. PIONEER"
                value={offerCode}
                onChange={(e) => setOfferCode(e.target.value.toUpperCase())}
              />
              <p className="mt-2 text-xs text-gray-500">
                Use `PIONEER` or your approved invite code for the paid tester path at $29.99/mo.
              </p>
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
              {loading ? "Creating account..." : "Create account and continue"}
            </button>
            <div className="mt-3 flex justify-center">
              <RoiGuaranteeBadge />
            </div>
            <p className="mt-2 text-center text-xs text-gray-500 font-body">
              Finish checkout and build one live workflow in 14 days or request a full refund.
            </p>
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
            <div className="mt-4 flex flex-col items-center gap-2 text-sm">
              <Link to="/pricing" className="font-medium text-blue-600 hover:text-blue-500">
                Compare plans first
              </Link>
              <Link to="/courses" className="font-medium text-slate-600 hover:text-slate-900">
                Preview the free curriculum
              </Link>
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
      <FoundingAccessFloatingButton />
    </div>
  );
};

export default SignupPage;
