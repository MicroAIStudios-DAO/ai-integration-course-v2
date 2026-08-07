/**
 * Minimal A/B experiment capability (Phase 4.8).
 *
 * - Sticky assignment: a visitor keeps their variant across visits via
 *   localStorage (`exp:<experimentId>`), so results aren't polluted by
 *   variant-switching.
 * - Exposure events: the first render of an experiment surface fires a GA4
 *   `experiment_exposure` event (experiment_id + variant_id), which is what
 *   makes variant performance measurable against the funnel events
 *   (cta_click → begin_checkout → purchase / trial_start).
 * - No backend, no flags service: variants and weights live in EXPERIMENTS
 *   below. Shipping a real test = adding a variant here and rendering on
 *   `useExperiment(...)`. Both registered experiments currently run 100%
 *   control, so nothing user-visible changes until variants are added.
 *
 * NOTE for the owner: variant COPY is subject to the same rules as all
 * marketing copy — no invented claims, and positioning-level changes go
 * through the Phase 4.1 approval gate first.
 */

import { useEffect, useMemo } from 'react';

export interface ExperimentDef {
  /** Stable id — changing it re-randomizes everyone. */
  id: string;
  /** Variant ids; index 0 is control. */
  variants: string[];
  /** Optional weights (same length, sum > 0). Defaults to uniform. */
  weights?: number[];
}

/**
 * Registered experiments. Both target surfaces from the work plan are wired
 * and idle (single control variant) until real variants are added:
 *
 * - pricing_h1: which headline renders on /pricing. To launch, add e.g.
 *   'systems_first' here and branch on the variant in PricingPage's hero.
 * - trial_target_plan: which plan the $1 trial converts into on renewal
 *   messaging surfaces (monthly vs annual framing). NOTE: changing the
 *   ACTUAL renewal plan is a Stripe/billing change and needs owner approval;
 *   this experiment only selects which framing/copy surface renders.
 */
export const EXPERIMENTS: Record<string, ExperimentDef> = {
  pricing_h1: { id: 'pricing_h1', variants: ['control'] },
  trial_target_plan: { id: 'trial_target_plan', variants: ['control'] },
};

const storageKey = (experimentId: string) => `exp:${experimentId}`;

/** Assign (or recall) this visitor's variant. Safe in SSR/prerender: returns control. */
export function getVariant(experimentId: string): string {
  const def = EXPERIMENTS[experimentId];
  if (!def || def.variants.length === 0) return 'control';
  if (typeof window === 'undefined') return def.variants[0];

  try {
    const stored = window.localStorage.getItem(storageKey(experimentId));
    if (stored && def.variants.includes(stored)) return stored;

    const weights =
      def.weights && def.weights.length === def.variants.length
        ? def.weights
        : def.variants.map(() => 1);
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    let picked = def.variants[0];
    for (let i = 0; i < def.variants.length; i += 1) {
      roll -= weights[i];
      if (roll <= 0) {
        picked = def.variants[i];
        break;
      }
    }
    window.localStorage.setItem(storageKey(experimentId), picked);
    return picked;
  } catch {
    return def.variants[0];
  }
}

function trackExposure(experimentId: string, variantId: string): void {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'experiment_exposure', {
      experiment_id: experimentId,
      variant_id: variantId,
    });
  }
}

/**
 * React hook: returns the sticky variant and fires the exposure event once
 * per mount of the experiment surface.
 */
export function useExperiment(experimentId: string): string {
  const variant = useMemo(() => getVariant(experimentId), [experimentId]);
  useEffect(() => {
    // Exposure only matters once a real test is running.
    if (EXPERIMENTS[experimentId]?.variants.length > 1) {
      trackExposure(experimentId, variant);
    }
  }, [experimentId, variant]);
  return variant;
}
