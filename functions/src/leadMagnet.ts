import admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

if (!admin.apps.length) {
  admin.initializeApp();
}

const LEAD_MAGNET_COLLECTION = 'lead_magnet_signups';
const DEFAULT_LEAD_MAGNET_ID = 'top-5-ai-automation-workflows-2026';
const DEFAULT_DOWNLOAD_PATH = '/assets/top-5-ai-automation-workflows-2026.html';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeText = (value: unknown, fallback = ''): string => {
  if (typeof value !== 'string') return fallback;
  return value.trim().slice(0, 500);
};

const normalizeEmail = (value: unknown): string => normalizeText(value).toLowerCase();

const buildDocId = (leadMagnetId: string, email: string): string =>
  Buffer.from(`${leadMagnetId}:${email}`).toString('hex');

export const submitLeadMagnetV2 = onCall(
  { region: 'us-central1' },
  async (request) => {
    const email = normalizeEmail(request.data?.email);
    if (!EMAIL_PATTERN.test(email)) {
      throw new HttpsError('invalid-argument', 'Enter a valid email address.');
    }

    const leadMagnetId =
      normalizeText(request.data?.leadMagnetId, DEFAULT_LEAD_MAGNET_ID) || DEFAULT_LEAD_MAGNET_ID;
    const source = normalizeText(request.data?.source, 'site_unknown') || 'site_unknown';
    const pagePath = normalizeText(request.data?.pagePath, '/') || '/';
    const referrer = normalizeText(request.data?.referrer, '');
    const userAgent = normalizeText(request.rawRequest.get('user-agent'), '');

    const docRef = admin
      .firestore()
      .collection(LEAD_MAGNET_COLLECTION)
      .doc(buildDocId(leadMagnetId, email));
    const existingSnap = await docRef.get();

    const basePayload: Record<string, any> = {
      email,
      leadMagnetId,
      source,
      pagePath,
      referrer: referrer || null,
      userAgent: userAgent || null,
      downloadPath: DEFAULT_DOWNLOAD_PATH,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (request.auth?.uid) {
      basePayload.uid = request.auth.uid;
    }

    await docRef.set(
      existingSnap.exists
        ? basePayload
        : {
            ...basePayload,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            firstSource: source,
            firstPagePath: pagePath,
            status: 'new',
          },
      { merge: true }
    );

    return {
      success: true,
      leadMagnetId,
      downloadPath: DEFAULT_DOWNLOAD_PATH,
    };
  }
);
