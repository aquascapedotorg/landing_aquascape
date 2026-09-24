import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getFishDataSourceConfig, isSupabaseModeActive } from './supabaseFishService';
import { normalizeName } from './streakCalculations';
import { aquascapeEvents } from '../components/aquascapeEvents';

interface LegendaryRow {
  name: string;
  species?: string | null;
  entry_date?: string;
}

let client: SupabaseClient | null = null;
let initialised = false;
let todayList: { name: string; species?: string }[] = [];
let nameSet = new Set<string>(); // normalized names

function todayStr(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function setWinners(rows: LegendaryRow[]): void {
  todayList = rows
    .filter((r) => r && r.name)
    .map((r) => ({ name: r.name, species: r.species || undefined }));
  nameSet = new Set(todayList.map((r) => normalizeName(r.name)));
  aquascapeEvents.notifyLegendaryUpdated();
}

async function refresh(): Promise<void> {
  if (!client) return;
  try {
    const { data } = await client
      .from('legendary_fish')
      .select('name,species,entry_date')
      .eq('entry_date', todayStr());
    setWinners((data as LegendaryRow[] | null) || []);
  } catch {
    // table may not exist yet; keep current (empty) winners
  }
}

export function initLegendaryService(): void {
  if (initialised) return;
  if (!isSupabaseModeActive()) return;
  const config = getFishDataSourceConfig();
  if (!config.supabaseUrl || !config.supabaseAnonKey) return;
  initialised = true;
  client = createClient(config.supabaseUrl.replace(/\/+$/, ''), config.supabaseAnonKey);
  void refresh();
  try {
    client
      .channel('legendary_updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'legendary_fish' }, () => {
        void refresh();
      })
      .subscribe();
  } catch {
    // realtime optional
  }
}

/** Fire the server-side ultra-rare roll for a newly-arrived fish. */
export function rollForFish(name: string): void {
  const clean = (name || '').trim();
  if (!clean || !client) return;
  void rollForFishAsync(client, clean);
}

async function rollForFishAsync(activeClient: SupabaseClient, name: string): Promise<void> {
  try {
    const { data } = await activeClient.rpc('roll_legendary', { p_name: name });
    if (data === true) void refresh(); // won — refresh immediately (realtime also fires)
  } catch {
    /* RPC missing or transient; ignore */
  }
}

export function getLegendaryNames(): Set<string> {
  return nameSet;
}

export function getTodayLegendaryList(): { name: string; species?: string }[] {
  return todayList;
}

export function isLegendary(name: string): boolean {
  return nameSet.has(normalizeName(name));
}

// --- Test-only helpers ---
export function __resetLegendaryForTest(): void {
  client = null;
  initialised = false;
  todayList = [];
  nameSet = new Set();
}
export function __setLegendaryForTest(list: { name: string; species?: string }[]): void {
  todayList = [...list];
  nameSet = new Set(list.map((r) => normalizeName(r.name)));
}
