import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { useNavigate } from 'react-router-dom';
import { functions } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { setFoundingMember } from '../../utils/founding';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

const FoundingAccessModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const formatCodeInput = (value: string): string => {
    const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^FOUNDING/, '').slice(0, 24);
    const groups = normalized.match(/.{1,4}/g);
    return groups ? groups.join(' ') : '';
  };

  const redeem = async () => {
    if (!code.trim()) return;
    if (!currentUser) {
      setError('Create or sign in to the account that should receive founding access.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const redeemFounding = httpsCallable(functions, 'redeemFoundingCodeV2');
      await redeemFounding({ code: code.trim() });

      setFoundingMember(true);
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
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
        {currentUser ? (
          <div className="mt-6">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500 font-headings font-semibold">
              Access Code
            </label>
            <input
              value={code}
              onChange={(e) => setCode(formatCodeInput(e.target.value))}
              placeholder="A1B2 C3D4 E5F6 G7H8 I9J0 K1L2"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="mt-2 text-xs text-slate-500">Use 4-character groups (letters and numbers).</p>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            Founding access attaches to a specific account. Sign in or create your account first, then redeem the code.
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}
        <div className="mt-6 flex items-center justify-end gap-3">
          {!currentUser && (
            <>
              <button
                onClick={() => {
                  onClose();
                  navigate('/login');
                }}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  onClose();
                  navigate('/signup');
                }}
                className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg hover:bg-indigo-700"
              >
                Create Account
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>
          {currentUser && (
            <button
              onClick={redeem}
              disabled={loading}
              className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg hover:bg-indigo-700 disabled:bg-indigo-300"
            >
              {loading ? 'Checking…' : 'Unlock Access'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoundingAccessModal;
