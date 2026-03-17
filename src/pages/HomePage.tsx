import React, { useMemo, useState } from 'react';
import AnimatedAvatar from '../components/layout/AnimatedAvatar';
import { appConfig } from '../config/environment';
import SEO from '../components/SEO';
import CourseSchema from '../components/seo/CourseSchema';
import FeedbackDrawer from '../components/feedback/FeedbackDrawer';
import FoundingAccessFloatingButton from '../components/founding/FoundingAccessFloatingButton';
import AIReadinessQuiz from '../components/home/AIReadinessQuiz';
import {
  homepageFaqItems,
  homepageVideoObject,
  industryPages,
  resourceLibraryItems
} from '../content/marketingPages';

type SubmissionState = 'idle' | 'loading' | 'success' | 'error';

const SUBSCRIPTION_DELAY_MS = 1200;
const SUBSCRIPTION_SUCCESS_MESSAGE =
  "Thank you for subscribing! Check your email for your free AI strategy guide.";
const SUBSCRIPTION_ERROR_MESSAGE =
  'Something went wrong while processing your request. Please try again in a moment.';
const GITHUB_REPO_URL = 'https://github.com/MicroAIStudios-DAO/ai-integration-course-v2';

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

  const { baseUrl } = appConfig;
  const navigationLinks = useMemo(() => {
    return {
      home: baseUrl,
      about: buildExternalUrl(baseUrl, '/about'),
      courses: buildExternalUrl(baseUrl, '/courses'),
      library: buildExternalUrl(baseUrl, '/library'),
      solutions: buildExternalUrl(baseUrl, '/solutions'),
      faq: buildExternalUrl(baseUrl, '/faq'),
      contact: buildExternalUrl(baseUrl, '/contact'),
      local: buildExternalUrl(baseUrl, '/ai-workshops-san-diego'),
      tutor: buildExternalUrl(baseUrl, '/tutor'),
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
      <SEO
        title="AI Automation Training for Business Owners and Developers"
        description="Learn Gemini API integration, AI workflow automation, and practical deployment patterns with a build-first course for operators, founders, and developers."
        url="/"
        keywords={[
          'How do I integrate Gemini API with Python',
          'Is this course for non-coders',
          'How to use AI for business automation',
          'AI integration course',
          'AI automation training'
        ]}
        author="Blaine Casey"
      />
      <CourseSchema
        includeFaqSchema
        faqItems={homepageFaqItems}
        includeVideoSchema
        videoObject={homepageVideoObject}
      />
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
        <div className="hidden md:flex items-center space-x-6">
          <a href={navigationLinks.courses} className="hover:text-cyan-400 transition-colors">Courses</a>
          <a href={navigationLinks.library} className="hover:text-cyan-400 transition-colors">Library</a>
          <a href={navigationLinks.solutions} className="hover:text-cyan-400 transition-colors">Industries</a>
          <a href={navigationLinks.about} className="hover:text-cyan-400 transition-colors">About</a>
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

        {/* Main Headline — Outcome-focused H1 */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 max-w-5xl">
          <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Cut 10+ Hours of Busywork Weekly With Your First AI Automation — Built in 14 Days
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl lg:text-2xl max-w-3xl text-slate-300 mb-4 leading-relaxed">
          From overwhelm to action. Stop watching AI tutorials — ship a working Customer Service Bot, automate your inbox, and reclaim your calendar before the end of Week 2.
        </p>
        <p className="text-md md:text-lg max-w-2xl text-slate-400 mb-8">
          Practical build-first training for founders, operators, and developers. First deployable result in 15 minutes.
        </p>

        {/* Premium Hero Visual */}
        <div className="w-full max-w-6xl mb-12">
          <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-slate-950/40 shadow-[0_20px_80px_rgba(15,23,42,0.55)]">
            <img
              src="/assets/hero_background_neural_network.png/hero_background_neural_network.png"
              alt="Premium AI systems and automation visual for AI Integration Course"
              className="h-[260px] w-full object-cover object-center md:h-[360px]"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/40 to-transparent" />
            <div className="absolute inset-0 flex items-end justify-between p-5 md:p-8">
              <div className="max-w-2xl text-left">
                <p className="mb-2 inline-flex items-center rounded-full border border-cyan-300/40 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                  Premium Training Experience
                </p>
                <h2 className="text-xl font-bold text-white md:text-3xl">
                  AI Integration Course Blueprint
                </h2>
                <p className="mt-2 text-sm text-slate-200 md:text-base">
                  Structured modules, practical workflows, and deployable automation systems.
                </p>
              </div>
              <div className="hidden rounded-2xl border border-white/20 bg-slate-900/65 px-4 py-3 text-right backdrop-blur md:block">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Guarantee</p>
                <p className="text-lg font-bold text-white">14-Day Build Window</p>
              </div>
            </div>
          </div>
        </div>

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
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
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

        {/* Trust Badges Row */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-6 mt-2">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-2 text-emerald-300 text-sm font-semibold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            14-Day Money-Back Guarantee
          </div>
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/20 rounded-full px-4 py-2 text-slate-300 text-sm">
            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Secure Checkout via Stripe
          </div>
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/20 rounded-full px-4 py-2 text-slate-300 text-sm">
            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            Trusted by 1,200+ Builders
          </div>
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/20 rounded-full px-4 py-2 text-slate-300 text-sm">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Cancel Anytime
          </div>
        </div>

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

        {/* Trailer Video */}
        <section className="w-full max-w-5xl mt-16 mb-12 text-left">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Watch the 2-minute course trailer</h2>
          <p className="text-slate-300 mb-6 max-w-3xl">
            See the exact workflow you will build, from Gemini API prompting to production-ready automation.
          </p>
          <div className="overflow-hidden rounded-2xl border border-white/20 bg-slate-900 shadow-2xl">
            <div className="aspect-video">
              <iframe
                src="https://www.youtube.com/embed/smkBKoxwzdE?rel=0"
                title="AI Integration Course trailer"
                className="w-full h-full"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </section>

        <AIReadinessQuiz />

        <section className="w-full max-w-6xl mt-16 text-left">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Resource Library</p>
              <h2 className="mt-2 text-3xl md:text-4xl font-bold">Permanent guides for operators and developers</h2>
              <p className="mt-4 text-slate-300 leading-relaxed">
                Build search depth with long-tail pages that answer implementation questions and business automation questions without making visitors hunt through a blog archive.
              </p>
            </div>
            <a href={navigationLinks.library} className="text-cyan-300 hover:text-cyan-200">
              Browse the full library →
            </a>
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {resourceLibraryItems.map((resource) => (
              <article
                key={resource.slug}
                className="rounded-3xl border border-white/20 bg-white/5 p-6 backdrop-blur-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">{resource.eyebrow}</p>
                <h3 className="mt-3 text-2xl font-bold text-white">{resource.title}</h3>
                <p className="mt-3 text-slate-300 leading-relaxed">{resource.summary}</p>
                <p className="mt-4 text-sm text-slate-400">Best for: {resource.audience}</p>
                <a
                  href={buildExternalUrl(baseUrl, `/library/${resource.slug}`)}
                  className="mt-6 inline-flex rounded-xl border border-white/20 px-4 py-2 font-semibold text-white hover:bg-white/5"
                >
                  Read guide
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="w-full max-w-6xl mt-16 text-left">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Industry Pages</p>
              <h2 className="mt-2 text-3xl md:text-4xl font-bold">AI integration for high-intent business searches</h2>
              <p className="mt-4 text-slate-300 leading-relaxed">
                These pages target buyers who already know their industry problem. Each one frames the safest first pilot and the workflow categories that fit.
              </p>
            </div>
            <a href={navigationLinks.solutions} className="text-cyan-300 hover:text-cyan-200">
              View all industry pages →
            </a>
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {industryPages.map((industry) => (
              <article
                key={industry.slug}
                className="rounded-3xl border border-white/20 bg-slate-950/40 p-6 shadow-xl"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">{industry.eyebrow}</p>
                <h3 className="mt-3 text-2xl font-bold text-white">{industry.title}</h3>
                <p className="mt-3 text-slate-300 leading-relaxed">{industry.summary}</p>
                <ul className="mt-5 space-y-2 text-sm text-slate-400">
                  {industry.workflows.slice(0, 3).map((workflow) => (
                    <li key={workflow} className="flex gap-3">
                      <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-cyan-300" />
                      <span>{workflow}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={buildExternalUrl(baseUrl, `/solutions/${industry.slug}`)}
                  className="mt-6 inline-flex rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-300"
                >
                  View industry page
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="w-full max-w-6xl mt-16 text-left">
          <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
            <div className="rounded-3xl border border-white/20 bg-white/5 p-8 backdrop-blur-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Proof of Competence</p>
              <h2 className="mt-3 text-3xl md:text-4xl font-bold text-white">The site should prove the course can ship real systems</h2>
              <p className="mt-4 max-w-3xl text-slate-300 leading-relaxed">
                That means more than course copy. It means interactive tooling, a visible instructor point of view, live implementation surfaces, and public build signals that show this is not a theory product.
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                  <h3 className="text-xl font-semibold text-white">Live AI Tutor</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    Use the AI tutor to see how the course supports implementation questions after the lesson ends.
                  </p>
                  <a href={navigationLinks.tutor} className="mt-5 inline-flex text-cyan-300 hover:text-cyan-200">
                    Open tutor →
                  </a>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                  <h3 className="text-xl font-semibold text-white">Instructor Authority</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    The about page now frames Blaine Casey around project themes, rollout discipline, and the operator mindset behind the curriculum.
                  </p>
                  <a href={navigationLinks.about} className="mt-5 inline-flex text-cyan-300 hover:text-cyan-200">
                    Read about Blaine →
                  </a>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                  <h3 className="text-xl font-semibold text-white">GitHub Build Signal</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    Public build artifacts and repo-level implementation detail help technical buyers trust the teaching.
                  </p>
                  <a
                    href={GITHUB_REPO_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex text-cyan-300 hover:text-cyan-200"
                  >
                    Review the repo →
                  </a>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">San Diego Angle</p>
              <h2 className="mt-3 text-3xl font-bold text-white">Lower-competition local intent is now covered</h2>
              <p className="mt-4 text-slate-200 leading-relaxed">
                The site now includes a dedicated page for San Diego and Southern California teams looking for AI workshops and implementation training.
              </p>
              <div className="mt-6 space-y-3 text-slate-200">
                <p>Targeted terms include AI workshops in San Diego, AI training in Southern California, and practical rollout support for local teams.</p>
                <a href={navigationLinks.local} className="inline-flex text-emerald-200 hover:text-white">
                  Visit the local landing page →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Frequently Asked Questions */}
        <section className="w-full max-w-5xl mt-6 mb-8 text-left">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="grid gap-4">
            {homepageFaqItems.map((item) => (
              <article
                key={item.question}
                className="rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm p-6"
              >
                <h3 className="text-xl font-semibold text-white mb-2">{item.question}</h3>
                <p className="text-slate-300 leading-relaxed">{item.answer}</p>
              </article>
            ))}
          </div>
          <a href={navigationLinks.faq} className="mt-6 inline-flex text-cyan-300 hover:text-cyan-200">
            View the full FAQ page →
          </a>
        </section>
      </div>

      {/* Floating AI Element — removed animate-bounce for LCP/mobile performance */}

      {/* Footer */}
      <div className="relative z-10 text-center py-8 text-slate-400 text-sm">
        <p>© {new Date().getFullYear()} AI Integration Course. Guided by humans, built by AI.</p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-4">
          <a href={navigationLinks.library} className="hover:text-cyan-300">Library</a>
          <a href={navigationLinks.solutions} className="hover:text-cyan-300">Industries</a>
          <a href={navigationLinks.about} className="hover:text-cyan-300">About</a>
          <a href={navigationLinks.contact} className="hover:text-cyan-300">Contact</a>
        </div>
      </div>

      <FoundingAccessFloatingButton />
      <FeedbackDrawer />
    </div>
    </>
  );
};
export default HomePage;
