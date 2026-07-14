/**
 * submitActivationV2 — capture a free-roadmap activation as a segmented lead.
 *
 * The free 10-minute roadmap experience (/roadmap) is a no-card value exchange:
 * the visitor answers a few questions, gets a personalized roadmap on screen,
 * and gives their email to save it. This writes them into the SAME `leads`
 * collection the checkout flow uses (so the existing onLeadCreated → HubSpot
 * sync and lifecycle can act on them) with the segmentation attributes
 * (role/goal/technical confidence/intended use) that let onboarding and
 * lifecycle emails personalize.
 *
 * Unauthenticated by design (top of funnel). reCAPTCHA is enforced client-side
 * before this is called, matching the lead-magnet form.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import admin from 'firebase-admin';

const db = admin.firestore();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const str = (v: unknown, max = 200): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export const submitActivationV2 = onCall({ region: 'us-central1' }, async (request) => {
  const data = request.data || {};
  const email = str(data.email).toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    throw new HttpsError('invalid-argument', 'A valid email is required.');
  }

  const role = str(data.role, 40);
  const goal = str(data.goal, 40);
  const intendedUse = str(data.intendedUse, 40);
  const techConfidenceRaw = Number(data.techConfidence);
  const techConfidence = Number.isFinite(techConfidenceRaw)
    ? Math.min(5, Math.max(1, Math.round(techConfidenceRaw)))
    : null;
  const track = str(data.track, 40);
  const segment = str(data.segment, 120);
  const marketingConsent = data.marketingConsent !== false; // default opt-in for a value-exchange
  const source = str(data.source, 80) || 'roadmap_activation';

  const utm = {
    source: str(data.utm?.source, 80),
    medium: str(data.utm?.medium, 80),
    campaign: str(data.utm?.campaign, 80),
    content: str(data.utm?.content, 80),
    term: str(data.utm?.term, 80),
    gclid: str(data.utm?.gclid ?? data.gclid, 120),
  };

  const now = admin.firestore.FieldValue.serverTimestamp();

  // Upsert into `leads` keyed by email (same key the checkout flow uses), so a
  // roadmap lead that later checks out is the same record, not a duplicate.
  const leadRef = db.collection('leads').doc(email);
  const snap = await leadRef.get();

  await leadRef.set(
    {
      email,
      // Segmentation — the reason this experience exists.
      activation: {
        completed: true,
        role: role || null,
        goal: goal || null,
        intendedUse: intendedUse || null,
        techConfidence,
        track: track || null,
        segment: segment || null,
        completedAt: now,
      },
      marketingConsent,
      leadSource: source,
      utm,
      // Don't downgrade a further-along funnel stage if they already checked out.
      status: snap.exists && snap.data()?.status ? snap.data()?.status : 'lead',
      firstSeenAt: snap.exists ? snap.data()?.firstSeenAt || now : now,
      updatedAt: now,
    },
    { merge: true }
  );

  return { ok: true, leadId: email };
});
