/**
 * /admin/revenue — protected first-party revenue & funnel dashboard.
 *
 * Reads server-authoritative metrics from getRevenueDashboardV2 (MRR summed from
 * live Stripe subscriptions; funnel counts from Firestore). The Cloud Function
 * enforces the admin gate — this page simply renders what it returns and shows a
 * clear message if the caller is not an admin.
 */
import React, { useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

interface DashboardData {
  generatedAt: string;
  revenue: {
    mrr: number; arr: number; targetMrr: number; targetProgressPct: number;
    activeSubscriptions: number; trialingSubscriptions: number; pastDueSubscriptions: number;
    mrrByInterval: Record<string, number>; error: string | null;
    expansionMrr: number | null; churnedMrr: number | null;
  };
  funnel: {
    usersTotal: number; leadsTotal: number; checkoutSessionsTotal: number;
    checkoutSessionsExpired: number; checkoutSessionsCompleted: number;
    checkoutCompletionRatePct: number | null; leadToCheckoutRatePct: number | null;
  };
  email: { queueTotal: number; sent: number; error: number };
}

const usd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const num = (n: number) => (n < 0 ? '—' : n.toLocaleString('en-US'));

const Stat: React.FC<{ label: string; value: string; sub?: string; accent?: boolean }> = ({ label, value, sub, accent }) => (
  <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20 }}>
    <div style={{ color: '#9ca3af', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    <div style={{ color: accent ? '#10b981' : '#fff', fontSize: 28, fontWeight: 800, marginTop: 6 }}>{value}</div>
    {sub && <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>{sub}</div>}
  </div>
);

const AdminRevenuePage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const call = httpsCallable<Record<string, never>, DashboardData>(functions, 'getRevenueDashboardV2');
      const res = await call({});
      setData(res.data);
    } catch (err: any) {
      setError(
        err?.code === 'functions/permission-denied'
          ? 'Admin access required. Sign in with an admin account.'
          : err?.message || 'Failed to load dashboard.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const r = data?.revenue;
  const f = data?.funnel;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', padding: '32px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Revenue &amp; Funnel</h1>
          <button onClick={() => void load()} disabled={loading}
            style={{ background: '#10b981', color: '#000', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, cursor: 'pointer' }}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div style={{ background: '#7f1d1d', border: '1px solid #ef4444', borderRadius: 8, padding: 16, color: '#fca5a5' }}>{error}</div>
        )}

        {r && f && (
          <>
            {/* MRR target progress */}
            <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#9ca3af', fontSize: 12, textTransform: 'uppercase' }}>MRR toward {usd(r.targetMrr)} goal</span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>{usd(r.mrr)} · {r.targetProgressPct}%</span>
              </div>
              <div style={{ height: 12, background: '#1f2937', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, Math.max(0, r.targetProgressPct))}%`, height: '100%', background: 'linear-gradient(90deg,#10b981,#34d399)' }} />
              </div>
              {r.error && <div style={{ color: '#f59e0b', fontSize: 12, marginTop: 8 }}>Stripe: {r.error}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
              <Stat label="MRR" value={usd(r.mrr)} sub={`ARR ${usd(r.arr)}`} accent />
              <Stat label="Active subs" value={num(r.activeSubscriptions)} />
              <Stat label="Trialing" value={num(r.trialingSubscriptions)} sub="not counted in MRR" />
              <Stat label="Past due" value={num(r.pastDueSubscriptions)} />
            </div>

            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '8px 0 12px', color: '#d1d5db' }}>Funnel</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
              <Stat label="Users" value={num(f.usersTotal)} />
              <Stat label="Leads" value={num(f.leadsTotal)} />
              <Stat label="Checkout sessions" value={num(f.checkoutSessionsTotal)} sub={`${num(f.checkoutSessionsExpired)} expired`} />
              <Stat label="Checkout completion" value={f.checkoutCompletionRatePct == null ? '—' : `${f.checkoutCompletionRatePct}%`} />
              <Stat label="Lead → checkout" value={f.leadToCheckoutRatePct == null ? '—' : `${f.leadToCheckoutRatePct}%`} />
            </div>

            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '8px 0 12px', color: '#d1d5db' }}>Email</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <Stat label="Queue total" value={num(data!.email.queueTotal)} />
              <Stat label="Sent" value={num(data!.email.sent)} />
              <Stat label="Errors" value={num(data!.email.error)} />
            </div>

            <p style={{ color: '#4b5563', fontSize: 11, marginTop: 24 }}>
              MRR summed from live Stripe subscriptions (annual normalized to monthly; trials excluded). Funnel from Firestore. Generated {new Date(data!.generatedAt).toLocaleString()}.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminRevenuePage;
