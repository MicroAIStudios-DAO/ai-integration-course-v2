"use client";
import { useEffect, useState } from 'react';
import { getFirebase } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

type Props = { html: string; tier: 'free' | 'premium'; slug: string };

export default function LessonBody({ html, tier, slug }: Props) {
  const { auth, db } = getFirebase();
  const [premium, setPremium] = useState<boolean>(false);
  const [ready, setReady] = useState<boolean>(tier === 'free');
  const [premiumHtml, setPremiumHtml] = useState<string>('');

  useEffect(() => {
    if (tier === 'free') { setReady(true); return; }
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { setPremium(false); setReady(true); return; }
      const snap = await getDoc(doc(db, `users/${u.uid}`));
      const isPrem = (snap.data() as any)?.premium === true;
      setPremium(isPrem);
      setReady(true);
      if (isPrem) {
        const lSnap = await getDoc(doc(db, `lessons/${slug}`));
        const md = (lSnap.data() as any)?.md as string | undefined;
        if (md) {
          const rendered = await marked.parse(md);
          setPremiumHtml(DOMPurify.sanitize(rendered));
        }
      }
    });
    return () => unsub();
  }, [auth, db, slug, tier]);

  if (!ready) return <p>Loading…</p>;
  if (tier === 'premium' && !premium) return null; // gated by Paywall
  if (tier === 'premium') return <article dangerouslySetInnerHTML={{ __html: premiumHtml }} />;
  return <article dangerouslySetInnerHTML={{ __html: html }} />;
}
