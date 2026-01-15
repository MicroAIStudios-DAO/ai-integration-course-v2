"use client";
import { useEffect, useState } from 'react';
import { getFirebase } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function AccountPage() {
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

  return (
    <div>
      <h1>Account</h1>
      {user ? (
        <>
          <p>Signed in as {user.email}</p>
          <p>Status: {premium ? 'Premium' : 'Free'}</p>
        </>
      ) : (
        <p>Please sign in.</p>
      )}
    </div>
  );
}

