import { describe, it, expect, beforeEach, vi } from 'vitest';
import { captureAttribution, getStoredAttribution, ATTRIBUTION_KEYS } from '../src/utils/attribution';

/**
 * Revenue-critical: attribution must survive from first landing into checkout.
 * These tests lock in the first-touch semantics and the store/read round-trip
 * that the checkout lead-capture flow depends on.
 */
describe('attribution capture', () => {
  const setUrl = (search: string) => {
    Object.defineProperty(window, 'location', {
      value: { search, pathname: '/', href: `https://x.test/${search}` },
      writable: true,
    });
  };

  beforeEach(() => {
    sessionStorage.clear();
    Object.defineProperty(document, 'referrer', { value: '', configurable: true });
  });

  it('captures UTM + gclid params from the landing URL', () => {
    setUrl('?utm_source=google&utm_medium=cpc&utm_campaign=ai&gclid=abc123');
    captureAttribution();
    const attr = getStoredAttribution();
    expect(attr.utm_source).toBe('google');
    expect(attr.utm_medium).toBe('cpc');
    expect(attr.utm_campaign).toBe('ai');
    expect(attr.gclid).toBe('abc123');
  });

  it('is first-touch: a later navigation does not overwrite the original source', () => {
    setUrl('?utm_source=reddit&utm_medium=organic');
    captureAttribution();
    // Simulate an internal navigation to a page carrying a different source
    setUrl('?utm_source=internal&utm_medium=nav');
    captureAttribution();
    expect(getStoredAttribution().utm_source).toBe('reddit');
    expect(getStoredAttribution().utm_medium).toBe('organic');
  });

  it('omits keys that were never present', () => {
    setUrl('?utm_source=linkedin');
    captureAttribution();
    const attr = getStoredAttribution();
    expect(attr.utm_source).toBe('linkedin');
    expect(attr.gclid).toBeUndefined();
    expect(attr.utm_term).toBeUndefined();
  });

  it('exposes the exact attribution key set the checkout flow reads', () => {
    expect([...ATTRIBUTION_KEYS].sort()).toEqual(
      ['gclid', 'utm_campaign', 'utm_content', 'utm_medium', 'utm_source', 'utm_term'].sort()
    );
  });

  it('never throws when sessionStorage is unavailable', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    setUrl('?utm_source=google');
    expect(() => captureAttribution()).not.toThrow();
    spy.mockRestore();
  });
});

describe('plan key validation (client never sends a price)', () => {
  it('accepts only the four trusted plan keys', async () => {
    const { isPlanKey } = await import('../src/utils/checkout');
    expect(isPlanKey('pro_trial')).toBe(true);
    expect(isPlanKey('pro')).toBe(true);
    expect(isPlanKey('explorer')).toBe(true);
    expect(isPlanKey('corporate')).toBe(true);
    expect(isPlanKey('price_123')).toBe(false);
    expect(isPlanKey('')).toBe(false);
    expect(isPlanKey(null)).toBe(false);
    expect(isPlanKey('free')).toBe(false);
  });
});
