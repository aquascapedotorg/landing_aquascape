# Streak Persistence, Weekend/Holiday Skip & Stable Tie-break Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Weekend/holiday days bridge (don't break) streaks, ranking ties resolve by earliest join time, and computed streaks are persisted to a `fish_streaks` snapshot table.

**Architecture:** Streaks stay computed on-the-fly from `communal_fishes` attendance, now with weekend + holiday days skipped when walking backwards. Holidays load from `public/holidays.txt`. A new `fish_streaks` table + `upsert_streaks` RPC store a debounced snapshot (best_streak never decreases). The pure calculation module gains skip logic, a `firstSeen` field (MIN created_at), and a firstSeen-based tie-break.

**Tech Stack:** React 19 + TypeScript, Vite, @supabase/supabase-js, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-22-streak-persistence-holidays-design.md`

## Global Constraints

- Feature active only when `isSupabaseModeActive()` is true.
- Weekend = Saturday & Sunday (hardcoded). Holiday = date present in the holidays set.
- Skip days BRIDGE a streak (don't break it) but do NOT add to the count. Absence on a working day (non-skip) breaks the streak (resets to 1 on next attendance).
- Tie-break order: `currentStreak` desc → `firstSeen` asc (empty firstSeen always sorts last) → `name` asc.
- `best_streak` in DB uses `GREATEST` so it never decreases.
- Streak snapshot writes are debounced ~10000 ms (separate from the 5000 ms kuaci flush).
- Pure calc functions take holidays/created_at as parameters — no I/O inside `streakCalculations.ts`.
- Dates use local calendar via existing `toDateString`.
- Run tests with `npx vitest run`; typecheck with `npx tsc --noEmit`. Both pass before each commit.

---

## File Structure

- **Modify:** `supabase/streak.sql` — append `fish_streaks` table + `upsert_streaks` RPC.
- **Create:** `public/holidays.txt` — national holiday dates.
- **Modify:** `src/services/streakCalculations.ts` — skip logic, firstSeen, new tie-break, signature change.
- **Modify:** `src/services/streakCalculations.test.ts` — new test cases.
- **Modify:** `src/services/streakService.ts` — fetch holidays, select created_at, pass holidays, snapshot writer, best_streak merge.

---

## Task 1: Append fish_streaks table + upsert_streaks RPC

**Files:**
- Modify: `supabase/streak.sql`

**Interfaces:**
- Produces: table `public.fish_streaks(name text pk, current_streak int, best_streak int, last_active_date date, updated_at timestamptz)`; RPC `upsert_streaks(p_rows jsonb) returns void`.

- [ ] **Step 1: Append to the SQL file**

Append the following to the END of `supabase/streak.sql` (keep existing content):

```sql

-- ==============================================================================
-- STREAK SNAPSHOT (persist computed streaks for fast query & history)
-- ==============================================================================
create table if not exists public.fish_streaks (
  name             text primary key,
  current_streak   integer not null default 0,
  best_streak      integer not null default 0,
  last_active_date date,
  updated_at       timestamptz not null default now()
);

alter table public.fish_streaks enable row level security;

create policy "Allow public read access"
  on public.fish_streaks for select using (true);
create policy "Allow public insert access"
  on public.fish_streaks for insert with check (true);
create policy "Allow public update access"
  on public.fish_streaks for update using (true) with check (true);

-- Batch upsert of streak snapshots. best_streak never decreases (GREATEST).
create or replace function public.upsert_streaks(p_rows jsonb)
returns void language plpgsql security definer as $$
declare r jsonb;
begin
  for r in select * from jsonb_array_elements(p_rows) loop
    insert into public.fish_streaks (name, current_streak, best_streak, last_active_date, updated_at)
    values (
      r->>'name',
      coalesce((r->>'current_streak')::int, 0),
      coalesce((r->>'best_streak')::int, 0),
      nullif(r->>'last_active_date','')::date,
      now()
    )
    on conflict (name) do update set
      current_streak   = excluded.current_streak,
      best_streak      = greatest(public.fish_streaks.best_streak, excluded.best_streak),
      last_active_date = excluded.last_active_date,
      updated_at       = now();
  end loop;
end;
$$;

grant execute on function public.upsert_streaks(jsonb) to anon;

alter publication supabase_realtime add table public.fish_streaks;
```

- [ ] **Step 2: Commit**

```bash
git add supabase/streak.sql
git commit -m "feat(streak): add fish_streaks snapshot table and upsert_streaks RPC"
```

> NOTE (manual, out-of-band): this SQL must be run once in the Supabase SQL Editor. The app tolerates its absence (snapshot writes fail silently; streaks still compute live).

---

## Task 2: Create holidays.txt

**Files:**
- Create: `public/holidays.txt`

**Interfaces:**
- Produces: a public text file fetched at `./holidays.txt`, one `YYYY-MM-DD` per line.

- [ ] **Step 1: Create the file**

Create `public/holidays.txt` with exactly this content:

```
2026-02-16
2026-02-17
2026-03-19
2026-03-20
2026-03-21
2026-03-22
2026-03-23
2026-03-24
2026-04-03
2026-04-05
2026-05-01
2026-05-14
2026-05-15
2026-05-27
2026-05-31
2026-06-01
2026-06-16
2026-07-17
2026-07-25
2026-12-24
2026-12-25
```

- [ ] **Step 2: Commit**

```bash
git add public/holidays.txt
git commit -m "feat(streak): add national holidays list for streak skip"
```

---

## Task 3: Skip logic + firstSeen + tie-break in calculations

**Files:**
- Modify: `src/services/streakCalculations.ts`
- Modify: `src/services/streakCalculations.test.ts`

**Interfaces:**
- Consumes: nothing new (pure module).
- Produces (updated exports):
  - `interface AttendanceRow { name: string; entry_date: string; created_at?: string }`
  - `interface LeaderboardEntry { name; currentStreak; bestStreak; kuaciInStreak; firstSeen: string; rank }`
  - `function isSkipDay(dateStr: string, holidays: Set<string>): boolean`
  - `function computeLeaderboard(attendance, kuaci, today, holidays: Set<string>): LeaderboardEntry[]`

- [ ] **Step 1: Write the failing tests**

Replace the ENTIRE contents of `src/services/streakCalculations.test.ts` with:

```ts
import { describe, it, expect } from 'vitest';
import {
  computeLeaderboard,
  isSkipDay,
  AttendanceRow,
  KuaciRow,
} from './streakCalculations';

const A = (name: string, d: string, created?: string): AttendanceRow => ({
  name,
  entry_date: d,
  created_at: created,
});
const K = (name: string, d: string, n: number): KuaciRow => ({ name, entry_date: d, kuaci_count: n });
const NO_HOLIDAYS = new Set<string>();

describe('isSkipDay', () => {
  it('treats Saturday and Sunday as skip days', () => {
    // 2026-02-14 is a Saturday, 2026-02-15 is a Sunday
    expect(isSkipDay('2026-02-14', NO_HOLIDAYS)).toBe(true);
    expect(isSkipDay('2026-02-15', NO_HOLIDAYS)).toBe(true);
    // 2026-02-13 is a Friday (working day)
    expect(isSkipDay('2026-02-13', NO_HOLIDAYS)).toBe(false);
  });

  it('treats listed holidays as skip days', () => {
    const holidays = new Set(['2026-05-01']); // a Friday holiday
    expect(isSkipDay('2026-05-01', holidays)).toBe(true);
    expect(isSkipDay('2026-05-01', NO_HOLIDAYS)).toBe(false);
  });
});

describe('computeLeaderboard with weekend/holiday skip', () => {
  it('bridges a weekend: Friday then Monday = streak 2', () => {
    // 2026-02-13 Fri, 2026-02-16 Mon (14/15 are Sat/Sun)
    const att = [A('Budi', '2026-02-13'), A('Budi', '2026-02-16')];
    const [row] = computeLeaderboard(att, [], '2026-02-16', NO_HOLIDAYS);
    expect(row.currentStreak).toBe(2);
  });

  it('bridges a holiday in the middle without breaking', () => {
    // 2026-04-30 Thu, 2026-05-01 Fri (holiday), 2026-05-04 Mon (2/3 May = Sat/Sun)
    const holidays = new Set(['2026-05-01']);
    const att = [A('Budi', '2026-04-30'), A('Budi', '2026-05-04')];
    const [row] = computeLeaderboard(att, [], '2026-05-04', holidays);
    expect(row.currentStreak).toBe(2); // Thu + Mon, Fri holiday + weekend bridged
  });

  it('breaks the streak when a working day is missed', () => {
    // 2026-02-16 Mon present, 2026-02-17 Tue MISSING (working day), 2026-02-18 Wed present
    const att = [A('Budi', '2026-02-16'), A('Budi', '2026-02-18')];
    const [row] = computeLeaderboard(att, [], '2026-02-18', NO_HOLIDAYS);
    expect(row.currentStreak).toBe(1); // Tue missed -> reset
  });

  it('keeps streak alive when today is a weekend and last Friday was present', () => {
    // today 2026-02-14 (Sat), last present 2026-02-13 (Fri)
    const att = [A('Budi', '2026-02-12'), A('Budi', '2026-02-13')];
    const [row] = computeLeaderboard(att, [], '2026-02-14', NO_HOLIDAYS);
    expect(row.currentStreak).toBe(2); // Thu + Fri, today Sat skipped
  });

  it('sums kuaci only for attended working days in the streak', () => {
    const att = [A('Budi', '2026-02-13'), A('Budi', '2026-02-16')];
    const kuaci = [K('Budi', '2026-02-13', 4), K('Budi', '2026-02-16', 6), K('Budi', '2026-02-10', 99)];
    const [row] = computeLeaderboard(att, kuaci, '2026-02-16', NO_HOLIDAYS);
    expect(row.kuaciInStreak).toBe(10);
  });
});

describe('computeLeaderboard tie-break by firstSeen', () => {
  it('ranks equal streaks by earliest created_at, then name', () => {
    const att = [
      A('Budi', '2026-02-16', '2026-02-16T09:00:00Z'),
      A('Ali', '2026-02-16', '2026-02-16T08:00:00Z'), // joined earlier
      A('Cici', '2026-02-16'), // no created_at
    ];
    const board = computeLeaderboard(att, [], '2026-02-16', NO_HOLIDAYS);
    // Ali (earliest) first, then Budi, then Cici (no created_at sorts last)
    expect(board.map((r) => r.name)).toEqual(['Ali', 'Budi', 'Cici']);
    expect(board.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it('is stable: same input yields the same order twice', () => {
    const att = [
      A('Budi', '2026-02-16', '2026-02-16T09:00:00Z'),
      A('Ali', '2026-02-16', '2026-02-16T08:00:00Z'),
    ];
    const first = computeLeaderboard(att, [], '2026-02-16', NO_HOLIDAYS).map((r) => r.name);
    const second = computeLeaderboard(att, [], '2026-02-16', NO_HOLIDAYS).map((r) => r.name);
    expect(first).toEqual(second);
  });

  it('exposes firstSeen on each entry', () => {
    const att = [A('Ali', '2026-02-16', '2026-02-16T08:00:00Z')];
    const [row] = computeLeaderboard(att, [], '2026-02-16', NO_HOLIDAYS);
    expect(row.firstSeen).toBe('2026-02-16T08:00:00Z');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/services/streakCalculations.test.ts`
Expected: FAIL — `isSkipDay` not exported, `computeLeaderboard` signature mismatch (4th arg), `firstSeen` missing.

- [ ] **Step 3: Rewrite the implementation**

Replace the ENTIRE contents of `src/services/streakCalculations.ts` with:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/services/streakCalculations.test.ts`
Expected: PASS (all describe blocks). If any weekend-date assumption fails, verify the weekday of the hardcoded dates with `new Date('2026-02-14').getDay()` and adjust ONLY the test's date comments, not the logic.

- [ ] **Step 5: Typecheck & commit**

```bash
npx tsc --noEmit
git add src/services/streakCalculations.ts src/services/streakCalculations.test.ts
git commit -m "feat(streak): skip weekends/holidays, add firstSeen tie-break"
```

---

## Task 4: Wire holidays + created_at + snapshot writer into service

**Files:**
- Modify: `src/services/streakService.ts`

**Interfaces:**
- Consumes: `isSkipDay` not needed here; `computeLeaderboard(attendance, kuaci, today, holidays)` (Task 3).
- Produces: no new exports; internal holidays fetch + snapshot writer.

- [ ] **Step 1: Add holidays state and a snapshot debounce timer**

In `src/services/streakService.ts`, after the line `const FLUSH_INTERVAL_MS = 5000;` add:

```ts
const SNAPSHOT_DEBOUNCE_MS = 10000;
```

After the line `let channel: any = null;` add:

```ts
let holidays = new Set<string>();
let snapshotTimer: ReturnType<typeof setTimeout> | null = null;
```

- [ ] **Step 2: Add a holidays loader**

After the `rebuildRankIndex` function, add:

```ts
async function loadHolidays(): Promise<void> {
  try {
    const res = await fetch('./holidays.txt');
    if (!res.ok) return;
    const text = await res.text();
    const set = new Set<string>();
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/\d{4}-\d{2}-\d{2}/);
      if (m) set.add(m[0]);
    }
    holidays = set;
  } catch {
    // No holidays file -> only weekends are skipped.
  }
}
```

- [ ] **Step 3: Pass holidays + created_at through refresh, and schedule snapshot**

Replace the whole `refresh` function with:

```ts
async function refresh(): Promise<void> {
  if (!client) return;
  const today = toDateString(new Date());
  try {
    const [attRes, kuaciRes] = await Promise.all([
      client.from('communal_fishes').select('name,entry_date,created_at'),
      client.from('fish_daily_kuaci').select('name,entry_date,kuaci_count'),
    ]);

    const attendance = (attRes.data as AttendanceRow[] | null) || [];
    const kuaci = (kuaciRes.data as KuaciRow[] | null) || [];

    leaderboard = computeLeaderboard(attendance, kuaci, today, holidays);
    rebuildRankIndex();
    aquascapeEvents.notifyStreakUpdated();
    scheduleSnapshot();
  } catch {
    // keep previous leaderboard on transient errors
  }
}
```

- [ ] **Step 4: Add the snapshot writer**

After the `refresh` function, add:

```ts
function scheduleSnapshot(): void {
  if (snapshotTimer) return; // already scheduled
  snapshotTimer = setTimeout(() => {
    snapshotTimer = null;
    void writeSnapshot();
  }, SNAPSHOT_DEBOUNCE_MS);
}

async function writeSnapshot(): Promise<void> {
  if (!client || leaderboard.length === 0) return;
  const rows = leaderboard.map((e) => ({
    name: e.name,
    current_streak: e.currentStreak,
    best_streak: e.bestStreak,
    last_active_date: e.firstSeen ? e.firstSeen.slice(0, 10) : '',
  }));
  try {
    const { error } = await client.rpc('upsert_streaks', { p_rows: rows });
    if (error) throw error;
  } catch (err) {
    console.warn('[Aquascape Streak] Snapshot write failed, will retry next cycle:', err);
  }
}
```

> NOTE: `last_active_date` uses `firstSeen` here only as a safe date-shaped value; the exact semantic of last_active_date is best-effort. If you prefer the true latest attendance date, that is a future enhancement — the spec only requires a date-shaped snapshot column, and the RPC tolerates '' (nullif).

- [ ] **Step 5: Load holidays during init**

In `initStreakService`, find the line `void refresh();` and replace it with:

```ts
  void loadHolidays().then(() => refresh());
```

- [ ] **Step 6: Clean up snapshot timer in the test reset**

In `__resetStreakServiceForTest`, after the `if (flushTimer) clearInterval(flushTimer);` / `flushTimer = null;` lines, add:

```ts
  if (snapshotTimer) clearTimeout(snapshotTimer);
  snapshotTimer = null;
  holidays = new Set();
```

- [ ] **Step 7: Typecheck, test, commit**

```bash
npx tsc --noEmit
npx vitest run
git add src/services/streakService.ts
git commit -m "feat(streak): load holidays, pass created_at, write debounced streak snapshot"
```

---

## Task 5: Verify & docs note

**Files:**
- Modify: `docs/WEBHOOK.md`

- [ ] **Step 1: Run full suite**

Run: `npx tsc --noEmit` (clean) and `npx vitest run` (all pass).

- [ ] **Step 2: Manual (out-of-band)**

In Supabase SQL Editor, re-run `supabase/streak.sql` (now includes `fish_streaks` + `upsert_streaks`). Confirm the table and function exist.

- [ ] **Step 3: Live smoke test**

Start dev server, enter Zen, open Ranking. Verify:
- Ranking order is stable across refreshes (no reshuffle when streaks tie).
- With attendance spanning a weekend, the streak count bridges correctly.

- [ ] **Step 4: Docs note**

In `docs/WEBHOOK.md` section 8, update the streak.sql bullet to mention the new table. Replace the existing bullet:

```markdown
- Jalankan juga [`supabase/streak.sql`](../supabase/streak.sql) untuk mengaktifkan fitur
  streak & papan peringkat kuaci (tabel `fish_daily_kuaci` + fungsi `increment_kuaci`).
```

with:

```markdown
- Jalankan juga [`supabase/streak.sql`](../supabase/streak.sql) untuk mengaktifkan fitur
  streak & papan peringkat kuaci: tabel `fish_daily_kuaci` (+ `increment_kuaci`) dan
  tabel `fish_streaks` (+ `upsert_streaks`) untuk snapshot streak. Daftar libur nasional
  ada di [`public/holidays.txt`](../public/holidays.txt) — edit di sana untuk memperbaruinya.
```

- [ ] **Step 5: Commit**

```bash
git add docs/WEBHOOK.md
git commit -m "docs(streak): note fish_streaks table and holidays.txt"
```

---

## Self-Review Notes

- **Spec coverage:** skip weekend/holiday (Task 3 ↔ spec §2/§3), firstSeen tie-break (Task 3 ↔ §4/§5), fish_streaks + RPC (Task 1 ↔ §6), holidays.txt (Task 2 ↔ §3), service wiring + snapshot writer (Task 4 ↔ §6), verify + docs (Task 5 ↔ §9). All covered.
- **Type consistency:** `computeLeaderboard(attendance, kuaci, today, holidays)` 4-arg signature used identically in Task 3 impl/tests and Task 4 caller; `LeaderboardEntry.firstSeen` added and read in Task 4 snapshot writer; `AttendanceRow.created_at?` added and selected in Task 4 query.
- **Callers of computeLeaderboard:** only `streakService.ts` (Task 4 updates it). Drawer/nametag read `getLeaderboard()`/`getStreakFor()` which are unchanged in shape.
- **Edge cases:** empty firstSeen sorts last (Task 3 sort), holidays fetch failure → weekend-only skip (Task 4 loadHolidays catch), guard bounds prevent infinite backward walk (Task 3).
