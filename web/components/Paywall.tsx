"use client";
import { useEffect, useState } from 'react';
import { getFirebase } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import CheckoutButton from './CheckoutButton';

type Props = { priceId: string };

export default function Paywall({ priceId }: Props) {
  const { auth, db } = getFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [premium, setPremium] = useState<boolean | null>(null);

  useEffect(() => onAuthStateChanged(auth, setUser), [auth]);

  useEffect(() => {
    if (!user) { setPremium(null); return; }
    (async () => {
      const snap = await getDoc(doc(db, `users/${user.uid}`));
      setPremium((snap.data() as any)?.premium === true);
    })();
  }, [db, user]);

  if (!user) {
    return <p>Please sign in to access premium lessons.</p>;
  }
  if (premium === null) {
    return <p>Checking premium status…</p>;
  }
  if (premium) return null;

  return (
    <div style={{ padding: '1rem', background: '#fff4e5', border: '1px solid #ffd9a8', borderRadius: 8 }}>
      <p>This lesson is premium. Upgrade to continue.</p>
      <CheckoutButton priceId={priceId} />
    </div>
  );
}

