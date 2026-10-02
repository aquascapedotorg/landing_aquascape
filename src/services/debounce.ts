/**
 * Trailing-edge debouncer. Returns a trigger function; calling it (re)starts a
 * timer, and `fn` runs once `waitMs` has elapsed since the LAST call. Bursts of
 * rapid triggers collapse into a single `fn` invocation.
 *
 * Used to coalesce Realtime events (e.g. many fish/kuaci changes arriving at
 * once) into a single leaderboard refresh, so N viewers no longer each run a
 * full-table SELECT per write — the main Disk IO saving on the free plan.
 */
export function createDebouncer(fn: () => void, waitMs: number): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn();
    }, waitMs);
  };
}
