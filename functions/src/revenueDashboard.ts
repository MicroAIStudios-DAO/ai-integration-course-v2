/**
 * First-party revenue & funnel dashboard (server-authoritative).
 *
 * MRR is summed from LIVE Stripe subscription data — the single revenue
 * authority — with annual normalized to monthly and trials excluded (a $1
 * seven-day trial is not recurring revenue). Funnel counts come from Firestore
 * aggregation queries. Admin-gated: the caller's user doc must be isAdmin/role=admin.
 *
 * Deployed as callable getRevenueDashboardV2. Consumed by /admin/revenue.
 */

import Stripe from 'stripe';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { getFirestore } from 'firebase-admin/firestore';

const STRIPE_SECRET = defineSecret('STRIPE_SECRET');

const TARGET_MRR = 10000; // $10k MRR goal

// Normalize a Stripe recurring price to a monthly-equivalent dollar amount.
function toMonthlyDollars(unitAmount: number, interval: string, intervalCount: number, quantity: number): number {
  const cents = unitAmount * quantity;
  let monthlyCents: number;
  switch (interval) {
    case 'year': monthlyCents = cents / (12 * intervalCount); break;
    case 'month': monthlyCents = cents / intervalCount; break;
    case 'week': monthlyCents = (cents * 4.345) / intervalCount; break;
    case 'day': monthlyCents = (cents * 30.44) / intervalCount; break;
    default: monthlyCents = cents; break;
  }
  return monthlyCents / 100;
}

async function computeStripeMrr(stripe: Stripe): Promise<{
  mrr: number;
  activeSubscriptions: number;
  trialingSubscriptions: number;
  mrrByInterval: Record<string, number>;
  pastDueSubscriptions: number;
}> {
  let mrr = 0;
  let activeSubscriptions = 0;
  let trialingSubscriptions = 0;
  let pastDueSubscriptions = 0;
  const mrrByInterval: Record<string, number> = {};

  // status:'all' lets us bucket active vs trialing vs past_due in one sweep.
  for await (const sub of stripe.subscriptions.list({ status: 'all', limit: 100, expand: ['data.items.data.price'] })) {
    if (sub.status === 'trialing') { trialingSubscriptions++; continue; } // not recurring revenue yet
    if (sub.status === 'past_due' || sub.status === 'unpaid') pastDueSubscriptions++;
    if (sub.status !== 'active') continue;

    activeSubscriptions++;
    for (const item of sub.items.data) {
      const price = item.price;
      if (!price?.recurring || typeof price.unit_amount !== 'number') continue;
      const monthly = toMonthlyDollars(
        price.unit_amount,
        price.recurring.interval,
        price.recurring.interval_count || 1,
        item.quantity || 1
      );
      mrr += monthly;
      mrrByInterval[price.recurring.interval] = (mrrByInterval[price.recurring.interval] || 0) + monthly;
    }
  }

  return {
    mrr: Math.round(mrr * 100) / 100,
    activeSubscriptions,
    trialingSubscriptions,
    pastDueSubscriptions,
    mrrByInterval,
  };
}

async function count(query: FirebaseFirestore.Query): Promise<number> {
  try {
    const snap = await query.count().get();
    return snap.data().count;
  } catch {
    return -1; // signal "unavailable" without throwing the whole dashboard
  }
}

export const getRevenueDashboardV2 = onCall(
  { region: 'us-central1', secrets: [STRIPE_SECRET] },
  async (request) => {
    // ── Admin gate ──
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Sign in required.');
    }
    const db = getFirestore();
    const callerSnap = await db.collection('users').doc(uid).get();
    const caller = callerSnap.data() || {};
    if (caller.isAdmin !== true && caller.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Admin access required.');
    }

    // ── Revenue (Stripe = authority) ──
    const secret = process.env.STRIPE_SECRET || STRIPE_SECRET.value();
    let revenue: Awaited<ReturnType<typeof computeStripeMrr>> | null = null;
    let revenueError: string | null = null;
    if (secret) {
      try {
        const stripe = new Stripe(secret, { apiVersion: '2024-06-20' });
        revenue = await computeStripeMrr(stripe);
      } catch (err: any) {
        revenueError = err?.message || 'Stripe read failed';
      }
    } else {
      revenueError = 'STRIPE_SECRET not configured';
    }

    // ── Funnel (Firestore) ──
    const usersCol = db.collection('users');
    const leadsCol = db.collection('leads');
    const sessionsCol = db.collection('checkout_sessions');
    const emailCol = db.collection('email_queue');

    const [
      usersTotal, leadsTotal, sessionsTotal, sessionsExpired, sessionsCompleted,
      emailTotal, emailSent, emailError,
    ] = await Promise.all([
      count(usersCol),
      count(leadsCol),
      count(sessionsCol),
      count(sessionsCol.where('status', '==', 'expired')),
      count(sessionsCol.where('status', '==', 'active')),
      count(emailCol),
      count(emailCol.where('status', '==', 'sent')),
      count(emailCol.where('status', '==', 'error')),
    ]);

    const checkoutCompletionRate = sessionsTotal > 0
      ? Math.round(((sessionsCompleted) / sessionsTotal) * 1000) / 10
      : null;
    const leadToCheckoutRate = leadsTotal > 0
      ? Math.round((sessionsTotal / leadsTotal) * 1000) / 10
      : null;

    const mrr = revenue?.mrr ?? 0;

    return {
      generatedAt: new Date().toISOString(),
      revenue: {
        mrr,
        arr: Math.round(mrr * 12 * 100) / 100,
        targetMrr: TARGET_MRR,
        targetProgressPct: Math.round((mrr / TARGET_MRR) * 1000) / 10,
        activeSubscriptions: revenue?.activeSubscriptions ?? 0,
        trialingSubscriptions: revenue?.trialingSubscriptions ?? 0,
        pastDueSubscriptions: revenue?.pastDueSubscriptions ?? 0,
        mrrByInterval: revenue?.mrrByInterval ?? {},
        error: revenueError,
        // Expansion/churn MRR require historical subscription events; wired in a
        // later pass from Stripe invoice/subscription webhooks. Flagged, not faked.
        expansionMrr: null,
        churnedMrr: null,
      },
      funnel: {
        usersTotal,
        leadsTotal,
        checkoutSessionsTotal: sessionsTotal,
        checkoutSessionsExpired: sessionsExpired,
        checkoutSessionsCompleted: sessionsCompleted,
        checkoutCompletionRatePct: checkoutCompletionRate,
        leadToCheckoutRatePct: leadToCheckoutRate,
      },
      email: {
        queueTotal: emailTotal,
        sent: emailSent,
        error: emailError,
      },
    };
  }
);
