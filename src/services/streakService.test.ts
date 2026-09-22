import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  recordKuaciEaten,
  getLeaderboard,
  __resetStreakServiceForTest,
} from './streakService';

describe('streakService buffer', () => {
  beforeEach(() => {
    __resetStreakServiceForTest();
  });

  it('starts with an empty leaderboard before init', () => {
    expect(getLeaderboard()).toEqual([]);
  });

  it('accepts recordKuaciEaten without throwing when not initialised', () => {
    expect(() => recordKuaciEaten('Budi', 3)).not.toThrow();
  });

  it('ignores empty names', () => {
    expect(() => recordKuaciEaten('', 1)).not.toThrow();
    expect(() => recordKuaciEaten('   ', 1)).not.toThrow();
  });
});
