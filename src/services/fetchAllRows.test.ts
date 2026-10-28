import { describe, it, expect, vi } from 'vitest';
import { fetchAllRows } from './fetchAllRows';

// Fake page source backed by an array, mimicking PostgREST's inclusive range.
function source(total: number, cap = 1000) {
  const rows = Array.from({ length: total }, (_, i) => ({ id: i + 1 }));
  const fetchPage = vi.fn(async (from: number, to: number) => {
    const end = Math.min(to, from + cap - 1); // server never returns more than `cap`
    return { data: rows.slice(from, end + 1), error: null };
  });
  return { rows, fetchPage };
}

describe('fetchAllRows', () => {
  it('returns every row past the 1000-row server cap', async () => {
    const { fetchPage } = source(1015);
    const all = await fetchAllRows(fetchPage, 1000);
    expect(all).toHaveLength(1015);
    expect(all[1014]).toEqual({ id: 1015 });
  });

  it('stops after a short page (single request for small tables)', async () => {
    const { fetchPage } = source(458);
    const all = await fetchAllRows(fetchPage, 1000);
    expect(all).toHaveLength(458);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it('handles an exact multiple of the page size', async () => {
    const { fetchPage } = source(2000);
    const all = await fetchAllRows(fetchPage, 1000);
    expect(all).toHaveLength(2000);
    expect(fetchPage).toHaveBeenCalledTimes(3); // last page empty
  });

  it('throws on a page error so the caller keeps the previous leaderboard', async () => {
    const fetchPage = vi.fn(async () => ({ data: null, error: { message: 'boom' } }));
    await expect(fetchAllRows(fetchPage, 1000)).rejects.toThrow('boom');
  });
});
