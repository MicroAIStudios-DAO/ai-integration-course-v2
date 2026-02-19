import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

const ProfilePage: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const accountCreated = useMemo(() => {
    const value = currentUser?.metadata.creationTime;
    return value ? new Date(value).toLocaleString() : 'Not available';
  }, [currentUser]);

  const lastSignIn = useMemo(() => {
    const value = currentUser?.metadata.lastSignInTime;
    return value ? new Date(value).toLocaleString() : 'Not available';
  }, [currentUser]);

  const handleLogout = async () => {
    setLogoutError(null);
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : 'Failed to log out.');
    }
  };

  if (!currentUser) {
    return (
      <section className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="mt-3 text-slate-600">You are not signed in.</p>
        <button
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          onClick={() => navigate('/login')}
          type="button"
        >
          Go to Login
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          {currentUser.emailVerified ? 'Verified' : 'Unverified'}
        </span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
          <p className="mt-1 break-all text-sm font-medium text-slate-900">{currentUser.email || 'Not available'}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Display Name</p>
          <p className="mt-1 text-sm font-medium text-slate-900">{currentUser.displayName || 'Not set'}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account Created</p>
          <p className="mt-1 text-sm font-medium text-slate-900">{accountCreated}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last Sign In</p>
          <p className="mt-1 text-sm font-medium text-slate-900">{lastSignIn}</p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">User ID</p>
        <p className="mt-1 break-all text-sm text-slate-700">{currentUser.uid}</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          onClick={() => navigate('/courses')}
          type="button"
        >
          Go to Courses
        </button>
        <button
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          onClick={handleLogout}
          type="button"
        >
          Log Out
        </button>
      </div>

      {logoutError && <p className="mt-4 text-sm text-rose-600">{logoutError}</p>}
    </section>
  );
};

export default ProfilePage;
