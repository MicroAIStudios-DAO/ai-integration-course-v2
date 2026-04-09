import admin from 'firebase-admin';
import nodemailer from 'nodemailer';
import {onDocumentCreated} from 'firebase-functions/v2/firestore';
import {onSchedule} from 'firebase-functions/v2/scheduler';
import {defineSecret} from 'firebase-functions/params';

if (!admin.apps.length) {
  admin.initializeApp();
}

const SMTP_USER = defineSecret('SMTP_USER');
const SMTP_PASS = defineSecret('SMTP_PASS');

const DEFAULT_SMTP_HOST = 'smtp.office365.com';
const DEFAULT_SMTP_PORT = 587;
const DEFAULT_FROM_EMAIL = 'support@aiintegrationcourse.com';
const DEFAULT_FROM_NAME = 'AI Integration Course';
const MAX_SEND_ATTEMPTS = 5;
const CLAIMABLE_STATUSES = new Set(['pending', 'retry']);

type EmailQueueDoc = {
  to?: string;
  subject?: string;
  body?: string;
  html?: string;
  replyTo?: string;
  status?: string;
  attempts?: number;
};

let transporter: nodemailer.Transporter | null = null;

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const plainTextToHtml = (body: string): string => {
  const sections = body
    .split(/\n{2,}/)
    .map((section) => section.trim())
    .filter(Boolean)
    .map((section) => `<p>${escapeHtml(section).replace(/\n/g, '<br />')}</p>`);

  return sections.join('');
};

const getTransportConfig = () => {
  const user = process.env.SMTP_USER || SMTP_USER.value() || '';
  const pass = process.env.SMTP_PASS || SMTP_PASS.value() || '';
  const from = process.env.EMAIL_FROM || `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_EMAIL}>`;
  const replyTo = process.env.EMAIL_REPLY_TO || DEFAULT_FROM_EMAIL;
  const host = process.env.SMTP_HOST || DEFAULT_SMTP_HOST;
  const port = Number.parseInt(process.env.SMTP_PORT || `${DEFAULT_SMTP_PORT}`, 10);

  return {
    configured: Boolean(user && pass),
    user,
    pass,
    from,
    replyTo,
    host,
    port: Number.isNaN(port) ? DEFAULT_SMTP_PORT : port,
  };
};

const getTransporter = () => {
  const config = getTransportConfig();

  if (!config.configured) {
    return {transporter: null, config};
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
  }

  return {transporter, config};
};

const getRetryStatus = (attempts: number): 'retry' | 'error' =>
  attempts >= MAX_SEND_ATTEMPTS ? 'error' : 'retry';

const formatError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

async function claimQueueDoc(
  docRef: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>
): Promise<EmailQueueDoc | null> {
  return admin.firestore().runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    if (!snap.exists) {
      return null;
    }

    const data = snap.data() as EmailQueueDoc;
    const status = (data.status || 'pending').toString();

    if (!CLAIMABLE_STATUSES.has(status)) {
      return null;
    }

    tx.update(docRef, {
      status: 'processing',
      lastAttemptedAt: admin.firestore.FieldValue.serverTimestamp(),
      processingStartedAt: admin.firestore.FieldValue.serverTimestamp(),
      attempts: admin.firestore.FieldValue.increment(1),
    });

    return data;
  });
}

async function sendClaimedEmail(
  docRef: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>,
  queueDoc: EmailQueueDoc
): Promise<void> {
  const {transporter, config} = getTransporter();

  if (!transporter) {
    await docRef.set({
      status: queueDoc.status || 'pending',
      deliveryBlockedReason: 'SMTP transport not configured',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, {merge: true});
    console.log(`SMTP not configured. Leaving ${docRef.id} in queue.`);
    return;
  }

  const to = (queueDoc.to || '').trim();
  const subject = (queueDoc.subject || '').trim();
  const body = (queueDoc.body || '').trim();

  if (!to || !subject || !body) {
    await docRef.set({
      status: 'error',
      lastError: 'Email queue item is missing to, subject, or body.',
      failedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, {merge: true});
    console.error(`Email queue item ${docRef.id} is invalid.`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: config.from,
      replyTo: queueDoc.replyTo || config.replyTo,
      to,
      subject,
      text: body,
      html: queueDoc.html || plainTextToHtml(body),
    });

    await docRef.set({
      status: 'sent',
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      processingFinishedAt: admin.firestore.FieldValue.serverTimestamp(),
      deliveryBlockedReason: admin.firestore.FieldValue.delete(),
      lastError: admin.firestore.FieldValue.delete(),
      provider: 'smtp',
      providerHost: config.host,
      providerMessageId: info.messageId || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, {merge: true});

    console.log(`Sent email queue item ${docRef.id} to ${to}`);
  } catch (error) {
    const latest = await docRef.get();
    const latestAttempts = Number(latest.get('attempts') || 1);
    const nextStatus = getRetryStatus(latestAttempts);
    const errorMessage = formatError(error);

    await docRef.set({
      status: nextStatus,
      lastError: errorMessage,
      failedAt: admin.firestore.FieldValue.serverTimestamp(),
      processingFinishedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, {merge: true});

    console.error(`Failed to send email queue item ${docRef.id}: ${errorMessage}`);
  }
}

async function processEmailDoc(
  docRef: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>
): Promise<boolean> {
  const claimedDoc = await claimQueueDoc(docRef);
  if (!claimedDoc) {
    return false;
  }

  await sendClaimedEmail(docRef, claimedDoc);
  return true;
}

export const processEmailQueueV2 = onDocumentCreated(
  {
    region: 'us-central1',
    document: 'email_queue/{docId}',
    secrets: [SMTP_USER, SMTP_PASS],
  },
  async (event) => {
    const snap = event.data;
    if (!snap) {
      return;
    }

    await processEmailDoc(snap.ref);
  }
);

export const drainPendingEmailQueueV2 = onSchedule(
  {
    region: 'us-central1',
    schedule: 'every 10 minutes',
    timeZone: 'America/Los_Angeles',
    secrets: [SMTP_USER, SMTP_PASS],
  },
  async () => {
    const db = admin.firestore();
    const pendingSnap = await db.collection('email_queue')
      .where('status', 'in', ['pending', 'retry'])
      .limit(25)
      .get();

    if (pendingSnap.empty) {
      console.log('Email queue drain found no pending messages.');
      return;
    }

    let processedCount = 0;

    for (const queueDoc of pendingSnap.docs) {
      const processed = await processEmailDoc(queueDoc.ref);
      if (processed) {
        processedCount += 1;
      }
    }

    console.log(`Email queue drain processed ${processedCount} item(s).`);
  }
);
