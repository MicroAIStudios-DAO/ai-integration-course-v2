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
const PAID_BETA_PLAN_KEY = 'beta_monthly';
const PAID_BETA_PRICE_CENTS = 2999;
const DEFAULT_COHORT_NAME = 'Pioneer';

type AccessCodeType = 'beta' | 'scholarship';

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

const hasPaidAccess = (profile: Record<string, any>): boolean => {
  const subscriptionStatus = (profile.subscriptionStatus || 'none').toString();
  return (
    profile.foundingMember === true ||
    profile.premium === true ||
    subscriptionStatus === 'active' ||
    subscriptionStatus === 'trialing'
  );
};

export const claimBetaTesterV2 = onCall(
  { region: 'us-central1' },
  async (request) => {
    const auth = requireRegisteredAuth(request);

    const code = normalizeBetaCode((request.data?.code || '').toString());
    if (!code) {
      throw new HttpsError('invalid-argument', 'Missing access code');
    }

    const cohortRaw = (request.data?.cohort || 'Pioneer').toString().trim();
    const userRef = admin.firestore().doc(`users/${auth.uid}`);
    const codeRef = admin.firestore().collection(BETA_CODES_COLLECTION).doc(code);
    const claimRef = codeRef.collection('claims').doc(auth.uid);
    let grantPremium = false;
    let accessType: AccessCodeType = 'beta';
    let resolvedCohort = cohortRaw.length > 0 ? cohortRaw : DEFAULT_COHORT_NAME;
    let usesRemaining = 0;
    let maxUses = 1;
    let accessSource = 'paid_beta_code';
    let checkoutPlanKey = PAID_BETA_PLAN_KEY;
    let priceCents = PAID_BETA_PRICE_CENTS;
    let skipCheckout = false;

    await admin.firestore().runTransaction(async (tx) => {
      const codeSnap = await tx.get(codeRef);
      const claimSnap = await tx.get(claimRef);
      const userSnap = await tx.get(userRef);

      if (!codeSnap.exists) {
        throw new HttpsError('permission-denied', 'Invalid access code');
      }

      const codeData = codeSnap.data() || {};
      if (codeData.active === false) {
        throw new HttpsError('failed-precondition', 'This access code is inactive');
      }

      const configuredMaxUses = Number(codeData.maxUses);
      maxUses = Number.isFinite(configuredMaxUses) && configuredMaxUses > 0 ? configuredMaxUses : 1;
      const currentUses = Number(codeData.usesCount || 0);
      grantPremium = codeData.grantPremium === true;
      accessType =
        codeData.accessType === 'scholarship' || grantPremium ? 'scholarship' : 'beta';
      resolvedCohort =
        accessType === 'beta'
          ? (codeData.cohort || cohortRaw || DEFAULT_BETA_SIGNUP_CODE).toString().trim() || DEFAULT_COHORT_NAME
          : '';
      accessSource = (
        codeData.accessSource ||
        (accessType === 'scholarship' ? 'scholarship_code' : 'paid_beta_code')
      ).toString();
      checkoutPlanKey =
        accessType === 'beta'
          ? (codeData.checkoutPlanKey || PAID_BETA_PLAN_KEY).toString()
          : '';
      const configuredPriceCents = Number(codeData.priceCents);
      priceCents =
        accessType === 'beta' &&
        Number.isFinite(configuredPriceCents) &&
        configuredPriceCents > 0
          ? configuredPriceCents
          : accessType === 'beta'
            ? PAID_BETA_PRICE_CENTS
            : 0;

      if (!claimSnap.exists && currentUses >= maxUses) {
        throw new HttpsError('failed-precondition', 'This access code has reached its usage limit');
      }

      const existing = userSnap.data() || {};
      skipCheckout = accessType === 'scholarship' || hasPaidAccess(existing);
      const updateData: Record<string, any> = {
        email: existing.email || auth.token?.email || null,
        displayName: existing.displayName || auth.token?.name || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (accessType === 'beta') {
        updateData.isBetaTester = true;
        updateData.betaCohort = existing.betaCohort || resolvedCohort;
        updateData.betaAccessSource = accessSource;
        updateData.betaAccessCode = existing.betaAccessCode || code;
        updateData.betaPlanKey = existing.betaPlanKey || checkoutPlanKey;
        updateData.betaPriceCents = existing.betaPriceCents || priceCents;
        updateData.betaProgramStatus = skipCheckout ? 'active' : 'awaiting_checkout';
        updateData.scholarshipAccessCode = admin.firestore.FieldValue.delete();
        updateData.scholarshipGrantedAt = admin.firestore.FieldValue.delete();
        updateData.scholarshipAccessSource = admin.firestore.FieldValue.delete();
        updateData.betaScholarshipCode = admin.firestore.FieldValue.delete();
        updateData.betaScholarshipGrantedAt = admin.firestore.FieldValue.delete();

        if (!existing.betaSignupDate) {
          updateData.betaSignupDate = admin.firestore.FieldValue.serverTimestamp();
        }
      } else {
        updateData.isBetaTester = false;
        updateData.premium = true;
        updateData.scholarshipAccessCode = existing.scholarshipAccessCode || code;
        updateData.scholarshipGrantedAt =
          existing.scholarshipGrantedAt || admin.firestore.FieldValue.serverTimestamp();
        updateData.scholarshipAccessSource = accessSource;
        updateData.betaCohort = admin.firestore.FieldValue.delete();
        updateData.betaAccessSource = admin.firestore.FieldValue.delete();
        updateData.betaAccessCode = admin.firestore.FieldValue.delete();
        updateData.betaPlanKey = admin.firestore.FieldValue.delete();
        updateData.betaPriceCents = admin.firestore.FieldValue.delete();
        updateData.betaProgramStatus = admin.firestore.FieldValue.delete();
        updateData.betaSignupDate = admin.firestore.FieldValue.delete();
        updateData.betaScholarshipCode = admin.firestore.FieldValue.delete();
        updateData.betaScholarshipGrantedAt = admin.firestore.FieldValue.delete();
      }

      tx.set(userRef, updateData, { merge: true });

      if (!claimSnap.exists) {
        tx.set(
          claimRef,
          {
            uid: auth.uid,
            code,
            accessType,
            grantPremium,
            ...(accessType === 'beta'
              ? {
                  checkoutPlanKey,
                  priceCents,
                }
              : {}),
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
      accessType,
      cohort: accessType === 'beta' ? resolvedCohort : null,
      grantPremium,
      skipCheckout,
      checkoutRequired: accessType === 'beta' && !skipCheckout,
      checkoutPlanKey: accessType === 'beta' ? checkoutPlanKey : null,
      priceCents,
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
          throw new HttpsError('failed-precondition', 'Code already used');
        }
        throw new HttpsError(
          'failed-precondition',
          'This account already has founding access.'
        );
      }

      if (usedBy && usedBy !== uid) {
        throw new HttpsError('failed-precondition', 'Code already used');
      }

      if (usedBy === uid) {
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

      createdNewRedemption = true;
      tx.set(
        codeRef!,
        {
          active: false,
          status: 'used',
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
          isBetaTester: true,
          betaCohort: userData.betaCohort || DEFAULT_COHORT_NAME,
          betaAccessSource: userData.betaAccessSource || 'founding_code',
          betaProgramStatus: 'active',
          foundingActivatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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
