import { describe, it, expect } from 'vitest';
import { countViewers } from './presenceService';

describe('countViewers', () => {
  it('returns 0 for an empty presence state', () => {
    expect(countViewers({})).toBe(0);
  });

  it('counts each distinct presence key as one viewer', () => {
    const state = {
      'key-a': [{ online_at: 1 }],
      'key-b': [{ online_at: 2 }],
      'key-c': [{ online_at: 3 }],
    };
    expect(countViewers(state)).toBe(3);
  });

  it('counts a key once even if it has multiple presence entries', () => {
    const state = {
      'key-a': [{ online_at: 1 }, { online_at: 2 }],
      'key-b': [{ online_at: 3 }],
    };
    expect(countViewers(state)).toBe(2);
  });

  it('ignores keys whose presence list is empty', () => {
    const state = {
      'key-a': [{ online_at: 1 }],
      'key-empty': [],
    };
    expect(countViewers(state)).toBe(1);
  });

  it('returns 0 for null/undefined input', () => {
    // @ts-expect-error testing defensive path
    expect(countViewers(null)).toBe(0);
    // @ts-expect-error testing defensive path
    expect(countViewers(undefined)).toBe(0);
  });
});
