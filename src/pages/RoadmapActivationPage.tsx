/**
 * /roadmap — free 10-minute activation experience (no credit card).
 *
 * Answer four quick questions → capture email at the value exchange → get an
 * instant, personalized AI-integration roadmap on screen → natural $1 trial
 * invitation. Segments the lead (role/goal/technical confidence/intended use)
 * and persists it via submitActivationV2 (falling back to the already-deployed
 * submitLeadMagnetV2 so email capture works even before the new function ships).
 * Progress is saved to localStorage so a refresh never loses answers.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { getStoredAttribution } from '../utils/attribution';
import { trackCTAClick, trackLeadCaptured } from '../utils/analytics';
import {
  ROLE_OPTIONS, GOAL_OPTIONS, USE_OPTIONS,
  generateRoadmap, Role, Goal, IntendedUse, TechConfidence, RoadmapAnswers,
} from '../utils/roadmap';

const STORAGE_KEY = 'roadmap_answers_v1';
const TECH_LABELS = ['', 'New to this', 'Some scripting', 'Comfortable', 'Strong', 'Expert'];

type Partial4 = Partial<RoadmapAnswers>;

const card: React.CSSProperties = { background: '#111827', border: '1px solid #1f2937', borderRadius: 14, padding: 24 };
const optBtn = (active: boolean): React.CSSProperties => ({
  display: 'block', width: '100%', textAlign: 'left', padding: '14px 16px', marginBottom: 10,
  borderRadius: 10, cursor: 'pointer', fontSize: 15,
  background: active ? '#064e3b' : '#1f2937', color: active ? '#fff' : '#d1d5db',
  border: `1px solid ${active ? '#10b981' : '#374151'}`,
});

const RoadmapActivationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0); // 0 intro, 1-4 questions, 5 email, 6 roadmap
  const [answers, setAnswers] = useState<Partial4>({});
  const [email, setEmail] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Restore progress
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setAnswers(JSON.parse(raw));
    } catch { /* ignore */ }
    trackCTAClick('roadmap_view', 'roadmap_activation', searchParams.get('utm_source') || 'direct');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = (next: Partial4) => {
    setAnswers(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const complete = answers.role && answers.goal && answers.techConfidence && answers.intendedUse;
  const roadmap = useMemo(
    () => (complete ? generateRoadmap(answers as RoadmapAnswers) : null),
    [complete, answers]
  );

  const choose = <K extends keyof RoadmapAnswers>(key: K, value: RoadmapAnswers[K], nextStep: number) => {
    persist({ ...answers, [key]: value });
    setStep(nextStep);
  };

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const normalized = email.trim().toLowerCase();
    if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setError('Please enter a valid email so we can save your roadmap.');
      return;
    }
    if (!roadmap) { setError('Please finish the four questions first.'); return; }
    setSaving(true);

    const utm = getStoredAttribution();
    const payload = {
      email: normalized,
      role: answers.role, goal: answers.goal,
      techConfidence: answers.techConfidence, intendedUse: answers.intendedUse,
      track: roadmap.track, segment: roadmap.segment,
      marketingConsent,
      source: `roadmap_${searchParams.get('utm_source') || 'direct'}`,
      utm: { source: utm.utm_source, medium: utm.utm_medium, campaign: utm.utm_campaign, content: utm.utm_content, term: utm.utm_term, gclid: utm.gclid },
    };

    try {
      // Preferred: full segmentation capture.
      await httpsCallable(functions, 'submitActivationV2')(payload);
    } catch {
      // Fallback so email capture still works before submitActivationV2 ships via CI.
      try {
        await httpsCallable(functions, 'submitLeadMagnetV2')({
          email: normalized, source: payload.source,
          leadMagnetId: 'ai-integration-roadmap', pagePath: '/roadmap',
        });
      } catch { /* non-fatal — still show the roadmap the user earned */ }
    }

    trackLeadCaptured('pro_trial', payload.source, 'roadmap', false);
    setSaving(false);
    setStep(6);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', padding: '32px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        {/* progress */}
        {step >= 1 && step <= 5 && (
          <div style={{ height: 6, background: '#1f2937', borderRadius: 3, marginBottom: 24, overflow: 'hidden' }}>
            <div style={{ width: `${(Math.min(step, 5) / 5) * 100}%`, height: '100%', background: '#10b981', transition: 'width .3s' }} />
          </div>
        )}

        {step === 0 && (
          <div style={card}>
            <div style={{ color: '#10b981', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Free · No card · ~2 minutes</div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: '10px 0 12px' }}>Get your personalized AI integration roadmap</h1>
            <p style={{ color: '#9ca3af', fontSize: 15, lineHeight: 1.6, marginBottom: 20 }}>
              Answer four quick questions and get a concrete plan: which track fits you, the exact first agent to build, and a day-by-day week one — the systems-first way, not prompt tips.
            </p>
            <button onClick={() => { setStep(1); trackCTAClick('roadmap_start', 'roadmap_activation', 'start'); }}
              style={{ width: '100%', padding: 15, background: '#10b981', color: '#000', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
              Build my roadmap →
            </button>
          </div>
        )}

        {step === 1 && (
          <div style={card}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>What best describes you?</h2>
            {ROLE_OPTIONS.map((o) => (
              <button key={o.value} style={optBtn(answers.role === o.value)} onClick={() => choose('role', o.value as Role, 2)}>{o.label}</button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div style={card}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>What do you most want to do first?</h2>
            {GOAL_OPTIONS.map((o) => (
              <button key={o.value} style={optBtn(answers.goal === o.value)} onClick={() => choose('goal', o.value as Goal, 3)}>{o.label}</button>
            ))}
            <BackLink onClick={() => setStep(1)} />
          </div>
        )}

        {step === 3 && (
          <div style={card}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>How technical are you, honestly?</h2>
            <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>No wrong answer — it just sets your starting depth.</p>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} style={optBtn(answers.techConfidence === n)} onClick={() => choose('techConfidence', n as TechConfidence, 4)}>
                {n} — {TECH_LABELS[n]}
              </button>
            ))}
            <BackLink onClick={() => setStep(2)} />
          </div>
        )}

        {step === 4 && (
          <div style={card}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>What are you building it for?</h2>
            {USE_OPTIONS.map((o) => (
              <button key={o.value} style={optBtn(answers.intendedUse === o.value)} onClick={() => choose('intendedUse', o.value as IntendedUse, 5)}>{o.label}</button>
            ))}
            <BackLink onClick={() => setStep(3)} />
          </div>
        )}

        {step === 5 && (
          <div style={card}>
            <div style={{ color: '#10b981', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Your roadmap is ready</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: '8px 0 6px' }}>Where should we send it?</h2>
            <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 18 }}>See it on the next screen instantly — we’ll also save it so you can pick up where you left off.</p>
            <form onSubmit={submitEmail} noValidate>
              <input type="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com"
                style={{ width: '100%', padding: '13px 14px', background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#fff', fontSize: 15, boxSizing: 'border-box', marginBottom: 12 }} />
              <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 16, cursor: 'pointer' }}>
                <input type="checkbox" checked={marketingConsent} onChange={(e) => setMarketingConsent(e.target.checked)} style={{ marginTop: 3 }} />
                <span style={{ color: '#9ca3af', fontSize: 12, lineHeight: 1.5 }}>Send me the roadmap plus occasional build tips. Unsubscribe anytime.</span>
              </label>
              {error && <div style={{ background: '#7f1d1d', border: '1px solid #ef4444', borderRadius: 8, padding: '10px 12px', color: '#fca5a5', fontSize: 13, marginBottom: 12 }}>{error}</div>}
              <button type="submit" disabled={saving}
                style={{ width: '100%', padding: 14, background: saving ? '#065f46' : '#10b981', color: '#000', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Saving…' : 'Show my roadmap →'}
              </button>
            </form>
            <BackLink onClick={() => setStep(4)} />
          </div>
        )}

        {step === 6 && roadmap && (
          <div>
            <div style={card}>
              <div style={{ color: '#10b981', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{roadmap.track} track</div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: '8px 0 8px' }}>{roadmap.headline}</h1>
              <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 18 }}>{roadmap.trackReason}</p>

              <div style={{ background: '#0b1220', border: '1px solid #1f2937', borderRadius: 10, padding: 16, marginBottom: 18 }}>
                <div style={{ color: '#f59e0b', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Your first build</div>
                <div style={{ color: '#e5e7eb', fontSize: 15, lineHeight: 1.5 }}>{roadmap.firstBuild}</div>
              </div>

              <div style={{ color: '#d1d5db', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>Your week one</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {roadmap.weekPlan.map((d, i) => (
                  <li key={i} style={{ color: '#cbd5e1', fontSize: 14, padding: '8px 0', borderBottom: i < roadmap.weekPlan.length - 1 ? '1px solid #1f2937' : 'none' }}>{d}</li>
                ))}
              </ul>
              <p style={{ color: '#6b7280', fontSize: 13, marginTop: 16 }}>{roadmap.timeline}</p>
            </div>

            {/* Natural trial invitation */}
            <div style={{ ...card, marginTop: 16, borderColor: '#10b981' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Start building this today for $1</h3>
              <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 14 }}>
                Seven days of full access to build exactly this. $1 today, then $29.99/month unless you cancel before day 8 — backed by the 14-Day Build Guarantee.
              </p>
              <Link to="/checkout/start?plan=pro_trial&utm_source=roadmap&utm_medium=activation&utm_campaign=roadmap_to_trial"
                onClick={() => trackCTAClick('roadmap_to_trial', 'roadmap_activation', 'trial')}
                style={{ display: 'block', textAlign: 'center', padding: 15, background: '#10b981', color: '#000', borderRadius: 10, fontSize: 16, fontWeight: 700, textDecoration: 'none' }}>
                Start my $1 trial →
              </Link>
              <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 12, marginTop: 12 }}>
                Not ready? Your roadmap is saved — <Link to="/pricing" style={{ color: '#10b981' }}>compare plans</Link> or come back anytime.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const BackLink: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button onClick={onClick} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer', marginTop: 8, padding: 0 }}>← Back</button>
);

export default RoadmapActivationPage;
