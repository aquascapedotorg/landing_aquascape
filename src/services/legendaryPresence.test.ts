import { describe, it, expect } from 'vitest';
import { hasPendingLegend } from './legendaryPresence';

describe('hasPendingLegend', () => {
  it('returns false when there are no winners today', () => {
    expect(hasPendingLegend([], ['Andi', 'Budi'])).toBe(false);
  });

  it('returns true when a winner is not present on the canvas', () => {
    const winners = [{ name: 'Andi' }];
    expect(hasPendingLegend(winners, ['Budi', 'Citra'])).toBe(true);
  });

  it('returns false when every winner is already on the canvas', () => {
    const winners = [{ name: 'Andi' }, { name: 'Budi' }];
    expect(hasPendingLegend(winners, ['Andi', 'Budi', 'Citra'])).toBe(false);
  });

  it('returns true when only some winners are present', () => {
    const winners = [{ name: 'Andi' }, { name: 'Budi' }];
    expect(hasPendingLegend(winners, ['Andi'])).toBe(true);
  });

  it('trims and collapses whitespace when matching (same as tagLegendary)', () => {
    const winners = [{ name: '  Andi   Wijaya ' }];
    expect(hasPendingLegend(winners, ['Andi Wijaya'])).toBe(false);
  });

  it('treats a differently-cased name as still pending (match is case-sensitive)', () => {
    const winners = [{ name: 'Andi' }];
    expect(hasPendingLegend(winners, ['andi'])).toBe(true);
  });

  it('returns false for null/undefined inputs', () => {
    // @ts-expect-error defensive path
    expect(hasPendingLegend(null, null)).toBe(false);
    // @ts-expect-error defensive path
    expect(hasPendingLegend(undefined, undefined)).toBe(false);
  });
});
