import React, { useMemo, useState } from 'react';
import AnimatedAvatar from '../components/layout/AnimatedAvatar';
import { appConfig } from '../config/environment';
import CourseSchema from '../components/seo/CourseSchema';
import FoundingAccessModal from '../components/founding/FoundingAccessModal';
import FeedbackDrawer from '../components/feedback/FeedbackDrawer';
import useFoundingAccess from '../hooks/useFoundingAccess';

type SubmissionState = 'idle' | 'loading' | 'success' | 'error';

const SUBSCRIPTION_DELAY_MS = 1200;
const SUBSCRIPTION_SUCCESS_MESSAGE =
  "Thank you for subscribing! Check your email for your free AI strategy guide.";
const SUBSCRIPTION_ERROR_MESSAGE =
  'Something went wrong while processing your request. Please try again in a moment.';

const wait = (duration: number) =>
  new Promise<void>(resolve => {
    setTimeout(resolve, duration);
  });

const buildExternalUrl = (baseUrl: string, path: string): string => {
  try {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const resolvedUrl = new URL(baseUrl);
    resolvedUrl.pathname = normalizedPath;
    resolvedUrl.search = '';
    resolvedUrl.hash = '';
    return resolvedUrl.toString();
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Unable to construct navigation URL', { baseUrl, path, error });
    }
    return path;
  }
};

const HomePage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submissionState, setSubmissionState] = useState<SubmissionState>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [showFoundingModal, setShowFoundingModal] = useState(false);
  const { isFounding } = useFoundingAccess();

  const { baseUrl } = appConfig;
  const navigationLinks = useMemo(() => {
    return {
      home: baseUrl,
      courses: buildExternalUrl(baseUrl, '/courses'),
      login: buildExternalUrl(baseUrl, '/login'),
      signup: buildExternalUrl(baseUrl, '/signup')
    };
  }, [baseUrl]);

  const isSubmitting = submissionState === 'loading';
  const isSuccess = submissionState === 'success';

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmissionState('loading');
    setFeedbackMessage(null);

    try {
      await wait(SUBSCRIPTION_DELAY_MS);
      setSubmissionState('success');
      setEmail('');
      setFeedbackMessage(SUBSCRIPTION_SUCCESS_MESSAGE);
    } catch (error) {
      console.error('Newsletter subscription failed', error);
      setSubmissionState('error');
      setFeedbackMessage(SUBSCRIPTION_ERROR_MESSAGE);
    }
  };

  return (
    <>
      <CourseSchema />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.05),transparent)]"></div>
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-cyan-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-gradient-to-r from-pink-400/20 to-indigo-600/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-20 flex justify-between items-center p-6 md:p-8">
        <a
          href={navigationLinks.home}
          className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
        >
          AI Integration Course
        </a>
        <div className="hidden md:flex space-x-6">
          <a href={navigationLinks.courses} className="hover:text-cyan-400 transition-colors">Courses</a>
          <a href={navigationLinks.login} className="hover:text-cyan-400 transition-colors">Login</a>
          <a
            href={navigationLinks.signup}
            className="bg-gradient-to-r from-cyan-500 to-purple-500 px-4 py-2 rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-all"
          >
            Get Started
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-12 md:py-20">
        {/* Animated Avatar */}
        <div className="mb-8">
          <AnimatedAvatar size={120} />
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 max-w-5xl">
          <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Build your first working AI Agent in 14 days
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl lg:text-2xl max-w-3xl text-slate-300 mb-4 leading-relaxed">
          From overwhelm to action. Stop learning about AI—start building with it.
        </p>
        <p className="text-md md:text-lg max-w-2xl text-slate-400 mb-8">
          Get your first win in 15 minutes. No fluff, no theory—just practical AI skills that create immediate value.
        </p>

        {/* Key Value Props */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mb-12">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-3xl mb-3">⏱️</div>
            <h3 className="text-lg font-semibold mb-2">First Win in 15 Minutes</h3>
            <p className="text-sm text-slate-400">No lengthy setup. Complete your first AI project before your coffee gets cold.</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-3xl mb-3">🛠️</div>
            <h3 className="text-lg font-semibold mb-2">Built for Builders</h3>
            <p className="text-sm text-slate-400">Skip the theory. Every lesson ends with something you can use immediately.</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="text-lg font-semibold mb-2">AI as Your Coach</h3>
            <p className="text-sm text-slate-400">Not just videos—an AI-enhanced accelerator that thinks with you and pushes you toward mastery.</p>
          </div>
        </div>

        {/* AUDIT: 14-Day Build-Your-First-Bot Guarantee Badge */}
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-6 py-3 text-emerald-400 mb-8">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="font-semibold">14-Day Build-Your-First-Bot Guarantee</span>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <a
            href={navigationLinks.signup}
            className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-2xl transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-300"
          >
            Start Building Now
          </a>
          <a
            href={navigationLinks.courses}
            className="border-2 border-white/20 hover:border-white/40 text-white px-8 py-4 rounded-xl text-lg font-semibold backdrop-blur-sm transition-all hover:bg-white/5"
          >
            View Curriculum
          </a>
        </div>
        {!isFounding && (
          <button
            onClick={() => setShowFoundingModal(true)}
            className="text-sm uppercase tracking-[0.2em] text-cyan-200 hover:text-white transition-colors"
          >
            Founding members click here
          </button>
        )}

        {/* Guarantee Explanation */}
        <p className="text-sm text-slate-400 max-w-xl text-center mb-12">
          Build a working Customer Service Email Bot in 14 days or get a full refund. No questions asked.
        </p>

        {/* Email Capture */}
        <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-semibold mb-3 text-center">Get Your Free AI Strategy Guide</h3>
          <p className="text-sm text-slate-300 mb-4 text-center">
            Join thousands shaping the future of AI. Get instant access to our exclusive guide.
          </p>
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-white placeholder-slate-400 backdrop-blur-sm"
              required
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending...' : 'Get Free Guide'}
            </button>
          </form>
          {feedbackMessage && (
            <p
              role="status"
              aria-live="polite"
              className={`text-sm mt-3 text-center ${isSuccess ? 'text-emerald-300' : 'text-rose-300'}`}
            >
              {feedbackMessage}
            </p>
          )}
          <p className="text-xs text-slate-400 mt-3 text-center">
            No spam. Unsubscribe anytime. Your data is secure.
          </p>
        </div>
      </div>

      {/* Floating AI Element */}
      <div className="absolute bottom-10 right-10 w-24 h-24 md:w-32 md:h-32 animate-bounce">
        <div className="w-full h-full rounded-full bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 opacity-80 flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-2xl">
          AI
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center py-8 text-slate-400 text-sm">
        <p>© {new Date().getFullYear()} AI Integration Course. Guided by humans, built by AI.</p>
      </div>

      <FoundingAccessModal
        isOpen={showFoundingModal}
        onClose={() => setShowFoundingModal(false)}
        onSuccess={() => setShowFoundingModal(false)}
      />
      <FeedbackDrawer />
    </div>
    </>
  );
};
export default HomePage;
