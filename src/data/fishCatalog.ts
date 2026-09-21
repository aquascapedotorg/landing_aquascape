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

/**
 * Asynchronously loads fish-names.json from public folder to keep catalog synchronized at runtime
 */
export async function loadFishNamesCatalog(): Promise<void> {
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
    // Keep bundled catalog as reliable fallback
  }
}
