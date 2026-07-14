import { describe, it, expect } from 'vitest';
import { generateRoadmap, RoadmapAnswers } from '../src/utils/roadmap';

/**
 * The activation experience's value is a *coherent, personalized* roadmap.
 * These tests lock in the track mapping and that every answer combination
 * yields a complete, non-empty roadmap (no undefined firstBuild cells).
 */
const base: RoadmapAnswers = { role: 'founder', goal: 'ship_agent', techConfidence: 3, intendedUse: 'internal' };

describe('generateRoadmap', () => {
  it('routes low technical confidence to the Foundation track', () => {
    expect(generateRoadmap({ ...base, role: 'exploring', techConfidence: 1 }).track).toBe('Foundation');
  });

  it('routes high technical confidence to the Deployment track', () => {
    expect(generateRoadmap({ ...base, role: 'developer', techConfidence: 5 }).track).toBe('Deployment');
  });

  it('routes mid confidence to the Operator track', () => {
    expect(generateRoadmap({ ...base, role: 'operator', techConfidence: 3 }).track).toBe('Operator');
  });

  it('produces a complete roadmap for every goal × use combination', () => {
    const goals: RoadmapAnswers['goal'][] = ['ship_agent', 'automate_workflow', 'ai_in_product', 'level_up'];
    const uses: RoadmapAnswers['intendedUse'][] = ['internal', 'customer_facing', 'client_work', 'learning'];
    for (const goal of goals) {
      for (const intendedUse of uses) {
        const r = generateRoadmap({ ...base, goal, intendedUse });
        expect(r.firstBuild.length).toBeGreaterThan(10);
        expect(r.weekPlan.length).toBeGreaterThanOrEqual(6);
        expect(r.headline).toContain(r.track);
        expect(r.segment).toBe(`founder:${goal}:${intendedUse}:t3`);
      }
    }
  });

  it('clamps track scoring at the boundaries (never throws)', () => {
    for (const tc of [1, 2, 3, 4, 5] as const) {
      expect(() => generateRoadmap({ ...base, techConfidence: tc })).not.toThrow();
    }
  });
});
