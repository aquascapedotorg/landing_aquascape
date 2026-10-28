/**
 * Fetches every row of a query by paging with inclusive [from, to] ranges.
 *
 * Supabase/PostgREST caps a single response at 1000 rows (db-max-rows), so a
 * plain `.select()` silently drops everything past row 1000. The streak
 * leaderboard hit this once communal_fishes passed 1000 rows: the newest
 * check-ins were cut off, so today looked unattended and streaks reset to 0.
 *
 * `fetchPage` must return rows in a STABLE order (order by a unique column),
 * otherwise pages can overlap or skip rows.
 */
export async function fetchAllRows<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  pageSize = 1000
): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await fetchPage(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    const rows = data || [];
    all.push(...rows);
    if (rows.length < pageSize) break; // short (or empty) page = last page
  }
  return all;
}
