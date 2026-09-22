# Streak & Kuaci Leaderboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-participant attendance streaks and daily kuaci accumulation with a Zen-mode leaderboard, active only in Supabase mode.

**Architecture:** Streaks are computed on-the-fly (never stored) from `communal_fishes.entry_date`. Kuaci is stored per-day in a new `fish_daily_kuaci` table via an atomic `increment_kuaci` RPC, written through a 5-second buffer. A new `streakService` reads both datasets, computes leaderboard + per-name lookup, and emits an `onStreakUpdated` event. The canvas draws streak numbers + crowns (rank 1-3) on communal nametags; a React drawer shows the full leaderboard from Zen mode.

**Tech Stack:** React 19 + TypeScript, Vite, `@supabase/supabase-js`, Vitest, HTML Canvas 2D.

**Spec:** `docs/superpowers/specs/2026-09-22-streak-leaderboard-design.md`

## Global Constraints

- Feature is **active only** when `isSupabaseModeActive()` returns true (from `src/services/supabaseFishService.ts`).
- **No emojis** in any user-facing string (existing project rule). Crowns are drawn as canvas paths, not emoji.
- Only **communal** fish (`fish.isCommunal === true`) count toward streaks/kuaci; mascot and local `.json` fish are ignored.
- Kuaci writes go through a buffer flushed every **5000 ms**; on flush failure the buffer is retained (no kuaci lost).
- Dates use local calendar via existing `getTodayDateString(referenceDate?)` from `supabaseFishService.ts`.
- Names are matched **case-sensitively** using the raw DB `name` (no normalization).
- Run tests with `npx vitest run`; typecheck with `npx tsc --noEmit`. Both must pass before each commit.

---

## File Structure

- **Create:** `src/services/streakCalculations.ts` — pure functions (streak/leaderboard math), fully unit-testable, no I/O.
- **Create:** `src/services/streakService.ts` — stateful service: fetch, subscribe, buffer writes, emit events. Wraps `streakCalculations`.
- **Create:** `src/services/streakCalculations.test.ts` — unit tests for the pure math.
- **Create:** `src/components/StreakLeaderboardDrawer.tsx` — React slide-in drawer.
- **Create:** `supabase/streak.sql` — new table + RLS + RPC + realtime.
- **Modify:** `src/components/aquascapeEvents.ts` — add `onStreakUpdated`/`notifyStreakUpdated`.
- **Modify:** `src/components/fishRenderer.ts` — extend `drawFishNametag` with optional streak info + crown drawing.
- **Modify:** `src/components/AquascapeCanvas.tsx` — record kuaci on eat; pass streak info to nametag.
- **Modify:** `src/data/fishCatalog.ts` — init streak service on Supabase success branch.
- **Modify:** `src/components/ZenAquariumModal.tsx` — add Ranking button (Supabase-only) + render drawer.

---

## Task 1: Database schema (table + RPC)

**Files:**
- Create: `supabase/streak.sql`

**Interfaces:**
- Produces (for humans running SQL, and for service calls): table `public.fish_daily_kuaci(name text, entry_date date, kuaci_count int, updated_at timestamptz)`; RPC `increment_kuaci(p_name text, p_amount int) returns void`.

- [ ] **Step 1: Write the SQL file**

Create `supabase/streak.sql`:

```sql
-- ==============================================================================
-- AQUASCAPE STREAK & DAILY KUACI - SUPABASE SCHEMA
-- Jalankan di Supabase Dashboard -> SQL Editor (setelah schema.sql)
-- ==============================================================================

create table if not exists public.fish_daily_kuaci (
  name        text not null,
  entry_date  date not null default current_date,
  kuaci_count integer not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (name, entry_date)
);

create index if not exists idx_fish_daily_kuaci_entry_date
  on public.fish_daily_kuaci (entry_date desc);

alter table public.fish_daily_kuaci enable row level security;

create policy "Allow public read access"
  on public.fish_daily_kuaci for select using (true);

create policy "Allow public insert access"
  on public.fish_daily_kuaci for insert with check (true);

create policy "Allow public update access"
  on public.fish_daily_kuaci for update using (true) with check (true);

-- Atomic increment: avoids lost updates when multiple visitors feed the same fish.
create or replace function public.increment_kuaci(p_name text, p_amount int)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.fish_daily_kuaci (name, entry_date, kuaci_count, updated_at)
  values (p_name, current_date, greatest(p_amount, 0), now())
  on conflict (name, entry_date)
  do update set
    kuaci_count = public.fish_daily_kuaci.kuaci_count + greatest(excluded.kuaci_count, 0),
    updated_at = now();
end;
$$;

grant execute on function public.increment_kuaci(text, int) to anon;

-- Live leaderboard updates
alter publication supabase_realtime add table public.fish_daily_kuaci;
```

- [ ] **Step 2: Commit**

```bash
git add supabase/streak.sql
git commit -m "feat(streak): add fish_daily_kuaci table and increment_kuaci RPC"
```

> NOTE (manual, out-of-band): this SQL must be run once in the Supabase SQL Editor for the live project. The app tolerates its absence (kuaci writes just fail silently and streaks still work from attendance).

---

## Task 2: Streak calculation (pure functions)

**Files:**
- Create: `src/services/streakCalculations.ts`
- Test: `src/services/streakCalculations.test.ts`

**Interfaces:**
- Produces:
  - `interface AttendanceRow { name: string; entry_date: string }` (entry_date = `YYYY-MM-DD`)
  - `interface KuaciRow { name: string; entry_date: string; kuaci_count: number }`
  - `interface LeaderboardEntry { name: string; currentStreak: number; bestStreak: number; kuaciInStreak: number; rank: number }`
  - `function computeLeaderboard(attendance: AttendanceRow[], kuaci: KuaciRow[], today: string): LeaderboardEntry[]`
  - `function toDateString(d: Date): string` (re-export helper: `YYYY-MM-DD`, local)

- [ ] **Step 1: Write the failing test**

Create `src/services/streakCalculations.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { computeLeaderboard, AttendanceRow, KuaciRow } from './streakCalculations';

const A = (name: string, d: string): AttendanceRow => ({ name, entry_date: d });
const K = (name: string, d: string, n: number): KuaciRow => ({ name, entry_date: d, kuaci_count: n });

describe('computeLeaderboard', () => {
  it('counts consecutive days ending today as current streak', () => {
    const att = [A('Budi', '2026-09-20'), A('Budi', '2026-09-21'), A('Budi', '2026-09-22')];
    const [row] = computeLeaderboard(att, [], '2026-09-22');
    expect(row.name).toBe('Budi');
    expect(row.currentStreak).toBe(3);
    expect(row.bestStreak).toBe(3);
  });

  it('resets current streak to 1 after a one-day gap', () => {
    // present 20,21,22, gap 23, present 24 -> today 24 -> current streak 1, best 3
    const att = [
      A('Budi', '2026-09-20'), A('Budi', '2026-09-21'), A('Budi', '2026-09-22'),
      A('Budi', '2026-09-24'),
    ];
    const [row] = computeLeaderboard(att, [], '2026-09-24');
    expect(row.currentStreak).toBe(1);
    expect(row.bestStreak).toBe(3);
  });

  it('keeps streak alive when today missing but yesterday present', () => {
    const att = [A('Budi', '2026-09-20'), A('Budi', '2026-09-21')];
    const [row] = computeLeaderboard(att, [], '2026-09-22'); // today 22, absent
    expect(row.currentStreak).toBe(2);
  });

  it('streak is 0 when neither today nor yesterday present', () => {
    const att = [A('Budi', '2026-09-19'), A('Budi', '2026-09-20')];
    const [row] = computeLeaderboard(att, [], '2026-09-22');
    expect(row.currentStreak).toBe(0);
  });

  it('sums kuaci only for dates inside the current streak', () => {
    const att = [A('Budi', '2026-09-21'), A('Budi', '2026-09-22')]; // streak = 21,22
    const kuaci = [
      K('Budi', '2026-09-20', 100), // outside streak -> ignored
      K('Budi', '2026-09-21', 5),
      K('Budi', '2026-09-22', 7),
    ];
    const [row] = computeLeaderboard(att, kuaci, '2026-09-22');
    expect(row.kuaciInStreak).toBe(12);
  });

  it('ranks by current streak desc, tie-break kuaci desc, and assigns 1-based rank', () => {
    const att = [
      A('Ali', '2026-09-22'), A('Ali', '2026-09-21'),   // streak 2
      A('Budi', '2026-09-22'), A('Budi', '2026-09-21'), // streak 2
      A('Cici', '2026-09-22'),                          // streak 1
    ];
    const kuaci = [K('Budi', '2026-09-22', 10), K('Ali', '2026-09-22', 3)];
    const board = computeLeaderboard(att, kuaci, '2026-09-22');
    expect(board.map((r) => r.name)).toEqual(['Budi', 'Ali', 'Cici']);
    expect(board.map((r) => r.rank)).toEqual([1, 2, 3]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/streakCalculations.test.ts`
Expected: FAIL with "Failed to resolve import './streakCalculations'" or "computeLeaderboard is not a function".

- [ ] **Step 3: Write minimal implementation**

Create `src/services/streakCalculations.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/services/streakCalculations.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Typecheck & commit**

```bash
npx tsc --noEmit
git add src/services/streakCalculations.ts src/services/streakCalculations.test.ts
git commit -m "feat(streak): add pure streak & leaderboard calculation with tests"
```

---

## Task 3: aquascapeEvents — streak update event

**Files:**
- Modify: `src/components/aquascapeEvents.ts`

**Interfaces:**
- Consumes: existing `AquascapeEventManager` class + `aquascapeEvents` singleton.
- Produces: `aquascapeEvents.onStreakUpdated(listener: () => void): () => void` and `aquascapeEvents.notifyStreakUpdated(): void`.

- [ ] **Step 1: Add the listener array field**

In `src/components/aquascapeEvents.ts`, find the private listener fields near the top of the class (after `private catalogListeners: (() => void)[] = [];`) and add:

```ts
  private streakListeners: (() => void)[] = [];
```

- [ ] **Step 2: Add the subscribe/notify methods**

After the existing `notifyCatalogLoaded()` method, add:

```ts
  public onStreakUpdated(listener: () => void): () => void {
    this.streakListeners.push(listener);
    return () => {
      this.streakListeners = this.streakListeners.filter((l) => l !== listener);
    };
  }

  public notifyStreakUpdated(): void {
    this.streakListeners.forEach((l) => {
      try {
        l();
      } catch (err) {
        console.error('Error in streak updated listener:', err);
      }
    });
  }
```

- [ ] **Step 3: Typecheck & commit**

```bash
npx tsc --noEmit
git add src/components/aquascapeEvents.ts
git commit -m "feat(streak): add onStreakUpdated event to aquascapeEvents"
```

---

## Task 4: streakService (fetch, buffer writes, emit)

**Files:**
- Create: `src/services/streakService.ts`
- Test: `src/services/streakService.test.ts`

**Interfaces:**
- Consumes: `computeLeaderboard`, `LeaderboardEntry`, `toDateString` (Task 2); `aquascapeEvents.notifyStreakUpdated` (Task 3); `getFishDataSourceConfig`, `isSupabaseModeActive`, `getTodayDateString` from `supabaseFishService.ts`; `createClient` from `@supabase/supabase-js`.
- Produces:
  - `function initStreakService(): void`
  - `function recordKuaciEaten(name: string, amount?: number): void`
  - `function getStreakFor(name: string): { streak: number; rank: number } | undefined`
  - `function getLeaderboard(): LeaderboardEntry[]`
  - `function isStreakActive(): boolean`
  - `function __resetStreakServiceForTest(): void` (test-only reset of module state)
  - `function __flushKuaciNow(): Promise<void>` (test-only manual flush trigger)

- [ ] **Step 1: Write the failing test**

Create `src/services/streakService.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/streakService.test.ts`
Expected: FAIL with unresolved import './streakService'.

- [ ] **Step 3: Write the implementation**

Create `src/services/streakService.ts`:

```ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  computeLeaderboard,
  LeaderboardEntry,
  AttendanceRow,
  KuaciRow,
  toDateString,
} from './streakCalculations';
import {
  getFishDataSourceConfig,
  isSupabaseModeActive,
} from './supabaseFishService';
import { aquascapeEvents } from '../components/aquascapeEvents';

const FLUSH_INTERVAL_MS = 5000;

let client: SupabaseClient | null = null;
let initialised = false;
let leaderboard: LeaderboardEntry[] = [];
let rankByName = new Map<string, { streak: number; rank: number }>();
const kuaciBuffer = new Map<string, number>();
let flushTimer: ReturnType<typeof setInterval> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let channel: any = null;

function rebuildRankIndex(): void {
  rankByName = new Map();
  for (const e of leaderboard) {
    rankByName.set(e.name, { streak: e.currentStreak, rank: e.rank });
  }
}

async function refresh(): Promise<void> {
  if (!client) return;
  const today = toDateString(new Date());
  try {
    const [attRes, kuaciRes] = await Promise.all([
      client.from('communal_fishes').select('name,entry_date'),
      client.from('fish_daily_kuaci').select('name,entry_date,kuaci_count'),
    ]);

    const attendance = (attRes.data as AttendanceRow[] | null) || [];
    const kuaci = (kuaciRes.data as KuaciRow[] | null) || [];

    leaderboard = computeLeaderboard(attendance, kuaci, today);
    rebuildRankIndex();
    aquascapeEvents.notifyStreakUpdated();
  } catch {
    // keep previous leaderboard on transient errors
  }
}

async function flushKuaci(): Promise<void> {
  if (!client || kuaciBuffer.size === 0) return;
  const pending = new Map(kuaciBuffer);
  try {
    for (const [name, amount] of pending) {
      if (amount <= 0) continue;
      const { error } = await client.rpc('increment_kuaci', {
        p_name: name,
        p_amount: amount,
      });
      if (error) throw error;
      // Subtract what we successfully flushed (buffer may have grown meanwhile).
      const remaining = (kuaciBuffer.get(name) || 0) - amount;
      if (remaining > 0) kuaciBuffer.set(name, remaining);
      else kuaciBuffer.delete(name);
    }
    await refresh();
  } catch (err) {
    // Retain buffer for the next flush; nothing is lost.
    console.warn('[Aquascape Streak] Kuaci flush failed, will retry:', err);
  }
}

export function initStreakService(): void {
  if (initialised) return;
  if (!isSupabaseModeActive()) return;

  const config = getFishDataSourceConfig();
  if (!config.supabaseUrl || !config.supabaseAnonKey) return;

  initialised = true;
  const cleanUrl = config.supabaseUrl.replace(/\/+$/, '');
  client = createClient(cleanUrl, config.supabaseAnonKey);

  void refresh();

  // Realtime: recompute when a new fish is inserted or kuaci changes.
  try {
    channel = client
      .channel('streak_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'communal_fishes' }, () => {
        void refresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fish_daily_kuaci' }, () => {
        void refresh();
      })
      .subscribe();
  } catch {
    // realtime optional; polling via flush refresh still updates leaderboard
  }

  flushTimer = setInterval(() => {
    void flushKuaci();
  }, FLUSH_INTERVAL_MS);

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      void flushKuaci();
    });
  }
}

export function recordKuaciEaten(name: string, amount = 1): void {
  const clean = (name || '').trim();
  if (!clean || amount <= 0) return;
  kuaciBuffer.set(clean, (kuaciBuffer.get(clean) || 0) + amount);
}

export function getStreakFor(name: string): { streak: number; rank: number } | undefined {
  return rankByName.get(name);
}

export function getLeaderboard(): LeaderboardEntry[] {
  return leaderboard;
}

export function isStreakActive(): boolean {
  return initialised && isSupabaseModeActive();
}

// --- Test-only helpers ---
export function __resetStreakServiceForTest(): void {
  if (flushTimer) clearInterval(flushTimer);
  flushTimer = null;
  client = null;
  channel = null;
  initialised = false;
  leaderboard = [];
  rankByName = new Map();
  kuaciBuffer.clear();
}

export async function __flushKuaciNow(): Promise<void> {
  await flushKuaci();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/services/streakService.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Typecheck & commit**

```bash
npx tsc --noEmit
git add src/services/streakService.ts src/services/streakService.test.ts
git commit -m "feat(streak): add streakService with buffered kuaci writes and realtime refresh"
```

---

## Task 5: Init streak service in Supabase load

**Files:**
- Modify: `src/data/fishCatalog.ts`

**Interfaces:**
- Consumes: `initStreakService` (Task 4).

- [ ] **Step 1: Import the initializer**

In `src/data/fishCatalog.ts`, add to the existing import block from `../services/supabaseFishService` NO — instead add a new import line after it:

```ts
import { initStreakService } from '../services/streakService';
```

- [ ] **Step 2: Call it after Supabase mode is confirmed**

Find the line `setSupabaseModeActive(true);` (added in the earlier Supabase-mode work). Immediately after it, add:

```ts
    // Start streak/leaderboard tracking (Supabase-only feature).
    initStreakService();
```

- [ ] **Step 3: Typecheck, test, commit**

```bash
npx tsc --noEmit
npx vitest run
git add src/data/fishCatalog.ts
git commit -m "feat(streak): initialise streak service on Supabase load"
```

---

## Task 6: Record kuaci when communal fish eats

**Files:**
- Modify: `src/components/AquascapeCanvas.tsx`

**Interfaces:**
- Consumes: `recordKuaciEaten` (Task 4).

- [ ] **Step 1: Import the recorder**

In `src/components/AquascapeCanvas.tsx`, after the existing line
`import { isSupabaseModeActive } from '../services/supabaseFishService';`
add:

```ts
import { recordKuaciEaten } from '../services/streakService';
```

- [ ] **Step 2: Record on eat (communal only)**

Find the eat block (around line 971) where `const growth = feedFishKuaci(fish);` runs. Immediately after that line add:

```ts
            if (fish.isCommunal && fish.name) {
              recordKuaciEaten(fish.name, 1);
            }
```

- [ ] **Step 3: Typecheck, test, commit**

```bash
npx tsc --noEmit
npx vitest run
git add src/components/AquascapeCanvas.tsx
git commit -m "feat(streak): record kuaci eaten by communal fish"
```

---

## Task 7: Nametag streak number + crowns

**Files:**
- Modify: `src/components/fishRenderer.ts`
- Modify: `src/components/AquascapeCanvas.tsx`

**Interfaces:**
- Consumes: `getStreakFor` (Task 4).
- Produces: extended `drawFishNametag(ctx, fish, isHovered?, streakInfo?: { streak: number; rank: number })`.

- [ ] **Step 1: Extend the signature and draw streak + crown**

In `src/components/fishRenderer.ts`, change the `drawFishNametag` signature from:

```ts
export function drawFishNametag(
  ctx: CanvasRenderingContext2D,
  fish: FishParticle,
  isHovered: boolean = false
): void {
```

to:

```ts
export function drawFishNametag(
  ctx: CanvasRenderingContext2D,
  fish: FishParticle,
  isHovered: boolean = false,
  streakInfo?: { streak: number; rank: number }
): void {
```

Then find the `displayName` line:

```ts
  const stagePrefix = fish.stage === 'baby' ? '[Bayi] ' : fish.stage === 'juvenile' ? '[Remaja] ' : '';
  const displayName = `${stagePrefix}${fish.name || 'Ikan'}`;
```

and replace with:

```ts
  const stagePrefix = fish.stage === 'baby' ? '[Bayi] ' : fish.stage === 'juvenile' ? '[Remaja] ' : '';
  const streakSuffix =
    streakInfo && streakInfo.streak > 0 ? ` · ${streakInfo.streak}` : '';
  const displayName = `${stagePrefix}${fish.name || 'Ikan'}${streakSuffix}`;
```

- [ ] **Step 2: Draw the crown for rank 1-3**

Immediately before the final `ctx.restore();` at the end of `drawFishNametag`, add:

```ts
  // Crown for top-3 ranked communal fish (canvas path, no emoji).
  if (streakInfo && streakInfo.rank >= 1 && streakInfo.rank <= 3 && streakInfo.streak > 0) {
    const crownColor =
      streakInfo.rank === 1 ? '#facc15' : streakInfo.rank === 2 ? '#cbd5e1' : '#f59e0b';
    ctx.save();
    // Position crown just above the pill.
    ctx.translate(0, -badgeHeight / 2 - 7);
    ctx.fillStyle = crownColor;
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    // Simple 3-peak crown, ~14px wide, ~7px tall.
    ctx.moveTo(-7, 3);
    ctx.lineTo(-7, -2);
    ctx.lineTo(-3.5, 1);
    ctx.lineTo(0, -4);
    ctx.lineTo(3.5, 1);
    ctx.lineTo(7, -2);
    ctx.lineTo(7, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
```

- [ ] **Step 3: Pass streak info from the canvas render loop**

In `src/components/AquascapeCanvas.tsx`, find the nametag call:

```ts
        if (currentSettings.showNametags || isHovered) {
          drawFishNametag(ctx, fish, isHovered);
        }
```

and replace with:

```ts
        if (currentSettings.showNametags || isHovered) {
          const streakInfo = fish.isCommunal ? getStreakFor(fish.name) : undefined;
          drawFishNametag(ctx, fish, isHovered, streakInfo);
        }
```

- [ ] **Step 4: Import getStreakFor in the canvas**

In `src/components/AquascapeCanvas.tsx`, update the streak service import line to include `getStreakFor`:

```ts
import { recordKuaciEaten, getStreakFor } from '../services/streakService';
```

- [ ] **Step 5: Typecheck, test, commit**

```bash
npx tsc --noEmit
npx vitest run
git add src/components/fishRenderer.ts src/components/AquascapeCanvas.tsx
git commit -m "feat(streak): show streak count and top-3 crown on communal nametags"
```

---

## Task 8: Leaderboard drawer component

**Files:**
- Create: `src/components/StreakLeaderboardDrawer.tsx`

**Interfaces:**
- Consumes: `getLeaderboard`, `LeaderboardEntry` (Tasks 2/4); `aquascapeEvents.onStreakUpdated` (Task 3).
- Produces: `StreakLeaderboardDrawer` React component with props `{ isOpen: boolean; onClose: () => void }`.

- [ ] **Step 1: Create the component**

Create `src/components/StreakLeaderboardDrawer.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import { X, Trophy, Crown } from 'lucide-react';
import { getLeaderboard } from '../services/streakService';
import { LeaderboardEntry } from '../services/streakCalculations';
import { aquascapeEvents } from './aquascapeEvents';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StreakLeaderboardDrawer: React.FC<DrawerProps> = ({ isOpen, onClose }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setEntries([...getLeaderboard()]);
    const unsubscribe = aquascapeEvents.onStreakUpdated(() => {
      setEntries([...getLeaderboard()]);
    });
    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const crownColor = (rank: number) =>
    rank === 1 ? 'text-amber-400' : rank === 2 ? 'text-slate-300' : 'text-orange-400';

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-label="Papan peringkat streak"
        className="relative w-full max-w-sm h-full bg-[#0a121d] border-l border-teal-500/25 shadow-2xl flex flex-col animate-fade-in"
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-teal-300">
            <Trophy className="w-5 h-5 text-teal-400" />
            <h2 className="text-sm font-bold tracking-wide">Papan Peringkat Streak</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {entries.length === 0 ? (
            <div className="text-center text-slate-400 text-sm py-16 px-6">
              Belum ada peserta hari ini. Ikan yang dikirim ke kolam akan muncul di sini.
            </div>
          ) : (
            <ol className="space-y-1.5">
              {entries.map((e) => (
                <li
                  key={e.name}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800"
                >
                  <span className="w-7 shrink-0 flex items-center justify-center font-mono text-sm text-slate-300">
                    {e.rank <= 3 ? <Crown className={`w-4 h-4 ${crownColor(e.rank)}`} /> : e.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{e.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Rekor terpanjang: {e.bestStreak} hari
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-teal-300">{e.currentStreak} hari</p>
                    <p className="text-[11px] text-slate-400 font-mono">{e.kuaciInStreak} kuaci</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </aside>
    </div>
  );
};
```

- [ ] **Step 2: Typecheck, test, commit**

```bash
npx tsc --noEmit
npx vitest run
git add src/components/StreakLeaderboardDrawer.tsx
git commit -m "feat(streak): add leaderboard drawer component"
```

---

## Task 9: Wire Ranking button + drawer into Zen (Supabase-only)

**Files:**
- Modify: `src/components/ZenAquariumModal.tsx`

**Interfaces:**
- Consumes: `StreakLeaderboardDrawer` (Task 8); `isSupabaseModeActive` (already imported in this file from earlier work).

- [ ] **Step 1: Import the drawer and Trophy icon**

In `src/components/ZenAquariumModal.tsx`, add to the imports:

```ts
import { StreakLeaderboardDrawer } from './StreakLeaderboardDrawer';
```

and add `Trophy` to the existing `lucide-react` import list (append `, Trophy` inside the braces).

- [ ] **Step 2: Add drawer open state**

After the existing `const supabaseMode = isSupabaseModeActive();` line, add:

```ts
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
```

- [ ] **Step 3: Close drawer first on ESC**

Find the ESC handler block:

```ts
      if (e.key === 'Escape' && isOpen) {
        if (isFaunaModalOpen) {
          setIsFaunaModalOpen(false);
        } else {
          onClose();
        }
      }
```

replace with:

```ts
      if (e.key === 'Escape' && isOpen) {
        if (isLeaderboardOpen) {
          setIsLeaderboardOpen(false);
        } else if (isFaunaModalOpen) {
          setIsFaunaModalOpen(false);
        } else {
          onClose();
        }
      }
```

and add `isLeaderboardOpen` to that effect's dependency array (change `[isOpen, onClose, isFaunaModalOpen]` to `[isOpen, onClose, isFaunaModalOpen, isLeaderboardOpen]`).

- [ ] **Step 4: Add the Ranking button (Supabase-only)**

In the "Top Actions" `div` (where the Fauna button lives, guarded by `!supabaseMode`), add a NEW button that shows ONLY in Supabase mode. Place it right before the Close Zen button:

```tsx
            {supabaseMode && (
              <button
                type="button"
                id="btn-zen-leaderboard"
                onClick={() => setIsLeaderboardOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-teal-500/30 text-teal-300 font-semibold text-xs transition-all shadow-lg cursor-pointer active:scale-95 backdrop-blur-md"
                title="Lihat papan peringkat streak & kuaci"
              >
                <Trophy className="w-4 h-4 text-teal-400" />
                <span className="hidden sm:inline">Ranking</span>
              </button>
            )}
```

- [ ] **Step 5: Render the drawer**

Just before the closing of the component (near the `FishCustomizerModal` render), add:

```tsx
      {/* Streak Leaderboard Drawer (Supabase-only) */}
      {supabaseMode && (
        <StreakLeaderboardDrawer
          isOpen={isLeaderboardOpen}
          onClose={() => setIsLeaderboardOpen(false)}
        />
      )}
```

- [ ] **Step 6: Typecheck, test, commit**

```bash
npx tsc --noEmit
npx vitest run
git add src/components/ZenAquariumModal.tsx
git commit -m "feat(streak): add Ranking button and leaderboard drawer to Zen mode"
```

---

## Task 10: Manual verification & docs note

**Files:**
- Modify: `docs/WEBHOOK.md` (add a short note about the new table)

- [ ] **Step 1: Run the SQL in Supabase (manual)**

In the Supabase Dashboard → SQL Editor, run `supabase/streak.sql`. Confirm the `fish_daily_kuaci` table and `increment_kuaci` function exist.

- [ ] **Step 2: Live smoke test**

Start dev server (`npm run dev`), open the app in a browser, enter Zen mode. Verify:
- A "Ranking" button appears in Zen (Supabase mode); no Fauna button.
- Feeding fish (Tabur Kuaci) causes communal fish to eat; after ~5s, kuaci counts appear in the leaderboard.
- Nametags show ` · N` streak suffix for communal fish; rank 1-3 show a crown.
- Inserting a new fish via webhook updates the leaderboard live.

- [ ] **Step 3: Add docs note**

In `docs/WEBHOOK.md`, under section 8 (Prasyarat database), add a bullet:

```markdown
- Jalankan juga `supabase/streak.sql` untuk mengaktifkan fitur streak & papan
  peringkat kuaci (tabel `fish_daily_kuaci` + fungsi `increment_kuaci`).
```

- [ ] **Step 4: Commit**

```bash
git add docs/WEBHOOK.md
git commit -m "docs(streak): note streak.sql prerequisite for leaderboard"
```

---

## Self-Review Notes

- **Spec coverage:** Schema+RPC (Task 1 ↔ spec §2), on-the-fly calc + reset rules (Task 2 ↔ §1/§3), event (Task 3 ↔ §4), service+buffer (Task 4 ↔ §4), activation (Task 5 ↔ §5), kuaci recording (Task 6 ↔ §4), nametag+crown (Task 7 ↔ §4A), drawer (Task 8 ↔ §4B), Zen wiring Supabase-only (Task 9 ↔ §4/§5), verification+docs (Task 10 ↔ §7). All spec sections covered.
- **Type consistency:** `LeaderboardEntry`, `AttendanceRow`, `KuaciRow`, `getStreakFor` return `{ streak, rank }`, `computeLeaderboard(attendance, kuaci, today)` are used identically across tasks.
- **Edge cases:** streak reset-to-1, alive-when-yesterday-present, and streak-0 are covered by Task 2 tests; kuaci-in-streak isolation tested; flush failure retains buffer (Task 4 code).
