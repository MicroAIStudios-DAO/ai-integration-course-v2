import admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import fetch from 'node-fetch';

if (!admin.apps.length) {
  admin.initializeApp();
}

const CODES_COLLECTION = 'founding_codes';
const FEEDBACK_COLLECTION = 'founder_feedback';
const WEBHOOK_URL = defineSecret('FEEDBACK_WEBHOOK_URL');

const DAYS_30_MS = 30 * 24 * 60 * 60 * 1000;

const sendWebhook = async (payload: Record<string, any>) => {
  const url = WEBHOOK_URL.value();
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // Best-effort; no-op on webhook failure
  }
};

export const redeemFoundingCodeV2 = onCall(
  { region: 'us-central1', secrets: [WEBHOOK_URL] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Login required');
    }
    const code = (request.data?.code || '').toString().trim().toUpperCase();
    if (!code) {
      throw new HttpsError('invalid-argument', 'Missing code');
    }

    const codeRef = admin.firestore().collection(CODES_COLLECTION).doc(code);
    const codeSnap = await codeRef.get();
    if (!codeSnap.exists) {
      throw new HttpsError('not-found', 'Invalid code');
    }

    const data = codeSnap.data() || {};
    if (data.usedBy) {
      throw new HttpsError('failed-precondition', 'Code already used');
    }

    const now = new Date();
    const expiresAt = data.expiresAt?.toDate?.();
    if (expiresAt && expiresAt < now) {
      throw new HttpsError('failed-precondition', 'Code expired');
    }
    const createdAt = data.createdAt?.toDate?.();
    if (!expiresAt && createdAt && createdAt.getTime() + DAYS_30_MS < now.getTime()) {
      throw new HttpsError('failed-precondition', 'Code expired');
    }

    await codeRef.set(
      {
        usedBy: request.auth.uid,
        usedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await admin.firestore().doc(`users/${request.auth.uid}`).set(
      {
        foundingMember: true,
        foundingCode: code,
        foundingActivatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await sendWebhook({
      type: 'founding_code_redeemed',
      code,
      uid: request.auth.uid,
      redeemedAt: new Date().toISOString(),
    });

    return { success: true };
  }
);

export const submitFeedbackV2 = onCall(
  { region: 'us-central1', secrets: [WEBHOOK_URL] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Login required');
    }
    const message = (request.data?.message || '').toString().trim();
    const path = (request.data?.path || '').toString().trim();
    const screenshotUrl = (request.data?.screenshotUrl || '').toString().trim();

    if (!message) {
      throw new HttpsError('invalid-argument', 'Missing message');
    }

    await admin.firestore().collection(FEEDBACK_COLLECTION).add({
      message,
      path,
      screenshotUrl: screenshotUrl || null,
      uid: request.auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await sendWebhook({
      type: 'founder_feedback',
      message,
      path,
      screenshotUrl: screenshotUrl || null,
      uid: request.auth.uid,
      createdAt: new Date().toISOString(),
    });

    return { success: true };
  }
);
