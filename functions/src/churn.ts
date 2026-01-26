import admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';

if (!admin.apps.length) {
  admin.initializeApp();
}

interface UserSegment {
  uid: string;
  email: string;
  segment: 'window_shopper' | 'cart_abandoner' | 'zombie_user';
  lastActivity: Date;
  daysSinceActivity: number;
}

export const identifyChurnRiskUsersV2 = onSchedule(
  {
    region: 'us-central1',
    schedule: '0 9 * * *',
    timeZone: 'America/Los_Angeles',
  },
  async () => {
    const db = admin.firestore();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const segments: UserSegment[] = [];

    try {
      const windowShoppers = await db.collection('users')
        .where('pricingPageViews', '>', 0)
        .where('checkoutStartedAt', '==', null)
        .where('createdAt', '<', admin.firestore.Timestamp.fromDate(oneDayAgo))
        .limit(100)
        .get();

      for (const doc of windowShoppers.docs) {
        const data = doc.data();
        if (!data.email || data.churnEmailSent?.window_shopper) continue;

        segments.push({
          uid: doc.id,
          email: data.email,
          segment: 'window_shopper',
          lastActivity: data.lastPricingView?.toDate() || data.createdAt?.toDate() || now,
          daysSinceActivity: Math.floor(
            (now.getTime() -
              (data.lastPricingView?.toDate()?.getTime() ||
                data.createdAt?.toDate()?.getTime() ||
                now.getTime())) /
              (24 * 60 * 60 * 1000)
          ),
        });
      }

      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const cartAbandoners = await db.collection('users')
        .where('checkoutStartedAt', '!=', null)
        .where('premium', '==', false)
        .limit(100)
        .get();

      for (const doc of cartAbandoners.docs) {
        const data = doc.data();
        if (!data.email || data.churnEmailSent?.cart_abandoner) continue;

        const checkoutTime = data.checkoutStartedAt?.toDate();
        if (checkoutTime && checkoutTime < oneHourAgo) {
          segments.push({
            uid: doc.id,
            email: data.email,
            segment: 'cart_abandoner',
            lastActivity: checkoutTime,
            daysSinceActivity: Math.floor(
              (now.getTime() - checkoutTime.getTime()) / (24 * 60 * 60 * 1000)
            ),
          });
        }
      }

      const zombieUsers = await db.collection('users')
        .where('premium', '==', true)
        .limit(100)
        .get();

      for (const doc of zombieUsers.docs) {
        const data = doc.data();
        if (!data.email || data.churnEmailSent?.zombie_user) continue;

        const lastLesson = data.lastLessonStartAt?.toDate();
        const purchaseDate = data.lastPaymentAt?.toDate() || data.createdAt?.toDate();

        if (
          (!lastLesson && purchaseDate && purchaseDate < sevenDaysAgo) ||
          (lastLesson && lastLesson < thirtyDaysAgo)
        ) {
          segments.push({
            uid: doc.id,
            email: data.email,
            segment: 'zombie_user',
            lastActivity: lastLesson || purchaseDate || now,
            daysSinceActivity: Math.floor(
              (now.getTime() -
                (lastLesson?.getTime() || purchaseDate?.getTime() || now.getTime())) /
                (24 * 60 * 60 * 1000)
            ),
          });
        }
      }

      const batch = db.batch();

      for (const segment of segments) {
        const recoveryRef = db.collection('churn_recovery').doc();
        batch.set(recoveryRef, {
          uid: segment.uid,
          email: segment.email,
          segment: segment.segment,
          daysSinceActivity: segment.daysSinceActivity,
          identifiedAt: admin.firestore.FieldValue.serverTimestamp(),
          emailSent: false,
          status: 'pending',
        });

        const userRef = db.doc(`users/${segment.uid}`);
        batch.update(userRef, {
          churnSegment: segment.segment,
          churnIdentifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      await batch.commit();

      console.log(`Identified ${segments.length} users for churn recovery:`, {
        window_shoppers: segments.filter((s) => s.segment === 'window_shopper').length,
        cart_abandoners: segments.filter((s) => s.segment === 'cart_abandoner').length,
        zombie_users: segments.filter((s) => s.segment === 'zombie_user').length,
      });

      console.log(`Churn recovery identification complete: ${segments.length} users.`);
      return;
    } catch (error: any) {
      console.error('Error identifying churn risk users:', error);
      throw new Error(error.message);
    }
  }
);

export const processChurnRecoveryEmailV2 = onDocumentCreated(
  { region: 'us-central1', document: 'churn_recovery/{docId}' },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const data = snap.data();
    const { uid, email, segment, daysSinceActivity } = data;

    const emailTemplates = {
      window_shopper: {
        subject: "Is it the price? Let's talk about your AI journey",
        body: `Hi there,

I noticed you checked out our AI Integration Course but didn't take the next step. I get it - investing in yourself can feel like a big decision.

Here's the thing: our students typically save 10+ hours per week after implementing just ONE automation from our course. That's 520+ hours per year.

At $49/month, that's less than $1 per hour saved. And with our 14-Day Build-Your-First-Bot Guarantee, you literally can't lose.

What's holding you back?
- Is it the price? Reply and let's discuss options.
- Not sure if it's right for you? Let me know your use case.
- Need more info? Check out our free preview lessons.

Your AI-powered future is waiting.

Best,
The AI Integration Course Team

P.S. Reply to this email - I read every response personally.`,
      },
      cart_abandoner: {
        subject: 'Your checkout is waiting (14-day guarantee inside)',
        body: `Hi there,

You were SO close to starting your AI integration journey! Your checkout session is still waiting for you.

I know life gets busy, so here's a quick reminder of what you're getting:

- Build your first working bot in 14 days (guaranteed)
- Step-by-step tutorials with real business applications
- AI tutor available 24/7 to answer your questions
- Lifetime access to all course materials

Remember: If you don't build a working bot in 14 days, you get a full refund. No questions asked.

Ready to continue? Click here to complete your enrollment:
https://aiintegrationcourse.com/signup

Questions? Just reply to this email.

Best,
The AI Integration Course Team`,
      },
      zombie_user: {
        subject: 'We miss you! Your AI bot is waiting to be built',
        body: `Hi there,

It's been ${daysSinceActivity} days since we've seen you in the course. Your AI journey doesn't have to end here!

I know getting started can feel overwhelming, so here's a simple challenge:

This week, spend just 15 minutes on the "Build Your First Bot" lesson.

That's it. Just 15 minutes. You'll be amazed at what you can accomplish.

Here's your direct link to get started:
https://aiintegrationcourse.com/courses

Need help? Our AI tutor is available 24/7, and you can always reply to this email.

Remember: You have a 14-Day Build-Your-First-Bot Guarantee. Let's make sure you claim it!

Rooting for you,
The AI Integration Course Team

P.S. What's been the biggest blocker for you? Reply and let me know - I'd love to help.`,
      },
    };

    const template = emailTemplates[segment as keyof typeof emailTemplates];
    if (!template) {
      console.error(`Unknown segment: ${segment}`);
      return;
    }

    try {
      await admin.firestore().collection('email_queue').add({
        to: email,
        subject: template.subject,
        body: template.body,
        segment,
        userId: uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'pending',
        type: 'churn_recovery',
      });

      await snap.ref.update({
        emailSent: true,
        emailQueuedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'queued',
      });

      await admin.firestore().doc(`users/${uid}`).update({
        [`churnEmailSent.${segment}`]: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Queued churn recovery email for ${email} (segment: ${segment})`);
    } catch (error: any) {
      console.error(`Error processing churn recovery email for ${uid}:`, error);
      await snap.ref.update({
        status: 'error',
        error: error.message,
      });
    }
  }
);

export const trackPricingPageViewV2 = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      return { success: true, anonymous: true };
    }

    const uid = request.auth.uid;

    try {
      await admin.firestore().doc(`users/${uid}`).update({
        pricingPageViews: admin.firestore.FieldValue.increment(1),
        lastPricingView: admin.firestore.FieldValue.serverTimestamp(),
      });
      return { success: true };
    } catch (error: any) {
      console.error(`Error tracking pricing view for ${uid}:`, error);
      return { success: false, error: error.message };
    }
  }
);

export const trackCheckoutStartV2 = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Login required');
    }

    const uid = request.auth.uid;

    try {
      await admin.firestore().doc(`users/${uid}`).update({
        checkoutStartedAt: admin.firestore.FieldValue.serverTimestamp(),
        checkoutAttempts: admin.firestore.FieldValue.increment(1),
      });
      return { success: true };
    } catch (error: any) {
      console.error(`Error tracking checkout start for ${uid}:`, error);
      return { success: false, error: error.message };
    }
  }
);

export const trackLessonStartV2 = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Login required');
    }

    const uid = request.auth.uid;
    const { lessonId, lessonTitle, moduleId } = request.data || {};

    try {
      await admin.firestore().doc(`users/${uid}`).update({
        lastLessonStartAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLessonId: lessonId || null,
        lastLessonTitle: lessonTitle || null,
        lessonsStarted: admin.firestore.FieldValue.increment(1),
      });

      await admin.firestore().collection(`users/${uid}/lesson_activity`).add({
        lessonId,
        lessonTitle,
        moduleId,
        action: 'start',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true };
    } catch (error: any) {
      console.error(`Error tracking lesson start for ${uid}:`, error);
      return { success: false, error: error.message };
    }
  }
);

export const manualChurnRecoveryRunV2 = onCall(
  { region: 'us-central1', timeoutSeconds: 300 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Login required');
    }

    const db = admin.firestore();
    const now = new Date();

    const windowShoppers = await db.collection('users')
      .where('pricingPageViews', '>', 0)
      .where('premium', '==', false)
      .get();

    const cartAbandoners = await db.collection('users')
      .where('checkoutStartedAt', '!=', null)
      .where('premium', '==', false)
      .get();

    const zombieUsers = await db.collection('users')
      .where('premium', '==', true)
      .get();

    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const actualZombies = zombieUsers.docs.filter((doc) => {
      const data = doc.data();
      const lastLesson = data.lastLessonStartAt?.toDate();
      return !lastLesson || lastLesson < thirtyDaysAgo;
    });

    return {
      summary: {
        window_shoppers: windowShoppers.size,
        cart_abandoners: cartAbandoners.size,
        zombie_users: actualZombies.length,
        total_at_risk: windowShoppers.size + cartAbandoners.size + actualZombies.length,
      },
      timestamp: now.toISOString(),
    };
  }
);
