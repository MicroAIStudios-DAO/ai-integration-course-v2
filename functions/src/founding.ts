import admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

if (!admin.apps.length) {
  admin.initializeApp();
}

const CODES_COLLECTION = 'founding_codes';
const FEEDBACK_COLLECTION = 'founder_feedback';

export const redeemFoundingCodeV2 = onCall(
  { region: 'us-central1' },
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

    return { success: true };
  }
);

export const submitFeedbackV2 = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Login required');
    }
    const message = (request.data?.message || '').toString().trim();
    const path = (request.data?.path || '').toString().trim();

    if (!message) {
      throw new HttpsError('invalid-argument', 'Missing message');
    }

    await admin.firestore().collection(FEEDBACK_COLLECTION).add({
      message,
      path,
      uid: request.auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  }
);
