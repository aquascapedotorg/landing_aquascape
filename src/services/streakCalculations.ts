export interface AttendanceRow {
  name: string;
  entry_date: string; // YYYY-MM-DD
  created_at?: string; // ISO string, used for firstSeen tie-break
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
  firstSeen: string; // MIN(created_at) or '' when unknown
  rank: number;
}

export function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function shiftDate(dateStr: string, deltaDays: number): string {
  const dt = parseDate(dateStr);
  dt.setDate(dt.getDate() + deltaDays);
  return toDateString(dt);
}

function isWeekend(dateStr: string): boolean {
  const day = parseDate(dateStr).getDay(); // 0 = Sun, 6 = Sat
  return day === 0 || day === 6;
}

/**
 * A skip day (weekend or holiday) bridges a streak: it never breaks it and
 * never adds to the count.
 */
export function isSkipDay(dateStr: string, holidays: Set<string>): boolean {
  return isWeekend(dateStr) || holidays.has(dateStr);
}

/**
 * Current streak counting back from `today`, skipping weekends/holidays.
 * A missed WORKING day breaks the streak. Skip days bridge but don't count.
 * Returns the streak length and the list of attended working days in it.
 */
function computeCurrentStreak(
  dateSet: Set<string>,
  today: string,
  holidays: Set<string>
): { streak: number; days: string[] } {
  const days: string[] = [];
  let cursor = today;

  // Walk backwards day by day. We stop only when a WORKING day is unattended.
  // Bound the walk to avoid infinite loops on pathological data.
  for (let guard = 0; guard < 3660; guard++) {
    if (isSkipDay(cursor, holidays)) {
      // Skip days never break and never count; just step back.
      cursor = shiftDate(cursor, -1);
      continue;
    }
    // Working day:
    if (dateSet.has(cursor)) {
      days.push(cursor);
      cursor = shiftDate(cursor, -1);
    } else {
      // Unattended working day breaks the streak.
      break;
    }
  }

  return { streak: days.length, days };
}

/**
 * Longest run of attended working days where gaps are only skip days.
 * Walk each attended date forward through skip days to the next working day.
 */
function computeBestStreak(dates: string[], holidays: Set<string>): number {
  if (dates.length === 0) return 0;
  const set = new Set(dates);

  // Next working day strictly after dateStr.
  const nextWorkingDay = (dateStr: string): string => {
    let c = shiftDate(dateStr, 1);
    let guard = 0;
    while (isSkipDay(c, holidays) && guard < 3660) {
      c = shiftDate(c, 1);
      guard++;
    }
    return c;
  };
  // Previous working day strictly before dateStr.
  const prevWorkingDay = (dateStr: string): string => {
    let c = shiftDate(dateStr, -1);
    let guard = 0;
    while (isSkipDay(c, holidays) && guard < 3660) {
      c = shiftDate(c, -1);
      guard++;
    }
    return c;
  };

  let best = 0;
  for (const d of dates) {
    if (isSkipDay(d, holidays)) continue; // only working days anchor runs
    // Only start at a run head: previous working day not attended.
    if (set.has(prevWorkingDay(d))) continue;
    let len = 1;
    let cursor = d;
    while (set.has(nextWorkingDay(cursor))) {
      cursor = nextWorkingDay(cursor);
      len++;
    }
    if (len > best) best = len;
  }
  return best;
}

export function computeLeaderboard(
  attendance: AttendanceRow[],
  kuaci: KuaciRow[],
  today: string,
  holidays: Set<string>
): LeaderboardEntry[] {
  // Group attendance dates per name (unique) and track earliest created_at.
  const datesByName = new Map<string, Set<string>>();
  const firstSeenByName = new Map<string, string>();
  for (const row of attendance) {
    if (!row || !row.name || !row.entry_date) continue;
    if (!datesByName.has(row.name)) datesByName.set(row.name, new Set());
    datesByName.get(row.name)!.add(row.entry_date);

    if (row.created_at) {
      const prev = firstSeenByName.get(row.name);
      if (prev === undefined || row.created_at < prev) {
        firstSeenByName.set(row.name, row.created_at);
      }
    }
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
    const { streak, days } = computeCurrentStreak(dateSet, today, holidays);
    const bestStreak = Math.max(computeBestStreak(sorted, holidays), streak);

    let kuaciInStreak = 0;
    const kMap = kuaciByName.get(name);
    if (kMap) {
      for (const d of days) kuaciInStreak += kMap.get(d) || 0;
    }

    entries.push({
      name,
      currentStreak: streak,
      bestStreak,
      kuaciInStreak,
      firstSeen: firstSeenByName.get(name) || '',
      rank: 0,
    });
  }

  entries.sort((a, b) => {
    if (b.currentStreak !== a.currentStreak) return b.currentStreak - a.currentStreak;
    // firstSeen asc; empty firstSeen always sorts last.
    if (a.firstSeen !== b.firstSeen) {
      if (a.firstSeen === '') return 1;
      if (b.firstSeen === '') return -1;
      return a.firstSeen < b.firstSeen ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  entries.forEach((e, i) => (e.rank = i + 1));
  return entries;
}
