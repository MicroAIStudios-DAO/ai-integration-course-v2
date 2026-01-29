import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // Corrected path
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { useReCaptcha } from "../../hooks/useReCaptcha";
import ReactPlayer from "react-player";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Master access removed for production launch
  const { login } = useAuth(); // Use AuthContext
  const navigate = useNavigate();
  const { executeAndVerify, isLoaded } = useReCaptcha();
  const introVideoUrl = "https://youtu.be/sG9_phBnm40";

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
      <div className="max-w-md w-full space-y-8 bg-white/90 backdrop-blur p-10 rounded-2xl shadow-xl border border-white/60">
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
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 font-body">
            Welcome back. Continue your lessons and progress.
          </p>
        </div>
        {/* Regular Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <input type="hidden" name="remember" defaultValue="true" />
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
                  className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm font-body"
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
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm font-body"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
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

        <div className="mt-6">
          <p className="text-center text-sm text-gray-600 font-body">
            Not a member?{" "}
            <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500 font-body">
              Sign up now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
