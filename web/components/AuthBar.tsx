"use client";
import { useEffect, useState } from 'react';
import { getFirebase } from '@/lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';

export default function AuthBar() {
  const { auth, provider } = getFirebase();
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => onAuthStateChanged(auth, setUser), [auth]);

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {user ? (
        <>
          <span style={{ fontSize: 12 }}>{user.email}</span>
          <button onClick={() => signOut(auth)}>Sign out</button>
        </>
      ) : (
        <button onClick={() => signInWithPopup(auth, provider)}>Sign in</button>
      )}
    </div>
  );
}

