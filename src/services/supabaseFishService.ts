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

let activeRealtimeCleanup: (() => void) | null = null;

/**
 * Subscribes to Supabase Realtime changes and provides background polling fallback.
 * Emits onNewFish whenever a new communal fish from today is inserted.
 */
export function subscribeToSupabaseFish(
  url: string,
  anonKey: string,
  tableName: string = 'communal_fishes',
  onNewFish: (fish: SupabaseFishRow) => void,
  referenceDate: Date = new Date()
): () => void {
  if (activeRealtimeCleanup) {
    activeRealtimeCleanup();
    activeRealtimeCleanup = null;
  }

  const cleanUrl = url.replace(/\/+$/, '');
  let isSubscribed = true;

  // 1. Setup Supabase Client Realtime Channel
  let supabase: SupabaseClient | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let channel: any = null;

  try {
    supabase = createClient(cleanUrl, anonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });

    channel = supabase
      .channel(`realtime_${tableName}_${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: tableName },
        (payload: { new: SupabaseFishRow }) => {
          if (!isSubscribed) return;
          const newRow = payload.new;
          if (!newRow || !newRow.name) return;

          const rawDate =
            newRow.created_at ||
            (newRow as Record<string, unknown>).entry_date ||
            (newRow as Record<string, unknown>).date ||
            (newRow as Record<string, unknown>).tanggal;

          if (rawDate && !isDateToday(rawDate as string, referenceDate)) {
            return;
          }

          if (newRow.id !== undefined && newRow.id !== null) {
            if (seenSupabaseFishIds.has(newRow.id)) return;
            seenSupabaseFishIds.add(newRow.id);
          }

          console.log('[Aquascape Realtime] New fish received via WebSocket:', newRow);
          onNewFish(newRow);
        }
      )
      .subscribe((status: string) => {
        console.log(`[Aquascape Realtime] Channel status: ${status}`);
      });
  } catch (err) {
    console.warn('[Aquascape Realtime] WebSocket setup error:', err);
  }

  // 2. Setup background polling fallback (every 7 seconds)
  const pollIntervalId = setInterval(async () => {
    if (!isSubscribed) return;
    try {
      const rows = await fetchFishFromSupabase(cleanUrl, anonKey, tableName, referenceDate);
      for (const row of rows) {
        if (!row || !row.name) continue;
        const rawDate =
          row.created_at ||
          (row as Record<string, unknown>).entry_date ||
          (row as Record<string, unknown>).date ||
          (row as Record<string, unknown>).tanggal;

        if (rawDate && !isDateToday(rawDate as string, referenceDate)) {
          continue;
        }

        const idKey = row.id ?? `${row.name}-${row.created_at}`;
        if (!seenSupabaseFishIds.has(idKey)) {
          seenSupabaseFishIds.add(idKey);
          console.log('[Aquascape Polling] New fish detected via poll:', row);
          onNewFish(row);
        }
      }
    } catch {
      // Ignore background poll errors
    }
  }, 7000);

  const cleanup = () => {
    isSubscribed = false;
    clearInterval(pollIntervalId);
    if (supabase && channel) {
      supabase.removeChannel(channel).catch(() => {});
    }
  };

  activeRealtimeCleanup = cleanup;
  return cleanup;
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
