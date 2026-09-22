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
 * Fetches fish rows from Supabase REST API without requiring external dependencies.
 */
export async function fetchFishFromSupabase(
  url: string,
  anonKey: string,
  tableName: string = 'communal_fishes'
): Promise<SupabaseFishRow[]> {
  const cleanUrl = url.replace(/\/+$/, '');
  const endpoint = `${cleanUrl}/rest/v1/${encodeURIComponent(tableName)}?select=*`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

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

  return data as SupabaseFishRow[];
}

/**
 * Applies fetched Supabase fish rows to the in-memory FISH_CATALOG.
 * Names are grouped by species (defaulting to 'neonTetra') and added to namePool.
 */
export function applySupabaseFishData(
  rows: SupabaseFishRow[],
  catalog: FishCatalogData
): { appliedCount: number; bySpecies: Record<FishSpeciesType, number> } {
  let appliedCount = 0;
  const bySpecies = {} as Record<FishSpeciesType, number>;
  VALID_FISH_SPECIES.forEach((s) => (bySpecies[s] = 0));

  for (const row of rows) {
    if (!row || typeof row.name !== 'string') continue;
    const cleanName = row.name.trim();
    if (!cleanName) continue;

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
