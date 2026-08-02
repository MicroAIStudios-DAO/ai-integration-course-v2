import React from 'react';
import { Outlet } from 'react-router-dom';
import FeedbackDrawer from '../feedback/FeedbackDrawer';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

// Shared chrome for all Layout-wrapped routes. The previous inline header
// (hover-flyout module menu) and inline footer were one of THREE divergent
// layouts; SiteHeader/SiteFooter are now the single chrome for every route.
// Logged-in lesson navigation lives on /courses.
const Layout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 font-sans">
      <SiteHeader />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <Outlet />
      </main>
      <FeedbackDrawer />
      <SiteFooter />
    </div>
  );
};

export default Layout;
