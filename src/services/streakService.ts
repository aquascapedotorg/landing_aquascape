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

    leaderboard = computeLeaderboard(attendance, kuaci, today, new Set<string>());
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
