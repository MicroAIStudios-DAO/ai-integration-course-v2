import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { functions } from '../../config/firebase';
import { setFoundingMember } from '../../utils/founding';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

const FoundingAccessModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const redeem = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const auth = getAuth();
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }

      const redeemFounding = httpsCallable(functions, 'redeemFoundingCodeV2');
      await redeemFounding({ code: code.trim() });

      setFoundingMember(true);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Invalid or used code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-headings font-extrabold text-slate-900">Founding Member Access</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700" aria-label="Close modal">
            ✕
          </button>
        </div>
        <p className="text-sm text-slate-600 mt-2">
          Enter your founding access code to unlock lifetime pricing and feedback tools.
        </p>
        <div className="mt-6">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500 font-headings font-semibold">
            Access Code
          </label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="FOUNDING-XXXX"
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>
          <button
            onClick={redeem}
            disabled={loading}
            className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            {loading ? 'Checking…' : 'Unlock Access'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FoundingAccessModal;
