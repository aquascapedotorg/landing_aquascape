import rawFishNames from '../../public/fish-names.json';
import { FishSpeciesType } from '../types';

export interface FishSpeciesDefinition {
  id: FishSpeciesType;
  name: string;
  scientificName: string;
  category: string;
  description: string;
  defaultNames: string[];
}

export interface FishCatalogData {
  version: string;
  species: FishSpeciesDefinition[];
  namePool: string[];
}

export const FISH_CATALOG: FishCatalogData = {
  version: rawFishNames.version,
  species: rawFishNames.species as unknown as FishSpeciesDefinition[],
  namePool: [...rawFishNames.namePool],
};

/**
 * Helper to pick a name for a given species, prioritizing user-defined order
 */
export function getFishName(
  speciesId: FishSpeciesType,
  usedNames: Set<string> = new Set()
): string {
  const species = FISH_CATALOG.species.find((s) => s.id === speciesId);
  const candidates = species?.defaultNames.filter((name) => !usedNames.has(name)) || [];

  // 1. Prioritize first unused name in species defaultNames (respects JSON order)
  if (candidates.length > 0) {
    const picked = candidates[0];
    usedNames.add(picked);
    return picked;
  }

  // 2. Fallback to namePool in defined order
  const poolCandidates = FISH_CATALOG.namePool.filter((name) => !usedNames.has(name));
  if (poolCandidates.length > 0) {
    const picked = poolCandidates[0];
    usedNames.add(picked);
    return picked;
  }

  // 3. Fallback if all used
  const fallback = `${species?.name || 'Ikan'} #${usedNames.size + 1}`;
  usedNames.add(fallback);
  return fallback;
}

export interface CommunalFishData {
  id?: string | number;
  name: string;
  species: FishSpeciesType;
}

export let activeCommunalFishes: CommunalFishData[] = [];

export function getActiveCommunalFishes(): CommunalFishData[] {
  return [...activeCommunalFishes];
}

export function setActiveCommunalFishes(fishes: CommunalFishData[]): void {
  activeCommunalFishes = [...fishes];
}

export function addActiveCommunalFish(fish: CommunalFishData): void {
  const exists = activeCommunalFishes.some(
    (f) =>
      (f.id !== undefined && f.id === fish.id) ||
      (f.name === fish.name && f.species === fish.species)
  );
  if (!exists) {
    activeCommunalFishes.push(fish);
  }
}

import {
  getFishDataSourceConfig,
  fetchFishFromSupabase,
  applySupabaseFishData,
  normalizeFishSpecies,
  isDateToday,
  subscribeToSupabaseFish,
  setSupabaseModeActive,
} from '../services/supabaseFishService';
import { initStreakService } from '../services/streakService';
import { initLegendaryService } from '../services/legendaryService';
import { aquascapeEvents } from '../components/aquascapeEvents';

/**
 * Asynchronously loads fish names based on .env configuration:
 * - If VITE_FISH_DATA_SOURCE=supabase, attempts to fetch from Supabase table.
 * - Otherwise (or on failure/offline), falls back to public/fish-names.json.
 */
export async function loadFishNamesCatalog(): Promise<void> {
  // 1. Always load base catalog from public/fish-names.json first
  try {
    const res = await fetch('./fish-names.json');
    if (res.ok) {
      const json = await res.json();
      if (json && Array.isArray(json.species)) {
        FISH_CATALOG.species = json.species;
        FISH_CATALOG.namePool = json.namePool || FISH_CATALOG.namePool;
      }
    }
  } catch {
    // Bundled catalog remains as fallback
  }

  // 2. Check environment configuration for Supabase
  const config = getFishDataSourceConfig();
  if (config.source === 'supabase') {
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      console.warn(
        '[Aquascape] VITE_FISH_DATA_SOURCE=supabase aktif, namun VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY belum diisi di .env. Menggunakan nama dari fish-names.json.'
      );
      setSupabaseModeActive(false);
      aquascapeEvents.notifyCatalogLoaded();
      return;
    }

    // Credentials are present: activate Supabase-driven canvas mode so the tank
    // is populated entirely by Supabase communal fish (plus mascot), not the
    // local fish-names.json ecosystem school.
    setSupabaseModeActive(true);
    // Start streak/leaderboard tracking (Supabase-only feature).
    initStreakService();
    initLegendaryService();

    try {
      const rows = await fetchFishFromSupabase(
        config.supabaseUrl,
        config.supabaseAnonKey,
        config.tableName
      );

      if (rows && rows.length > 0) {
        // Filter rows belonging to today
        const todayRows = rows.filter((r) => {
          const rawDate =
            r.created_at ||
            (r as Record<string, unknown>).entry_date ||
            (r as Record<string, unknown>).date ||
            (r as Record<string, unknown>).tanggal;
          return !rawDate || isDateToday(rawDate as string);
        });

        const { appliedCount } = applySupabaseFishData(todayRows, FISH_CATALOG);
        console.log(
          `[Aquascape] Berhasil memuat ${appliedCount} nama ikan hari ini dari Supabase (${config.tableName}).`
        );

        // Convert today's rows into communal fish input (defaulting species to 'neonTetra' if null/empty)
        const communalFishes = todayRows.map((r) => ({
          id: r.id,
          name: (r.name || 'Ikan Komunal').trim().slice(0, 25),
          species: normalizeFishSpecies(r.species),
        }));

        setActiveCommunalFishes(communalFishes);

        // Immediately sync communal fish into canvas without requiring refresh
        aquascapeEvents.syncCommunalFish(communalFishes);
      }

      // Notify canvas that catalog has completed loading
      aquascapeEvents.notifyCatalogLoaded();

      // 3. Start Realtime listener for live updates without page refresh
      subscribeToSupabaseFish(
        config.supabaseUrl,
        config.supabaseAnonKey,
        config.tableName,
        (newRow) => {
          const targetSpecies = normalizeFishSpecies(newRow.species);
          const safeName = (newRow.name || 'Ikan Komunal').trim().slice(0, 25);

          addActiveCommunalFish({
            id: newRow.id,
            name: safeName,
            species: targetSpecies,
          });

          // Update memory catalog
          applySupabaseFishData([newRow], FISH_CATALOG);

          // Spawn dynamically into the tank
          aquascapeEvents.spawnFish(targetSpecies, safeName);

          // NOTE: the legendary roll now happens SERVER-SIDE inside the
          // add_communal_fish RPC on INSERT, so every fish gets its ~1% chance
          // regardless of whether a browser was open. No client roll needed here.

          // Clean toast message without any emojis
          const speciesLabel =
            FISH_CATALOG.species.find((s) => s.id === targetSpecies)?.name || targetSpecies;
          aquascapeEvents.notifyNewFishToast(
            `Ikan baru bergabung di kolam: ${safeName} (${speciesLabel})`,
            targetSpecies
          );
        }
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(
        `[Aquascape] Gagal memuat nama ikan dari Supabase: ${message}. Menggunakan fallback lokal (fish-names.json).`
      );
      aquascapeEvents.notifyCatalogLoaded();
    }
  } else {
    setSupabaseModeActive(false);
    aquascapeEvents.notifyCatalogLoaded();
  }
}
