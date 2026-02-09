import React, { useRef, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { functions, storage } from '../../config/firebase';
import useFoundingAccess from '../../hooks/useFoundingAccess';

const FeedbackDrawer: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [uploading, setUploading] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { isFounding, loading } = useFoundingAccess();
  if (loading || !isFounding) return null;

  const sendFeedback = async () => {
    if (!message.trim()) return;
    setStatus('sending');
    try {
      const submit = httpsCallable(functions, 'submitFeedbackV2');
      await submit({ message, path: window.location.pathname, screenshotUrl });
      setStatus('sent');
      setMessage('');
      setScreenshotUrl(null);
    } catch (err) {
      setStatus('error');
    }
  };

  const handleScreenshot = async (file: File) => {
    setUploading(true);
    try {
      const auth = getAuth();
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      const uid = auth.currentUser?.uid || 'anonymous';
      const storageRef = ref(storage, `feedback/${uid}/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setScreenshotUrl(url);
    } catch {
      setStatus('error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {open ? (
        <div className="w-80 rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
            <span className="text-sm font-semibold">Founding Feedback</span>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">✕</button>
          </div>
          <div className="p-4 space-y-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What should we improve?"
              className="w-full h-28 rounded-xl border border-slate-200 p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleScreenshot(file);
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl border border-slate-200 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
              type="button"
            >
              {uploading ? 'Uploading screenshot...' : screenshotUrl ? 'Replace screenshot' : 'Add screenshot'}
            </button>
            <button
              onClick={sendFeedback}
              disabled={status === 'sending' || uploading}
              className="w-full rounded-xl bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-indigo-300"
            >
              {status === 'sending' ? 'Sending...' : 'Send feedback'}
            </button>
            {status === 'sent' && <p className="text-xs text-emerald-600">Sent. Thank you!</p>}
            {status === 'error' && <p className="text-xs text-rose-600">Error sending. Try again.</p>}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-indigo-700"
        >
          Feedback
        </button>
      )}
    </div>
  );
};

export default FeedbackDrawer;
