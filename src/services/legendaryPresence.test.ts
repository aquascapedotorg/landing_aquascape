import { describe, it, expect } from 'vitest';
import { shouldTeaseLegend } from './legendaryPresence';

describe('shouldTeaseLegend', () => {
  it('returns true when no legend has been chosen yet today', () => {
    expect(shouldTeaseLegend([])).toBe(true);
  });

  it('returns false once at least one legend exists today', () => {
    expect(shouldTeaseLegend([{ name: 'Andi' }])).toBe(false);
  });

  it('returns false when multiple legends exist today', () => {
    expect(shouldTeaseLegend([{ name: 'Andi' }, { name: 'Budi' }])).toBe(false);
  });

  it('returns true for null/undefined input (treated as no legends)', () => {
    // @ts-expect-error defensive path
    expect(shouldTeaseLegend(null)).toBe(true);
    // @ts-expect-error defensive path
    expect(shouldTeaseLegend(undefined)).toBe(true);
  });
});
