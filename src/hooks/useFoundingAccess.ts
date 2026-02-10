import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { setFoundingMember } from '../utils/founding';

export function useFoundingAccess(): { isFounding: boolean; loading: boolean } {
  const { currentUser, loading: authLoading } = useAuth();
  const [isFounding, setIsFounding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setIsFounding(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = onSnapshot(
      doc(db, 'users', currentUser.uid),
      (snapshot) => {
        const founding = snapshot.exists() && snapshot.data()?.foundingMember === true;
        setIsFounding(founding);
        setFoundingMember(founding);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => unsub();
  }, [currentUser]);

  return { isFounding, loading: authLoading || loading };
}

export default useFoundingAccess;
