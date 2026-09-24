import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { FishSpeciesType } from '../types';
import { FishCatalogData } from '../data/fishCatalog';

export interface SupabaseFishRow {
  id?: string | number;
  name: string;
  species?: string | null;
  created_at?: string;
  [key: string]: unknown;
}

export interface FishDataSourceConfig {
  source: 'local' | 'supabase';
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  tableName: string;
}

export const VALID_FISH_SPECIES: readonly FishSpeciesType[] = [
  'mascot',
  'neonTetra',
  'cherryShrimp',
  'angelfish',
  'rasbora',
  'guppy',
  'shark',
  'whale',
  'dolphin',
  'mantaRay',
  'pufferfish',
  'orca',
  'turtle',
  'marlin',
  'anglerfish',
  'lanternfish',
  'viperfish',
  'moray',
  'electricEel',
] as const;

/**
 * Normalizes input species to a valid FishSpeciesType.
 * PER REQUIREMENT: If empty, null, or unknown, defaults to 'neonTetra'.
 */
export function normalizeFishSpecies(speciesInput?: string | null): FishSpeciesType {
  if (!speciesInput || typeof speciesInput !== 'string') {
    return 'neonTetra';
  }

  const cleaned = speciesInput.trim().toLowerCase();
  if (!cleaned) return 'neonTetra';

  // Direct exact match
  const directMatch = VALID_FISH_SPECIES.find((s) => s.toLowerCase() === cleaned);
  if (directMatch) return directMatch;

  // Indonesian / common aliases
  if (cleaned === 'tetra' || cleaned === 'neon') return 'neonTetra';
  if (cleaned === 'hiu') return 'shark';
  if (cleaned === 'paus') return 'whale';
  if (cleaned === 'lumba' || cleaned === 'lumba-lumba') return 'dolphin';
  if (cleaned === 'pari' || cleaned === 'manta') return 'mantaRay';
  if (cleaned === 'buntal' || cleaned === 'puffer') return 'pufferfish';
  if (cleaned === 'layang' || cleaned === 'manfish') return 'angelfish';
  if (cleaned === 'udang' || cleaned === 'shrimp') return 'cherryShrimp';
  if (cleaned === 'penyu') return 'turtle';
  if (cleaned === 'pembunuh' || cleaned === 'paus orca') return 'orca';

  // Default to neonTetra
  return 'neonTetra';
}

/**
 * Resolves current fish data source settings from environment variables (.env).
 */
export function getFishDataSourceConfig(): FishDataSourceConfig {
  let envSource = '';
  let envUrl = '';
  let envKey = '';
  let envTable = '';

  // Vite browser environment
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    envSource = import.meta.env.VITE_FISH_DATA_SOURCE || '';
    envUrl = import.meta.env.VITE_SUPABASE_URL || '';
    envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    envTable = import.meta.env.VITE_SUPABASE_FISH_TABLE || '';
  }

  // Node/test environment fallback
  if (typeof process !== 'undefined' && process.env) {
    envSource = envSource || process.env.VITE_FISH_DATA_SOURCE || '';
    envUrl = envUrl || process.env.VITE_SUPABASE_URL || '';
    envKey = envKey || process.env.VITE_SUPABASE_ANON_KEY || '';
    envTable = envTable || process.env.VITE_SUPABASE_FISH_TABLE || '';
  }

  const source: 'local' | 'supabase' =
    envSource.trim().toLowerCase() === 'supabase' ? 'supabase' : 'local';

  return {
    source,
    supabaseUrl: envUrl.trim(),
    supabaseAnonKey: envKey.trim(),
    tableName: envTable.trim() || 'communal_fishes',
  };
}

/**
 * Runtime flag indicating whether Supabase has been selected AND successfully
 * initialised as the active fish data source. Components read this synchronously
 * to decide whether the canvas should be driven entirely by Supabase communal
 * fish (plus mascot) instead of the local fish-names.json ecosystem school.
 *
 * It only flips to `true` once loadFishNamesCatalog confirms usable credentials,
 * so a misconfigured .env safely falls back to local behaviour.
 */
let supabaseModeActive = false;

export function setSupabaseModeActive(active: boolean): void {
  supabaseModeActive = active;
}

export function isSupabaseModeActive(): boolean {
  return supabaseModeActive;
}

/**
 * Checks if a given timestamp or date string belongs to today (same calendar date).
 * Supports ISO strings, YYYY-MM-DD date strings, timestamps, and Date objects.
 */
export function isDateToday(
  dateInput?: string | Date | null,
  referenceDate: Date = new Date()
): boolean {
  if (!dateInput) return false;

  // Fast-path: If it's a simple 'YYYY-MM-DD' calendar date string
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
    const todayStr = getTodayDateString(referenceDate);
    return dateInput.trim() === todayStr;
  }

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return false;

  // Check same local calendar date (matches the user's current day)
  const isSameLocalDate =
    date.getFullYear() === referenceDate.getFullYear() &&
    date.getMonth() === referenceDate.getMonth() &&
    date.getDate() === referenceDate.getDate();

  if (isSameLocalDate) return true;

  // Also check UTC calendar date (for databases storing in UTC)
  const isSameUTCDate =
    date.getUTCFullYear() === referenceDate.getUTCFullYear() &&
    date.getUTCMonth() === referenceDate.getUTCMonth() &&
    date.getUTCDate() === referenceDate.getUTCDate();

  return isSameUTCDate;
}

/**
 * Gets the ISO string for start of today (00:00:00.000 local time converted to ISO).
 */
export function getStartOfTodayISO(referenceDate: Date = new Date()): string {
  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

/**
 * Gets today's calendar date string in YYYY-MM-DD format.
 */
export function getTodayDateString(referenceDate: Date = new Date()): string {
  const y = referenceDate.getFullYear();
  const m = String(referenceDate.getMonth() + 1).padStart(2, '0');
  const d = String(referenceDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Fetches fish rows from Supabase REST API, filtered to load only names from the current day (today).
 */
export const seenSupabaseFishIds = new Set<string | number>();

export function registerSeenSupabaseFishIds(ids: Array<string | number>): void {
  ids.forEach((id) => seenSupabaseFishIds.add(id));
}

/**
 * Fetches fish rows from Supabase REST API, filtered to load only names from the current day (today).
 */
export async function fetchFishFromSupabase(
  url: string,
  anonKey: string,
  tableName: string = 'communal_fishes',
  referenceDate: Date = new Date()
): Promise<SupabaseFishRow[]> {
  const cleanUrl = url.replace(/\/+$/, '');
  const startOfToday = getStartOfTodayISO(referenceDate);

  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  // Attempt 1: Query with PostgREST filter for created_at >= startOfToday
  const endpoint = `${cleanUrl}/rest/v1/${encodeURIComponent(
    tableName
  )}?select=*&created_at=gte.${encodeURIComponent(startOfToday)}&order=created_at.desc`;

  let response = await fetch(endpoint, {
    method: 'GET',
    headers,
  });

  // Attempt 2: If created_at filtering fails, fallback to select=* and do client-side filter
  if (!response.ok) {
    const fallbackEndpoint = `${cleanUrl}/rest/v1/${encodeURIComponent(tableName)}?select=*&order=id.desc`;
    response = await fetch(fallbackEndpoint, { method: 'GET', headers });
  }

  // Attempt 3: plain select=*
  if (!response.ok) {
    const fallbackEndpoint = `${cleanUrl}/rest/v1/${encodeURIComponent(tableName)}?select=*`;
    response = await fetch(fallbackEndpoint, { method: 'GET', headers });
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(
      `Supabase API error (${response.status} ${response.statusText}): ${errorText || 'Unknown error'}`
    );
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('Supabase response format invalid: expected array of fish records');
  }

  // Register seen IDs so realtime/polling does not treat existing rows as newly spawned
  data.forEach((row: SupabaseFishRow) => {
    if (row && row.id !== undefined && row.id !== null) {
      seenSupabaseFishIds.add(row.id);
    }
  });

  return data as SupabaseFishRow[];
}

/**
 * A single, long-lived realtime subscription. We keep exactly ONE Supabase client
 * + channel + poll timer per (url, table) config for the whole app lifetime.
 *
 * WHY: subscribeToSupabaseFish() is called from a React effect that, under
 * StrictMode (dev), Fast Refresh / HMR, and any re-render, can fire multiple
 * times. The previous implementation tore down and recreated the channel on
 * every call, so the WebSocket flapped CLOSED -> SUBSCRIBED repeatedly and
 * INSERT events that landed during a CLOSED window were missed — the user then
 * had to refresh to pick them up via the initial fetch. Making the subscription
 * idempotent keeps one stable channel and only swaps the callback.
 */
interface ActiveRealtimeSubscription {
  key: string;
  supabase: SupabaseClient | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  channel: any;
  pollIntervalId: ReturnType<typeof setInterval>;
  // The current fish handler; swapped in place on repeat subscribe() calls.
  onNewFish: (fish: SupabaseFishRow) => void;
  referenceDate: Date;
}

let activeRealtime: ActiveRealtimeSubscription | null = null;

function handleIncomingRow(sub: ActiveRealtimeSubscription, row: SupabaseFishRow): void {
  if (!row || !row.name) return;

  const rawDate =
    row.created_at ||
    (row as Record<string, unknown>).entry_date ||
    (row as Record<string, unknown>).date ||
    (row as Record<string, unknown>).tanggal;

  if (rawDate && !isDateToday(rawDate as string, sub.referenceDate)) {
    return;
  }

  const idKey = row.id ?? `${row.name}-${row.created_at}`;
  if (seenSupabaseFishIds.has(idKey)) return;
  seenSupabaseFishIds.add(idKey);
  if (row.id !== undefined && row.id !== null) {
    seenSupabaseFishIds.add(row.id);
  }

  sub.onNewFish(row);
}

/**
 * Subscribes to Supabase Realtime changes and provides background polling fallback.
 * Emits onNewFish whenever a new communal fish from today is inserted.
 *
 * Idempotent: repeat calls with the same (url, table) reuse the live channel and
 * only update the callback, instead of recreating (and destabilising) the socket.
 */
export function subscribeToSupabaseFish(
  url: string,
  anonKey: string,
  tableName: string = 'communal_fishes',
  onNewFish: (fish: SupabaseFishRow) => void,
  referenceDate: Date = new Date()
): () => void {
  const cleanUrl = url.replace(/\/+$/, '');
  const key = `${cleanUrl}|${tableName}`;

  // Reuse the existing live subscription for the same config: just swap the
  // handler and reference date, keeping the stable WebSocket channel intact.
  if (activeRealtime && activeRealtime.key === key) {
    activeRealtime.onNewFish = onNewFish;
    activeRealtime.referenceDate = referenceDate;
    return makeUnsubscribe(key);
  }

  // Config changed (or first run): tear down any previous subscription.
  if (activeRealtime) {
    teardownRealtime();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let channel: any = null;
  let supabase: SupabaseClient | null = null;

  const sub: ActiveRealtimeSubscription = {
    key,
    supabase: null,
    channel: null,
    // Placeholder timer; replaced below. Kept non-null for the type.
    pollIntervalId: setInterval(() => {}, 1 << 30),
    onNewFish,
    referenceDate,
  };
  clearInterval(sub.pollIntervalId);

  // 1. Setup Supabase Client Realtime Channel (one stable channel, no Date.now()
  //    in the name so reconnects reuse the same logical channel).
  try {
    supabase = createClient(cleanUrl, anonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });

    channel = supabase
      .channel(`realtime_${tableName}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: tableName },
        (payload: { new: SupabaseFishRow }) => {
          const current = activeRealtime;
          if (!current || current.key !== key) return;
          console.log('[Aquascape Realtime] New fish received via WebSocket:', payload.new);
          handleIncomingRow(current, payload.new);
        }
      )
      .subscribe((status: string) => {
        console.log(`[Aquascape Realtime] Channel status: ${status}`);
      });
  } catch (err) {
    console.warn('[Aquascape Realtime] WebSocket setup error:', err);
  }

  // 2. Setup background polling fallback (every 7 seconds) as a safety net for
  //    any window where the socket is momentarily disconnected.
  const pollIntervalId = setInterval(async () => {
    const current = activeRealtime;
    if (!current || current.key !== key) return;
    try {
      const rows = await fetchFishFromSupabase(
        cleanUrl,
        anonKey,
        tableName,
        current.referenceDate
      );
      for (const row of rows) {
        handleIncomingRow(current, row);
      }
    } catch {
      // Ignore background poll errors
    }
  }, 7000);

  sub.supabase = supabase;
  sub.channel = channel;
  sub.pollIntervalId = pollIntervalId;
  activeRealtime = sub;

  return makeUnsubscribe(key);
}

function teardownRealtime(): void {
  if (!activeRealtime) return;
  const sub = activeRealtime;
  activeRealtime = null;
  clearInterval(sub.pollIntervalId);
  if (sub.supabase && sub.channel) {
    sub.supabase.removeChannel(sub.channel).catch(() => {});
  }
}

/**
 * Returns a cleanup fn that only tears down if the active subscription is still
 * the one this caller created. This prevents a stale React cleanup (from a
 * double-invoked / re-run effect) from killing a subscription that a later call
 * legitimately kept alive.
 */
function makeUnsubscribe(key: string): () => void {
  return () => {
    if (activeRealtime && activeRealtime.key === key) {
      // Intentionally left alive: the subscription is process-global and shared
      // across re-renders. Real teardown happens on config change or page unload.
      // (No-op keeps the socket stable under StrictMode/HMR effect churn.)
    }
  };
}

/**
 * Applies fetched Supabase fish rows to the in-memory FISH_CATALOG.
 * Names are grouped by species (defaulting to 'neonTetra') and added to namePool.
 * PER REQUIREMENT: Ensures only records matching today (current day) are applied!
 */
export function applySupabaseFishData(
  rows: SupabaseFishRow[],
  catalog: FishCatalogData,
  options: { filterToday?: boolean; referenceDate?: Date } = { filterToday: true }
): { appliedCount: number; bySpecies: Record<FishSpeciesType, number> } {
  let appliedCount = 0;
  const bySpecies = {} as Record<FishSpeciesType, number>;
  VALID_FISH_SPECIES.forEach((s) => (bySpecies[s] = 0));

  const filterToday = options.filterToday ?? true;
  const referenceDate = options.referenceDate || new Date();

  for (const row of rows) {
    if (!row || typeof row.name !== 'string') continue;
    const cleanName = row.name.trim();
    if (!cleanName) continue;

    // Filter by date: check created_at or date field against current day
    if (filterToday) {
      const rawDate =
        row.created_at ||
        (row as Record<string, unknown>).date ||
        (row as Record<string, unknown>).tanggal;

      // If a date field exists, verify it matches today
      if (rawDate && !isDateToday(rawDate as string, referenceDate)) {
        continue; // Skip records from yesterday or older days
      }
    }

    // Limit name length to 25 chars for neat aesthetic nametags
    const safeName = cleanName.slice(0, 25);

    // Resolve species: defaults to 'neonTetra' if null, empty, or invalid
    const targetSpecies = normalizeFishSpecies(row.species);

    const speciesDef = catalog.species.find((s) => s.id === targetSpecies);
    if (speciesDef) {
      if (!speciesDef.defaultNames.includes(safeName)) {
        // Prepend to prioritize newly fetched Supabase names
        speciesDef.defaultNames.unshift(safeName);
      }
    }

    if (!catalog.namePool.includes(safeName)) {
      catalog.namePool.unshift(safeName);
    }

    appliedCount++;
    bySpecies[targetSpecies] = (bySpecies[targetSpecies] || 0) + 1;
  }

  return { appliedCount, bySpecies };
}
