import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';

// Eager imports: the shared shell plus the top-of-funnel routes carrying the bulk
// of first-visit traffic. Splitting these would add a round-trip before first
// paint on exactly the pages we most want to render instantly.
import Layout from './components/layout/Layout'; // Import the Layout component
import NewLandingPage from './pages/NewLandingPage';
import PaidTrafficLandingPage from './pages/PaidTrafficLandingPage';
import PricingPage from './pages/PricingPage';
import PlanSelectorPage from './pages/PlanSelectorPage';
import { UserJotWidget } from './components/UserJotWidget';
import ConsentBanner from './components/ConsentBanner';
import ExitIntentModal from './components/ExitIntentModal';
import { initGA4, trackPageView } from './utils/analytics';
import { captureAttribution } from './utils/attribution';

// Lazy imports: every other route is fetched on demand so its code stays out of
// the initial bundle.
const CourseOverviewPage = lazy(() => import('./pages/CourseOverviewPage'));
const LessonPage = lazy(() => import('./pages/LessonPage'));
const ResourceLibraryPage = lazy(() => import('./pages/ResourceLibraryPage'));
const ResourceDetailPage = lazy(() => import('./pages/ResourceDetailPage'));
const BlogIndexPage = lazy(() => import('./pages/BlogIndexPage'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'));
const IndustrySolutionsPage = lazy(() => import('./pages/IndustrySolutionsPage'));
const CheatSheetLandingPage = lazy(() => import('./pages/CheatSheetLandingPage'));
const IndustrySolutionPage = lazy(() => import('./pages/IndustrySolutionPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const SanDiegoAIPage = lazy(() => import('./pages/SanDiegoAIPage'));
const PersonalizedRecapPage = lazy(() => import('./pages/PersonalizedRecapPage'));
const AIChatTutorPage = lazy(() => import('./pages/AIChatTutorPage'));
const LearningPathwaysPage = lazy(() => import('./pages/LearningPathwaysPage'));
const WelcomePage = lazy(() => import('./pages/WelcomePage'));
const LoginPage = lazy(() => import('./components/auth/LoginPage'));
const SignupPage = lazy(() => import('./components/auth/SignupPage'));
const ProfilePage = lazy(() => import('./components/auth/ProfilePage'));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'));
const PaymentCancelPage = lazy(() => import('./pages/PaymentCancelPage'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const AdminAddLesson = lazy(() => import('./pages/AdminAddLesson'));
const AdminRevenuePage = lazy(() => import('./pages/AdminRevenuePage'));
const RoadmapActivationPage = lazy(() => import('./pages/RoadmapActivationPage'));
const CheckoutStartPage = lazy(() => import('./pages/CheckoutStartPage'));
const BillingPage = lazy(() => import('./pages/BillingPage'));
const CertificationPage = lazy(() => import('./pages/CertificationPage'));
const IntakeDiagnostic = lazy(() => import('./pages/IntakeDiagnostic'));
const GovernanceLabPage = lazy(() => import('./pages/GovernanceLabPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const VerifyCertificatePage = lazy(() => import('./pages/VerifyCertificatePage'));
const PineconeLabPage = lazy(() => import('./pages/PineconeLabPage'));
const MCPLabPage = lazy(() => import('./pages/MCPLabPage'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const ComplianceLabPage = lazy(() => import('./pages/ComplianceLabPage'));

// Shown while a lazily-loaded route chunk is in flight
const RouteFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-label="Loading page">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
  </div>
);

// Renders the exit-intent modal with the correct variant based on current route
const ExitIntentWrapper: React.FC = () => {
  const location = useLocation();
  const isCheckout = location.pathname.startsWith('/checkout') || location.pathname.startsWith('/start-trial');
  // Suppress on post-purchase and admin pages
  const suppress = ['/payment-success', '/billing', '/admin'].some(p => location.pathname.startsWith(p));
  if (suppress) return null;
  return <ExitIntentModal variant={isCheckout ? 'checkout' : 'pricing'} />;
};

// Component to track page views on route changes
const PageViewTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    trackPageView(location.pathname + location.search);
  }, [location]);

  return null;
};

const App: React.FC = () => {
  // Initialize GA4 + capture first-touch attribution on app mount
  useEffect(() => {
    initGA4();
    captureAttribution();
  }, []);

  return (
    <Router>
      {/* Cookie consent banner — gates analytics/ads/session tags until opt-in */}
      <ConsentBanner />
      {/* UserJot feedback widget for beta testers */}
      <UserJotWidget />
      <PageViewTracker />
      {/* Exit-intent modal — fires on mouse-leave, suppressed post-purchase */}
      <ExitIntentWrapper />
      {/* Suspense boundary for the lazily-loaded route chunks above */}
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Public certificate verification — no auth required */}
          <Route path="/verify/:certId" element={<VerifyCertificatePage />} />
          {/* Root route is the primary onboarding funnel for direct visitors */}
          <Route path="/" element={<NewLandingPage />} />
          {/* Legacy homepage retired — redirect to the canonical landing page */}
          <Route path="/home" element={<Navigate to="/" replace />} />
          {/* NewLandingPage renders without Layout for full-screen landing page */}
          <Route path="/new-landing" element={<NewLandingPage />} />
          {/* Paid traffic landing page — same onboarding experience available at /start */}
          <Route path="/start" element={<PaidTrafficLandingPage />} />
          {/* PricingPage renders without Layout for full-screen pricing page */}
          <Route path="/pricing" element={<PricingPage />} />
          {/* Plan Selector: Section 3 — pre-checkout plan selector with source-aware copy */}
          <Route path="/start-trial" element={<PlanSelectorPage />} />
          <Route path="/get-access" element={<PlanSelectorPage />} />
          {/* Spec §4: Pre-checkout lead capture — captures email before Stripe redirect */}
          <Route path="/checkout/start" element={<CheckoutStartPage />} />
          {/* Free 10-minute activation — personalized roadmap, no card, email at value exchange */}
          <Route path="/roadmap" element={<RoadmapActivationPage />} />
          {/* Spec §14: Billing portal — redirects to Stripe Customer Portal */}
          <Route path="/billing" element={<BillingPage />} />
          {/* Admin page for adding lessons - hidden route */}
          <Route path="/admin/add-lesson" element={<AdminAddLesson />} />
          {/* Protected first-party revenue dashboard — admin gate enforced server-side */}
          <Route path="/admin/revenue" element={<AdminRevenuePage />} />

          {/* All other routes use Layout wrapper */}
          <Route element={<Layout />}>
            <Route path="/about" element={<AboutPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/blogs" element={<BlogIndexPage />} />
            <Route path="/blogs/:slug" element={<BlogPostPage />} />
            <Route path="/cheat-sheet" element={<CheatSheetLandingPage />} />
            <Route path="/library" element={<ResourceLibraryPage />} />
            <Route path="/library/:slug" element={<ResourceDetailPage />} />
            <Route path="/solutions" element={<IndustrySolutionsPage />} />
            <Route path="/solutions/:slug" element={<IndustrySolutionPage />} />
            <Route path="/ai-workshops-san-diego" element={<SanDiegoAIPage />} />
            <Route path="/courses" element={<CourseOverviewPage />} />
            <Route path="/courses/:courseId/modules/:moduleId/lessons/:lessonId" element={<LessonPage />} />
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/tutor" element={<AIChatTutorPage />} />
            <Route path="/paths" element={<LearningPathwaysPage />} />
            <Route path="/recap" element={<PersonalizedRecapPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/certification" element={<CertificationPage />} />
            <Route path="/diagnostic" element={<IntakeDiagnostic />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/lab/:labId" element={<GovernanceLabPage />} />
            <Route path="/lab/pinecone" element={<PineconeLabPage />} />
            <Route path="/lab/mcp" element={<MCPLabPage />} />
            <Route path="/lab/compliance" element={<ComplianceLabPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/payment-success" element={<PaymentSuccessPage />} />
            <Route path="/payment-cancel" element={<PaymentCancelPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
