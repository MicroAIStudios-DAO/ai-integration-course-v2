/**
 * Personalized AI-integration roadmap — pure, deterministic logic.
 *
 * Powers the free 10-minute activation experience (/roadmap). Given a few
 * segmentation answers, it produces a tailored track recommendation, a concrete
 * "first build," and a 7-day plan — instant, client-side, no LLM cost. Kept
 * pure so it is unit-tested and reused by onboarding/lifecycle later.
 *
 * The three tracks mirror the existing homepage AIReadinessQuiz buckets so the
 * activation experience is a coherent extension, not a parallel system.
 */

export type Role = 'developer' | 'founder' | 'operator' | 'exploring';
export type Goal = 'ship_agent' | 'automate_workflow' | 'ai_in_product' | 'level_up';
export type IntendedUse = 'internal' | 'customer_facing' | 'client_work' | 'learning';
export type TechConfidence = 1 | 2 | 3 | 4 | 5;

export interface RoadmapAnswers {
  role: Role;
  goal: Goal;
  techConfidence: TechConfidence;
  intendedUse: IntendedUse;
}

export type Track = 'Foundation' | 'Operator' | 'Deployment';

export interface Roadmap {
  track: Track;
  trackReason: string;
  headline: string;
  firstBuild: string;
  weekPlan: string[];
  timeline: string;
  segment: string; // compact machine label for lifecycle/analytics, e.g. "founder:ship_agent:internal:t3"
}

export const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'developer', label: 'Developer / engineer' },
  { value: 'founder', label: 'Technical founder' },
  { value: 'operator', label: 'Operator / consultant' },
  { value: 'exploring', label: 'Exploring — not sure yet' },
];

export const GOAL_OPTIONS: { value: Goal; label: string }[] = [
  { value: 'ship_agent', label: 'Ship my first working AI agent' },
  { value: 'automate_workflow', label: 'Automate a specific repetitive workflow' },
  { value: 'ai_in_product', label: 'Add AI into a product I own' },
  { value: 'level_up', label: 'Level up my AI systems skills' },
];

export const USE_OPTIONS: { value: IntendedUse; label: string }[] = [
  { value: 'internal', label: 'Internal automation for my team' },
  { value: 'customer_facing', label: 'A customer-facing feature' },
  { value: 'client_work', label: 'Client work / consulting deliverables' },
  { value: 'learning', label: 'Learning / building a portfolio' },
];

// Track is driven primarily by technical confidence, nudged by role.
function pickTrack(answers: RoadmapAnswers): { track: Track; trackReason: string } {
  let score = answers.techConfidence; // 1..5
  if (answers.role === 'developer') score += 1;
  if (answers.role === 'exploring') score -= 1;

  if (score <= 2) {
    return {
      track: 'Foundation',
      trackReason: 'You get the systems-thinking groundwork first, so nothing later feels like magic.',
    };
  }
  if (score <= 4) {
    return {
      track: 'Operator',
      trackReason: 'You already move fast — you skip the basics and go straight to wiring reliable workflows.',
    };
  }
  return {
    track: 'Deployment',
    trackReason: 'You can handle depth — you head for production concerns: fault tolerance, evals, and scale.',
  };
}

const FIRST_BUILD: Record<Goal, Record<IntendedUse, string>> = {
  ship_agent: {
    internal: 'A tool-using agent that triages your team’s inbox/tickets and drafts replies for review.',
    customer_facing: 'A support agent that answers from your own docs (RAG) with a human-handoff escape hatch.',
    client_work: 'A reusable client-onboarding agent template you can re-skin per engagement.',
    learning: 'A portfolio-ready research agent that plans, calls tools, and cites its sources.',
  },
  automate_workflow: {
    internal: 'An automation that turns a recurring manual report into a scheduled, self-checking job.',
    customer_facing: 'A workflow that enriches and routes inbound leads with an AI qualification step.',
    client_work: 'A document-processing pipeline (extract → validate → summarize) you can sell as a deliverable.',
    learning: 'A “messy input → structured output” pipeline with graded error handling.',
  },
  ai_in_product: {
    internal: 'An internal copilot wired to your data with the API-first patterns the course teaches.',
    customer_facing: 'A production feature endpoint (auth, rate limits, fallbacks) around a real model call.',
    client_work: 'A white-label AI feature you can drop into client products.',
    learning: 'A minimal but production-shaped AI feature: endpoint, guardrails, and evals.',
  },
  level_up: {
    internal: 'A reference agent you can point teammates at as the “right way” to build here.',
    customer_facing: 'A hardened demo that survives real users — the thing that gets you the next role.',
    client_work: 'A repeatable architecture you can quote and deliver with confidence.',
    learning: 'A build log that takes one agent from prototype to production-grade.',
  },
};

const WEEK_PLAN: Record<Track, string[]> = {
  Foundation: [
    'Day 1 — Map the system: inputs, model, tools, and where it can fail.',
    'Day 2 — Stand up your first working agent from a real template.',
    'Day 3–4 — Add structured I/O and the guardrails that keep it honest.',
    'Day 5 — Add retries + error handling so it survives bad input.',
    'Day 6 — Test it against messy real cases; fix what breaks.',
    'Day 7 — Ship it and decide if it earned its keep.',
  ],
  Operator: [
    'Day 1 — Wire your first end-to-end workflow from a template.',
    'Day 2 — Swap in your real data and tools.',
    'Day 3 — Add the production error handling most tutorials skip.',
    'Day 4–5 — Add evals so you know when it regresses.',
    'Day 6 — Load-test the unhappy paths.',
    'Day 7 — Deploy and hand it off.',
  ],
  Deployment: [
    'Day 1 — Architect for failure: timeouts, retries, idempotency.',
    'Day 2 — Build the agent with API-first, testable seams.',
    'Day 3 — Add evals + observability from the start.',
    'Day 4 — Fault-injection: prove it degrades gracefully.',
    'Day 5 — Cost + latency budget and cache strategy.',
    'Day 6–7 — Ship to production and monitor.',
  ],
};

export function generateRoadmap(answers: RoadmapAnswers): Roadmap {
  const { track, trackReason } = pickTrack(answers);
  const firstBuild = FIRST_BUILD[answers.goal][answers.intendedUse];
  const weekPlan = WEEK_PLAN[track];

  return {
    track,
    trackReason,
    headline: `Your ${track} track — a working build in about a week`,
    firstBuild,
    weekPlan,
    timeline: 'Most people ship their first deployable automation in under 15 minutes, and a real first agent inside week one.',
    segment: `${answers.role}:${answers.goal}:${answers.intendedUse}:t${answers.techConfidence}`,
  };
}
