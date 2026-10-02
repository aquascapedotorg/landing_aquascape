import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  recordKuaciEaten,
  getLeaderboard,
  __resetStreakServiceForTest,
} from './streakService';
import { createDebouncer } from './debounce';

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

describe('createDebouncer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('collapses many rapid calls into a single invocation', () => {
    const fn = vi.fn();
    const trigger = createDebouncer(fn, 2000);
    trigger();
    trigger();
    trigger();
    expect(fn).not.toHaveBeenCalled(); // nothing yet
    vi.advanceTimersByTime(2000);
    expect(fn).toHaveBeenCalledTimes(1); // one refresh for the burst
  });

  it('runs again for a new burst after the window elapses', () => {
    const fn = vi.fn();
    const trigger = createDebouncer(fn, 1000);
    trigger();
    vi.advanceTimersByTime(1000);
    expect(fn).toHaveBeenCalledTimes(1);
    trigger();
    trigger();
    vi.advanceTimersByTime(1000);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('keeps waiting while calls keep coming (trailing edge)', () => {
    const fn = vi.fn();
    const trigger = createDebouncer(fn, 1000);
    trigger();
    vi.advanceTimersByTime(600);
    trigger(); // resets the window
    vi.advanceTimersByTime(600);
    expect(fn).not.toHaveBeenCalled(); // 1200ms passed but window kept resetting
    vi.advanceTimersByTime(400);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
