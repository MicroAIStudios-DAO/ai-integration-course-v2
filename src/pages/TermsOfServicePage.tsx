import React from 'react';

const TermsOfServicePage: React.FC = () => {
  const lastUpdated = 'February 17, 2026';

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 font-body py-8">
      <div className="container mx-auto px-4 prose lg:prose-xl">
        <h1 className="font-headings text-3xl md:text-4xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        <p className="mb-4">
          These Terms of Service govern your use of AI Integration Course, including our website, courses, tools, and related services.
          By accessing or using the service, you agree to these terms.
        </p>

        <h2 className="font-headings text-2xl font-semibold text-gray-800 mt-6 mb-3">1. Acceptance of Terms</h2>
        <p className="mb-4">
          By creating an account, purchasing a plan, or using the service, you confirm that you are at least 18 years old (or the age of legal majority in your jurisdiction) and legally able to enter into this agreement.
        </p>

        <h2 className="font-headings text-2xl font-semibold text-gray-800 mt-6 mb-3">2. Services</h2>
        <p className="mb-4">
          We provide educational content, AI-assisted learning tools, and related digital products. Features may change over time, and some features may be available only on paid plans.
        </p>

        <h2 className="font-headings text-2xl font-semibold text-gray-800 mt-6 mb-3">3. User Accounts</h2>
        <p className="mb-4">
          You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. You agree to provide accurate information and promptly update it if it changes.
        </p>

        <h2 className="font-headings text-2xl font-semibold text-gray-800 mt-6 mb-3">4. Subscriptions and Payments</h2>
        <p className="mb-4">
          Paid subscriptions are billed according to the plan you select. Unless otherwise stated, subscriptions renew automatically until canceled. You authorize us and our payment processors to charge applicable fees, taxes, and any recurring charges. Refunds, if offered, are governed by the refund policy shown at checkout.
        </p>

        <h2 className="font-headings text-2xl font-semibold text-gray-800 mt-6 mb-3">5. Intellectual Property</h2>
        <p className="mb-4">
          The service, including code, branding, lessons, videos, text, graphics, and AI workflows, is owned by us or our licensors and protected by intellectual property laws. You receive a limited, non-exclusive, non-transferable license for personal or internal business learning use only.
        </p>

        <h2 className="font-headings text-2xl font-semibold text-gray-800 mt-6 mb-3">6. Prohibited Conduct</h2>
        <p className="mb-4">
          You may not misuse the service, including by attempting unauthorized access, distributing malware, infringing intellectual property rights, scraping content at scale, reverse engineering protected components, or using the platform for unlawful activity.
        </p>

        <h2 className="font-headings text-2xl font-semibold text-gray-800 mt-6 mb-3">7. AI and Educational Disclaimer</h2>
        <p className="mb-4">
          Content is provided for educational purposes only and does not constitute legal, tax, accounting, investment, or financial advice. AI outputs may be incomplete, incorrect, or outdated, and you are responsible for validating results before acting on them.
        </p>

        <h2 className="font-headings text-2xl font-semibold text-gray-800 mt-6 mb-3">8. Disclaimer of Warranties</h2>
        <p className="mb-4">
          The service is provided on an &quot;as is&quot; and &quot;as available&quot; basis without warranties of any kind, express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement.
        </p>

        <h2 className="font-headings text-2xl font-semibold text-gray-800 mt-6 mb-3">9. Limitation of Liability</h2>
        <p className="mb-4">
          To the fullest extent permitted by law, we are not liable for indirect, incidental, consequential, special, exemplary, or punitive damages, or for lost profits, revenues, data, or goodwill.
        </p>

        <h2 className="font-headings text-2xl font-semibold text-gray-800 mt-6 mb-3">10. Termination</h2>
        <p className="mb-4">
          We may suspend or terminate access if you violate these terms, create risk for users or the platform, or where required by law. You may stop using the service at any time.
        </p>

        <h2 className="font-headings text-2xl font-semibold text-gray-800 mt-6 mb-3">11. Governing Law</h2>
        <p className="mb-4">
          These terms are governed by the laws of the State of Delaware, United States, without regard to conflict-of-law rules.
        </p>

        <h2 className="font-headings text-2xl font-semibold text-gray-800 mt-6 mb-3">12. Changes to Terms</h2>
        <p className="mb-4">
          We may update these terms from time to time. Updated terms become effective when posted. Continued use of the service after updates means you accept the revised terms.
        </p>

        <h2 className="font-headings text-2xl font-semibold text-gray-800 mt-6 mb-3">13. Contact</h2>
        <p className="mb-4">
          For questions about these terms, contact: support@aiintegrationcourse.com.
        </p>

        <p className="text-sm text-gray-500 mt-8">
          Last updated: {lastUpdated}
        </p>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
