import React from 'react';

const PrivacyPolicyPage: React.FC = () => {
  const lastUpdated = 'February 17, 2026';

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 font-body py-8">
      <div className="container mx-auto px-4 prose lg:prose-xl">
        <h1 className="font-headings text-3xl md:text-4xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        <p className="mb-4">
          This Privacy Policy explains how AI Integration Course collects, uses, shares, and protects personal
          information when you use our website and services.
        </p>

        <h2 className="font-headings text-2xl font-semibold text-gray-800 mt-6 mb-3">1. Information We Collect</h2>
        <p className="mb-4">
          We may collect information you provide directly (such as account details, billing metadata, support requests,
          and feedback), usage information (such as page views and product interactions), and technical data (such as
          IP address, browser type, and device information).
        </p>

        <h2 className="font-headings text-2xl font-semibold text-gray-800 mt-6 mb-3">2. How We Use Information</h2>
        <p className="mb-4">
          We use your information to operate and improve the service, authenticate users, process subscriptions and
          payments, personalize learning experiences, provide support, maintain security, and comply with legal
          obligations.
        </p>

        <h2 className="font-headings text-2xl font-semibold text-gray-800 mt-6 mb-3">3. Legal Bases (Where Applicable)</h2>
        <p className="mb-4">
          Depending on your location, we process personal information based on contractual necessity, legitimate
          interests, legal obligations, and consent where required.
        </p>

        <h2 className="font-headings text-2xl font-semibold text-gray-800 mt-6 mb-3">4. Sharing of Information</h2>
        <p className="mb-4">
          We may share information with trusted service providers that help run the platform (for example hosting,
          authentication, analytics, email, and payment processors), when required by law, or to protect rights,
          safety, and security.
        </p>

        <h2 className="font-headings text-2xl font-semibold text-gray-800 mt-6 mb-3">5. Cookies and Analytics</h2>
        <p className="mb-4">
          We use cookies and similar technologies to authenticate sessions, remember preferences, and analyze traffic
          and feature usage. You can control cookies in your browser settings, but disabling cookies may impact some
          functionality.
        </p>

        <h2 className="font-headings text-2xl font-semibold text-gray-800 mt-6 mb-3">6. Data Retention</h2>
        <p className="mb-4">
          We retain personal information only as long as necessary for legitimate business purposes, legal compliance,
          dispute resolution, and enforcement of agreements.
        </p>

        <h2 className="font-headings text-2xl font-semibold text-gray-800 mt-6 mb-3">7. Data Protection</h2>
        <p className="mb-4">
          We use reasonable administrative, technical, and organizational safeguards designed to protect personal data.
          No system is perfectly secure, and we cannot guarantee absolute security.
        </p>

        <h2 className="font-headings text-2xl font-semibold text-gray-800 mt-6 mb-3">8. Your Rights</h2>
        <p className="mb-4">
          Depending on applicable law, you may have rights to access, correct, delete, export, or object to processing
          of your personal data, and to withdraw consent where processing is based on consent.
        </p>

        <h2 className="font-headings text-2xl font-semibold text-gray-800 mt-6 mb-3">9. Children&apos;s Privacy</h2>
        <p className="mb-4">
          The service is not directed to children under 13, and we do not knowingly collect personal information from
          children under 13.
        </p>

        <h2 className="font-headings text-2xl font-semibold text-gray-800 mt-6 mb-3">10. International Transfers</h2>
        <p className="mb-4">
          Your information may be processed in countries other than your own. Where required, we use appropriate
          safeguards for cross-border data transfers.
        </p>

        <h2 className="font-headings text-2xl font-semibold text-gray-800 mt-6 mb-3">11. Changes to This Policy</h2>
        <p className="mb-4">
          We may update this Privacy Policy from time to time. Material changes will be posted on this page with an
          updated date.
        </p>

        <h2 className="font-headings text-2xl font-semibold text-gray-800 mt-6 mb-3">12. Contact</h2>
        <p className="mb-4">For privacy questions or requests, contact: support@aiintegrationcourse.com.</p>

        <p className="text-sm text-gray-500 mt-8">Last updated: {lastUpdated}</p>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
