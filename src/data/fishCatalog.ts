export interface FishSpeciesDefinition {
  id: 'mascot' | 'neonTetra' | 'cherryShrimp' | 'angelfish' | 'rasbora' | 'guppy';
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
  version: "1.0.0",
  species: [
    {
      id: "mascot",
      name: "Origami Aquascape",
      scientificName: "Aquascapus symbolicus",
      category: "Mascot",
      description: "Maskot resmi tim AQUASCAPE berwujud ikan origami geometris yang anggun.",
      defaultNames: ["Andreas", "Aquo", "Nexus", "Vector", "Zenith", "Cyano", "Prism"]
    },
    {
      id: "neonTetra",
      name: "Neon Tetra",
      scientificName: "Paracheirodon innesi",
      category: "Schooling",
      description: "Ikan schooling mungil dengan garis neon cyan berpendar dan ekor merah cerah.",
      defaultNames: ["Piki", "Cyan", "Flash", "Glowy", "Spark", "Lumi", "Blaze", "Neon", "Skye", "Volt"]
    },
    {
      id: "cherryShrimp",
      name: "Cherry Shrimp",
      scientificName: "Neocaridina davidi",
      category: "Invertebrata",
      description: "Udang hias merah delima imut yang rajin menjelajah kayu dan substrat dasar.",
      defaultNames: ["Fahrudin", "Ruby", "Chili", "Pipit", "Cherry", "Garnet", "Kecil", "Claw", "Coral"]
    },
    {
      id: "angelfish",
      name: "Manfish (Angelfish)",
      scientificName: "Pterophyllum scalare",
      category: "Centerpiece",
      description: "Ikan anggun bertubuh pipih tinggi dengan sirip menjulang megah layaknya bidadari air.",
      defaultNames: ["Amsal", "Gabriel", "Seraph", "Pearl", "Majesty", "Silver", "Aura", "Phantom", "Luna"]
    },
    {
      id: "rasbora",
      name: "Harlequin Rasbora",
      scientificName: "Trigonostigma heteromorpha",
      category: "Schooling",
      description: "Ikan aquascape legendaris bertubuh jingga tembaga dengan corak segitiga hitam pekat.",
      defaultNames: ["Pandu", "Amber", "Harley", "Rusty", "Sunset", "Tango", "Dante", "Sienna"]
    },
    {
      id: "guppy",
      name: "Fancy Guppy",
      scientificName: "Poecilia reticulata",
      category: "Surface / Mid",
      description: "Ikan lincah dengan ekor kipas lebar berkilau yang berombak indah mengikuti arus.",
      defaultNames: ["Fransisca", "Finny", "Velvet", "Flare", "Prism", "Twinkle", "Comet", "Iris"]
    }
  ],
  namePool: [
    "Pandu",
    "Andreas",
    "Fahrudin",
    "Fransisca",
    "Amsal"
  ]
};

/**
 * Helper to pick a name for a given species, avoiding duplicates if possible
 */
export function getFishName(
  speciesId: 'mascot' | 'neonTetra' | 'cherryShrimp' | 'angelfish' | 'rasbora' | 'guppy',
  usedNames: Set<string> = new Set()
): string {
  const species = FISH_CATALOG.species.find((s) => s.id === speciesId);
  const candidates = species?.defaultNames.filter((name) => !usedNames.has(name)) || [];

  if (candidates.length > 0) {
    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    usedNames.add(picked);
    return picked;
  }

  // Fallback to namePool
  const poolCandidates = FISH_CATALOG.namePool.filter((name) => !usedNames.has(name));
  if (poolCandidates.length > 0) {
    const picked = poolCandidates[Math.floor(Math.random() * poolCandidates.length)];
    usedNames.add(picked);
    return picked;
  }

  // Fallback if all used
  return `${species?.name || 'Ikan'} #${usedNames.size + 1}`;
}
