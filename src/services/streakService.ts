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

// Kuaci counts are buffered client-side and written in one batch every 30s.
// A slower flush drastically cuts Disk IO writes (WAL/checkpoint) versus the
// old 5s cadence, while the buffer guarantees no eaten kuaci is lost.
const FLUSH_INTERVAL_MS = 30000;
const SNAPSHOT_DEBOUNCE_MS = 10000;

let client: SupabaseClient | null = null;
let initialised = false;
let leaderboard: LeaderboardEntry[] = [];
let rankByName = new Map<string, { streak: number; rank: number }>();
const kuaciBuffer = new Map<string, number>();
let flushTimer: ReturnType<typeof setInterval> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let channel: any = null;
let holidays = new Set<string>();
let snapshotTimer: ReturnType<typeof setTimeout> | null = null;

function rebuildRankIndex(): void {
  rankByName = new Map();
  for (const e of leaderboard) {
    rankByName.set(e.name, { streak: e.currentStreak, rank: e.rank });
  }
}

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

async function refresh(): Promise<void> {
  if (!client) return;
  const today = toDateString(new Date());
  try {
    const [attRes, kuaciRes] = await Promise.all([
      client.from('communal_fishes').select('name,entry_date,created_at,species'),
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
    // NOTE: we deliberately do NOT call refresh() here. The increment_kuaci
    // write triggers a Realtime `*` event on fish_daily_kuaci (see the channel
    // subscription in initStreakService), which recomputes the leaderboard
    // without an extra pair of full-table SELECTs per flush. Dropping this call
    // is the single biggest Disk IO saving in the streak path.
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

  void loadHolidays().then(() => refresh());

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
  if (snapshotTimer) clearTimeout(snapshotTimer);
  snapshotTimer = null;
  holidays = new Set();
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
