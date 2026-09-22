export interface AttendanceRow {
  name: string;
  entry_date: string; // YYYY-MM-DD
}

export interface KuaciRow {
  name: string;
  entry_date: string; // YYYY-MM-DD
  kuaci_count: number;
}

export interface LeaderboardEntry {
  name: string;
  currentStreak: number;
  bestStreak: number;
  kuaciInStreak: number;
  rank: number;
}

export function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function shiftDate(dateStr: string, deltaDays: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + deltaDays);
  return toDateString(dt);
}

/**
 * Longest run of consecutive calendar days present in the sorted-unique set.
 */
function computeBestStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const set = new Set(dates);
  let best = 0;
  for (const d of dates) {
    // Only start counting from a run's beginning (no previous day present).
    if (set.has(shiftDate(d, -1))) continue;
    let len = 1;
    let cursor = d;
    while (set.has(shiftDate(cursor, 1))) {
      cursor = shiftDate(cursor, 1);
      len++;
    }
    if (len > best) best = len;
  }
  return best;
}

/**
 * Current streak: consecutive days counting back from today if present,
 * else from yesterday if present, else 0.
 */
function computeCurrentStreak(dateSet: Set<string>, today: string): { streak: number; days: string[] } {
  let anchor: string | null = null;
  if (dateSet.has(today)) anchor = today;
  else if (dateSet.has(shiftDate(today, -1))) anchor = shiftDate(today, -1);

  if (!anchor) return { streak: 0, days: [] };

  const days: string[] = [];
  let cursor = anchor;
  while (dateSet.has(cursor)) {
    days.push(cursor);
    cursor = shiftDate(cursor, -1);
  }
  return { streak: days.length, days };
}

export function computeLeaderboard(
  attendance: AttendanceRow[],
  kuaci: KuaciRow[],
  today: string
): LeaderboardEntry[] {
  // Group attendance dates per name (unique).
  const datesByName = new Map<string, Set<string>>();
  for (const row of attendance) {
    if (!row || !row.name || !row.entry_date) continue;
    if (!datesByName.has(row.name)) datesByName.set(row.name, new Set());
    datesByName.get(row.name)!.add(row.entry_date);
  }

  // Kuaci lookup: name -> (date -> count)
  const kuaciByName = new Map<string, Map<string, number>>();
  for (const row of kuaci) {
    if (!row || !row.name) continue;
    if (!kuaciByName.has(row.name)) kuaciByName.set(row.name, new Map());
    kuaciByName.get(row.name)!.set(row.entry_date, row.kuaci_count || 0);
  }

  const entries: LeaderboardEntry[] = [];
  for (const [name, dateSet] of datesByName) {
    const sorted = [...dateSet].sort();
    const { streak, days } = computeCurrentStreak(dateSet, today);
    const bestStreak = Math.max(computeBestStreak(sorted), streak);

    let kuaciInStreak = 0;
    const kMap = kuaciByName.get(name);
    if (kMap) {
      for (const d of days) kuaciInStreak += kMap.get(d) || 0;
    }

    entries.push({ name, currentStreak: streak, bestStreak, kuaciInStreak, rank: 0 });
  }

  entries.sort((a, b) => {
    if (b.currentStreak !== a.currentStreak) return b.currentStreak - a.currentStreak;
    if (b.kuaciInStreak !== a.kuaciInStreak) return b.kuaciInStreak - a.kuaciInStreak;
    if (b.bestStreak !== a.bestStreak) return b.bestStreak - a.bestStreak;
    return a.name.localeCompare(b.name);
  });

  entries.forEach((e, i) => (e.rank = i + 1));
  return entries;
}
