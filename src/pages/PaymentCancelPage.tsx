import React from 'react';
import { Link } from 'react-router-dom';

const PaymentCancelPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-xl rounded-2xl border border-amber-400/20 bg-slate-900/70 p-8 text-center text-slate-100">
        <h1 className="text-3xl font-bold text-amber-300 mb-4">Checkout Interrupted</h1>
        <p className="text-slate-300 leading-7">
          Your payment was not processed. No charges have been made to your account.
        </p>
        <p className="mt-4 text-sm text-slate-400">
          You can resume checkout at any time. Your 14-day build guarantee still applies once you subscribe.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/pricing"
            className="inline-flex items-center justify-center rounded-lg bg-amber-400 px-6 py-3 font-semibold text-slate-950 transition-colors hover:bg-amber-300"
          >
            Resume Checkout
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-lg border border-white/15 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/5"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelPage;
