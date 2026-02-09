import React, { useState } from 'react';
import FoundingAccessModal from './FoundingAccessModal';
import useFoundingAccess from '../../hooks/useFoundingAccess';

const FoundingAccessFloatingButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { isFounding, loading } = useFoundingAccess();

  if (loading || isFounding) return null;

  return (
    <>
      <div className="fixed bottom-6 left-6 z-40">
        <button
          onClick={() => setOpen(true)}
          className="rounded-full bg-white/90 px-5 py-3 text-xs font-headings font-bold uppercase tracking-[0.2em] text-slate-900 shadow-lg hover:bg-white"
        >
          Founding Access
        </button>
      </div>
      <FoundingAccessModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onSuccess={() => setOpen(false)}
      />
    </>
  );
};

export default FoundingAccessFloatingButton;
