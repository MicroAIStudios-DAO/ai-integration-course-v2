import admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import fetch from 'node-fetch';

if (!admin.apps.length) {
  admin.initializeApp();
}

const CODES_COLLECTION = 'founding_codes';
const BETA_CODES_COLLECTION = 'beta_access_codes';
const FEEDBACK_COLLECTION = 'founder_feedback';
const WEBHOOK_URL = defineSecret('FEEDBACK_WEBHOOK_URL');
const DEFAULT_BETA_SIGNUP_CODE = 'PIONEER';

const DAYS_30_MS = 30 * 24 * 60 * 60 * 1000;

const requireRegisteredAuth = (request: any) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Login required');
  }

  const auth = request.auth;
  const provider = auth.token?.firebase?.sign_in_provider;
  if (provider === 'anonymous') {
    throw new HttpsError(
      'failed-precondition',
      'Please sign in or create your account before continuing.'
    );
  }

  return auth;
};

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

const normalizeAlnum = (value: string): string =>
  value.toUpperCase().replace(/[^A-Z0-9]/g, '');

const stripFoundingPrefix = (value: string): string =>
  value.startsWith('FOUNDING') ? value.slice('FOUNDING'.length) : value;

const hasValidGroupedCode = (value: string): boolean =>
  value.length >= 4 && value.length <= 24 && value.length % 4 === 0;

const toGroupedCode = (value: string): string =>
  (value.match(/.{1,4}/g) || []).join(' ');

const toLookupCandidates = (input: string): string[] => {
  const rawUpper = input.trim().toUpperCase();
  const normalized = normalizeAlnum(rawUpper);
  const core = stripFoundingPrefix(normalized);
  const grouped = toGroupedCode(core);

  const candidates = [
    rawUpper,
    core,
    grouped,
    `FOUNDING-${core}`,
    `FOUNDING-${grouped}`,
  ]
    .map((entry) => entry.trim())
    .filter(Boolean);

  return Array.from(new Set(candidates));
};

const normalizeBetaCode = (value: string): string =>
  value.toUpperCase().replace(/\s+/g, '').trim();

export const claimBetaTesterV2 = onCall(
  { region: 'us-central1' },
  async (request) => {
    const auth = requireRegisteredAuth(request);

    const code = normalizeBetaCode((request.data?.code || '').toString());
    if (!code) {
      throw new HttpsError('invalid-argument', 'Missing beta code');
    }

    const cohortRaw = (request.data?.cohort || 'Pioneer').toString().trim();
    const userRef = admin.firestore().doc(`users/${auth.uid}`);
    const codeRef = admin.firestore().collection(BETA_CODES_COLLECTION).doc(code);
    const claimRef = codeRef.collection('claims').doc(auth.uid);
    let grantPremium = false;
    let resolvedCohort = cohortRaw.length > 0 ? cohortRaw : 'Pioneer';
    let usesRemaining = 0;
    let maxUses = 1;
    let accessSource = 'signup_offer_code';

    await admin.firestore().runTransaction(async (tx) => {
      const codeSnap = await tx.get(codeRef);
      const claimSnap = await tx.get(claimRef);
      const userSnap = await tx.get(userRef);

      if (!codeSnap.exists) {
        throw new HttpsError('permission-denied', 'Invalid beta code');
      }

      const codeData = codeSnap.data() || {};
      if (codeData.active === false) {
        throw new HttpsError('failed-precondition', 'This beta code is inactive');
      }

      const configuredMaxUses = Number(codeData.maxUses);
      maxUses = Number.isFinite(configuredMaxUses) && configuredMaxUses > 0 ? configuredMaxUses : 1;
      const currentUses = Number(codeData.usesCount || 0);
      grantPremium = codeData.grantPremium === true;
      resolvedCohort =
        (codeData.cohort || cohortRaw || DEFAULT_BETA_SIGNUP_CODE).toString().trim() || 'Pioneer';
      accessSource = grantPremium ? 'beta_scholarship_code' : 'signup_offer_code';

      if (!claimSnap.exists && currentUses >= maxUses) {
        throw new HttpsError('failed-precondition', 'This beta code has reached its usage limit');
      }

      const existing = userSnap.data() || {};
      const updateData: Record<string, any> = {
        email: existing.email || auth.token?.email || null,
        displayName: existing.displayName || auth.token?.name || null,
        isBetaTester: true,
        betaCohort: existing.betaCohort || resolvedCohort,
        betaAccessSource: accessSource,
        betaAccessCode: existing.betaAccessCode || code,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (!existing.betaSignupDate) {
        updateData.betaSignupDate = admin.firestore.FieldValue.serverTimestamp();
      }

      if (grantPremium) {
        updateData.premium = true;
        updateData.betaScholarshipCode = existing.betaScholarshipCode || code;
        if (!existing.betaScholarshipGrantedAt) {
          updateData.betaScholarshipGrantedAt = admin.firestore.FieldValue.serverTimestamp();
        }
      }

      tx.set(userRef, updateData, { merge: true });

      if (!claimSnap.exists) {
        tx.set(
          claimRef,
          {
            uid: auth.uid,
            code,
            grantPremium,
            claimedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        tx.set(
          codeRef,
          {
            code,
            usesCount: admin.firestore.FieldValue.increment(1),
            lastClaimedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        usesRemaining = Math.max(maxUses - (currentUses + 1), 0);
      } else {
        usesRemaining = Math.max(maxUses - currentUses, 0);
      }
    });

    return {
      success: true,
      cohort: resolvedCohort,
      grantPremium,
      skipCheckout: grantPremium,
      maxUses,
      usesRemaining,
    };
  }
);

export const redeemFoundingCodeV2 = onCall(
  { region: 'us-central1', secrets: [WEBHOOK_URL] },
  async (request) => {
    const auth = requireRegisteredAuth(request);
    const codeInput = (request.data?.code || '').toString().trim();
    if (!codeInput) {
      throw new HttpsError('invalid-argument', 'Missing code');
    }

    const normalized = stripFoundingPrefix(normalizeAlnum(codeInput));
    if (!hasValidGroupedCode(normalized)) {
      throw new HttpsError(
        'invalid-argument',
        'Invalid code format. Use 4-character groups like A1B2 C3D4.'
      );
    }

    const candidates = toLookupCandidates(codeInput);
    let resolvedCode = '';
    let codeRef: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData> | null = null;
    let codeSnap: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData> | null = null;

    for (const candidate of candidates) {
      const ref = admin.firestore().collection(CODES_COLLECTION).doc(candidate);
      const snap = await ref.get();
      if (snap.exists) {
        resolvedCode = candidate;
        codeRef = ref;
        codeSnap = snap;
        break;
      }
    }

    if (!codeRef || !codeSnap || !codeSnap.exists) {
      throw new HttpsError('not-found', 'Invalid code');
    }

    const uid = auth.uid;
    const userRef = admin.firestore().doc(`users/${uid}`);
    let createdNewRedemption = false;

    await admin.firestore().runTransaction(async (tx) => {
      const liveCodeSnap = await tx.get(codeRef!);
      if (!liveCodeSnap.exists) {
        throw new HttpsError('not-found', 'Invalid code');
      }

      const userSnap = await tx.get(userRef);
      const userData = userSnap.data() || {};
      const data = liveCodeSnap.data() || {};
      const usedBy = data.usedBy || null;
      const existingFoundingCode = userData.foundingCode || null;

      if (userData.foundingMember === true) {
        if (existingFoundingCode === resolvedCode || usedBy === uid) {
          return;
        }
        throw new HttpsError(
          'failed-precondition',
          'This account already has founding access.'
        );
      }

      if (usedBy && usedBy !== uid) {
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

      if (usedBy === uid) {
        tx.set(
          userRef,
          {
            foundingMember: true,
            foundingCode: existingFoundingCode || resolvedCode,
            foundingActivatedAt:
              userData.foundingActivatedAt || admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        return;
      }

      createdNewRedemption = true;
      tx.set(
        codeRef!,
        {
          usedBy: uid,
          usedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      tx.set(
        userRef,
        {
          email: userData.email || auth.token?.email || null,
          displayName: userData.displayName || auth.token?.name || null,
          foundingMember: true,
          foundingCode: resolvedCode,
          foundingActivatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    if (createdNewRedemption) {
      await sendWebhook({
        type: 'founding_code_redeemed',
        code: resolvedCode,
        uid,
        redeemedAt: new Date().toISOString(),
      });
    }

    return { success: true, alreadyRedeemed: !createdNewRedemption };
  }
);

export const submitFeedbackV2 = onCall(
  { region: 'us-central1', secrets: [WEBHOOK_URL] },
  async (request) => {
    const auth = requireRegisteredAuth(request);
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
      uid: auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await sendWebhook({
      type: 'founder_feedback',
      message,
      path,
      screenshotUrl: screenshotUrl || null,
      uid: auth.uid,
      createdAt: new Date().toISOString(),
    });

    return { success: true };
  }
);
