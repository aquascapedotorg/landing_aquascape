import { FishParticle, FishSpeciesType } from '../types';
import { getFishName } from '../data/fishCatalog';
import { getHungerStatus } from './lifeCycleHelper';

/**
 * Creates an ecosystem school of fish with unique names from the catalog.
 */
/**
 * Helper to construct an individual fish particle with authentic biotope parameters.
 */
export function createSingleFish(
  species: FishSpeciesType,
  id: number,
  width: number,
  height: number,
  usedNames: Set<string>,
  customName?: string,
  isCommunal?: boolean
): FishParticle {
  const fish = buildRawFish(species, id, width, height, usedNames);
  if (customName) {
    fish.name = customName;
  }
  if (isCommunal) {
    fish.isCommunal = true;
  }
  return fish;
}

function buildRawFish(
  species: FishSpeciesType,
  id: number,
  width: number,
  height: number,
  usedNames: Set<string>
): FishParticle {
  if (species === 'mascot') {
    const size = 48;
    return {
      id,
      name: getFishName('mascot', usedNames),
      x: width * 0.35 + Math.random() * (width * 0.3),
      y: height * 0.35 + Math.random() * (height * 0.3),
      vx: 1.05,
      vy: 0.08,
      size,
      baseSize: size,
      type: 'mascot',
      color: '#0e385e',
      secondaryColor: '#48b3bf',
      angle: 0,
      tailPhase: Math.random() * Math.PI * 2,
      tailSpeed: 0.16,
      hunger: 20,
      eatenCount: 0,
      stage: 'adult',
      growthPoints: 6,
      ageSec: 20,
      fadeOpacity: 1.0,
    };
  } else if (species === 'angelfish') {
    const size = 38 + Math.random() * 4;
    return {
      id,
      name: getFishName('angelfish', usedNames),
      x: width * 0.2 + Math.random() * (width * 0.6),
      y: height * 0.2 + Math.random() * (height * 0.4),
      vx: (Math.random() > 0.5 ? 1 : -1) * (0.42 + Math.random() * 0.18),
      vy: (Math.random() - 0.5) * 0.18,
      size,
      baseSize: size,
      type: 'angelfish',
      color: '#e2e8f0',
      secondaryColor: '#334155',
      accentColor: '#facc15',
      angle: 0,
      tailPhase: Math.random() * Math.PI * 2,
      tailSpeed: 0.11,
      hunger: 15 + Math.floor(Math.random() * 15),
      eatenCount: 0,
      stage: 'adult',
      growthPoints: 5,
      ageSec: 30,
      fadeOpacity: 1.0,
    };
  } else if (species === 'cherryShrimp') {
    const size = 13 + Math.random() * 2;
    return {
      id,
      name: getFishName('cherryShrimp', usedNames),
      x: width * 0.15 + Math.random() * (width * 0.7),
      y: height - 32 - Math.random() * 10,
      vx: (Math.random() > 0.5 ? 1 : -1) * 0.35,
      vy: 0,
      size,
      baseSize: size,
      type: 'cherryShrimp',
      color: '#ef4444',
      secondaryColor: '#fca5a5',
      angle: 0,
      tailPhase: 0,
      tailSpeed: 0.1,
      hunger: 10 + Math.floor(Math.random() * 15),
      eatenCount: 0,
      stage: 'adult',
      growthPoints: 5,
      ageSec: 25,
      fadeOpacity: 1.0,
    };
  } else if (species === 'rasbora') {
    const size = 21 + Math.random() * 3;
    return {
      id,
      name: getFishName('rasbora', usedNames),
      x: width * 0.2 + Math.random() * (width * 0.6),
      y: height * 0.2 + Math.random() * (height * 0.5),
      vx: (Math.random() > 0.5 ? 1 : -1) * (0.75 + Math.random() * 0.4),
      vy: (Math.random() - 0.5) * 0.3,
      size,
      baseSize: size,
      type: 'rasbora',
      color: '#f97316',
      secondaryColor: '#0f172a',
      accentColor: '#dc2626',
      angle: 0,
      tailPhase: Math.random() * Math.PI * 2,
      tailSpeed: 0.2 + Math.random() * 0.08,
      hunger: 15 + Math.floor(Math.random() * 15),
      eatenCount: 0,
      stage: 'adult',
      growthPoints: 5,
      ageSec: 25,
      fadeOpacity: 1.0,
    };
  } else if (species === 'guppy') {
    const guppyTails = ['#06b6d4', '#ec4899', '#8b5cf6', '#f59e0b'];
    const pickedTail = guppyTails[Math.floor(Math.random() * guppyTails.length)];
    const size = 25 + Math.random() * 3;
    return {
      id,
      name: getFishName('guppy', usedNames),
      x: width * 0.15 + Math.random() * (width * 0.7),
      y: height * 0.15 + Math.random() * (height * 0.45),
      vx: (Math.random() > 0.5 ? 1 : -1) * (0.65 + Math.random() * 0.3),
      vy: (Math.random() - 0.5) * 0.25,
      size,
      baseSize: size,
      type: 'guppy',
      color: '#cbd5e1',
      secondaryColor: pickedTail,
      angle: 0,
      tailPhase: Math.random() * Math.PI * 2,
      tailSpeed: 0.24,
      hunger: 15 + Math.floor(Math.random() * 15),
      eatenCount: 0,
      stage: 'adult',
      growthPoints: 5,
      ageSec: 25,
      fadeOpacity: 1.0,
    };
  } else if (species === 'neonTetra') {
    const size = 18 + Math.random() * 2;
    return {
      id,
      name: getFishName('neonTetra', usedNames),
      x: width * 0.2 + Math.random() * (width * 0.6),
      y: height * 0.25 + Math.random() * (height * 0.5),
      vx: (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 0.4),
      vy: (Math.random() - 0.5) * 0.3,
      size,
      baseSize: size,
      type: 'neonTetra',
      color: '#00f7ff',
      secondaryColor: '#ff2b4f',
      angle: 0,
      tailPhase: Math.random() * Math.PI * 2,
      tailSpeed: 0.22 + Math.random() * 0.1,
      hunger: 15 + Math.floor(Math.random() * 15),
      eatenCount: 0,
      stage: 'adult',
      growthPoints: 5,
      ageSec: 25,
      fadeOpacity: 1.0,
    };
  } else if (species === 'shark') {
    const size = 56 + Math.random() * 5;
    return {
      id,
      name: getFishName('shark', usedNames),
      x: width * 0.2 + Math.random() * (width * 0.6),
      y: height * 0.25 + Math.random() * (height * 0.35),
      vx: (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 0.25),
      vy: (Math.random() - 0.5) * 0.18,
      size,
      baseSize: size,
      type: 'shark',
      color: '#475569',
      secondaryColor: '#94a3b8',
      angle: 0,
      tailPhase: Math.random() * Math.PI * 2,
      tailSpeed: 0.14,
      hunger: 15 + Math.floor(Math.random() * 15),
      eatenCount: 0,
      stage: 'adult',
      growthPoints: 5,
      ageSec: 30,
      fadeOpacity: 1.0,
    };
  } else if (species === 'whale') {
    const size = 88 + Math.random() * 8;
    return {
      id,
      name: getFishName('whale', usedNames),
      x: width * 0.15 + Math.random() * (width * 0.7),
      y: height * 0.4 + Math.random() * (height * 0.3),
      vx: (Math.random() > 0.5 ? 1 : -1) * (0.35 + Math.random() * 0.15),
      vy: (Math.random() - 0.5) * 0.1,
      size,
      baseSize: size,
      type: 'whale',
      color: '#1e293b',
      secondaryColor: '#38bdf8',
      angle: 0,
      tailPhase: Math.random() * Math.PI * 2,
      tailSpeed: 0.06,
      hunger: 15 + Math.floor(Math.random() * 15),
      eatenCount: 0,
      stage: 'adult',
      growthPoints: 5,
      ageSec: 35,
      fadeOpacity: 1.0,
    };
  } else if (species === 'dolphin') {
    const size = 46 + Math.random() * 4;
    return {
      id,
      name: getFishName('dolphin', usedNames),
      x: width * 0.2 + Math.random() * (width * 0.6),
      y: height * 0.2 + Math.random() * (height * 0.35),
      vx: (Math.random() > 0.5 ? 1 : -1) * (1.0 + Math.random() * 0.3),
      vy: (Math.random() - 0.5) * 0.25,
      size,
      baseSize: size,
      type: 'dolphin',
      color: '#0284c7',
      secondaryColor: '#e0f2fe',
      angle: 0,
      tailPhase: Math.random() * Math.PI * 2,
      tailSpeed: 0.2,
      hunger: 15 + Math.floor(Math.random() * 15),
      eatenCount: 0,
      stage: 'adult',
      growthPoints: 5,
      ageSec: 28,
      fadeOpacity: 1.0,
    };
  } else if (species === 'mantaRay') {
    const size = 50 + Math.random() * 4;
    return {
      id,
      name: getFishName('mantaRay', usedNames),
      x: width * 0.2 + Math.random() * (width * 0.6),
      y: height * 0.35 + Math.random() * (height * 0.3),
      vx: (Math.random() > 0.5 ? 1 : -1) * (0.55 + Math.random() * 0.2),
      vy: (Math.random() - 0.5) * 0.15,
      size,
      baseSize: size,
      type: 'mantaRay',
      color: '#0f172a',
      secondaryColor: '#38bdf8',
      angle: 0,
      tailPhase: Math.random() * Math.PI * 2,
      tailSpeed: 0.10,
      hunger: 15 + Math.floor(Math.random() * 15),
      eatenCount: 0,
      stage: 'adult',
      growthPoints: 5,
      ageSec: 30,
      fadeOpacity: 1.0,
    };
  } else if (species === 'pufferfish') {
    const size = 27 + Math.random() * 3;
    return {
      id,
      name: getFishName('pufferfish', usedNames),
      x: width * 0.2 + Math.random() * (width * 0.6),
      y: height * 0.3 + Math.random() * (height * 0.35),
      vx: (Math.random() > 0.5 ? 1 : -1) * (0.48 + Math.random() * 0.18),
      vy: (Math.random() - 0.5) * 0.18,
      size,
      baseSize: size,
      type: 'pufferfish',
      color: '#eab308',
      secondaryColor: '#fef08a',
      angle: 0,
      tailPhase: Math.random() * Math.PI * 2,
      tailSpeed: 0.28,
      hunger: 15 + Math.floor(Math.random() * 15),
      eatenCount: 0,
      stage: 'adult',
      growthPoints: 5,
      ageSec: 25,
      fadeOpacity: 1.0,
    };
  } else if (species === 'orca') {
    const size = 78 + Math.random() * 6;
    return {
      id,
      name: getFishName('orca', usedNames),
      x: width * 0.15 + Math.random() * (width * 0.7),
      y: height * 0.35 + Math.random() * (height * 0.35),
      vx: (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 0.25),
      vy: (Math.random() - 0.5) * 0.18,
      size,
      baseSize: size,
      type: 'orca',
      color: '#0f172a',
      secondaryColor: '#ffffff',
      accentColor: '#94a3b8',
      angle: 0,
      tailPhase: Math.random() * Math.PI * 2,
      tailSpeed: 0.12,
      hunger: 15 + Math.floor(Math.random() * 15),
      eatenCount: 0,
      stage: 'adult',
      growthPoints: 5,
      ageSec: 32,
      fadeOpacity: 1.0,
    };
  } else if (species === 'turtle') {
    const size = 44 + Math.random() * 4;
    return {
      id,
      name: getFishName('turtle', usedNames),
      x: width * 0.15 + Math.random() * (width * 0.7),
      y: height * 0.4 + Math.random() * (height * 0.35),
      vx: (Math.random() > 0.5 ? 1 : -1) * (0.42 + Math.random() * 0.16),
      vy: (Math.random() - 0.5) * 0.12,
      size,
      baseSize: size,
      type: 'turtle',
      color: '#15803d',
      secondaryColor: '#ca8a04',
      accentColor: '#fef08a',
      angle: 0,
      tailPhase: Math.random() * Math.PI * 2,
      tailSpeed: 0.08,
      hunger: 15 + Math.floor(Math.random() * 15),
      eatenCount: 0,
      stage: 'adult',
      growthPoints: 5,
      ageSec: 30,
      fadeOpacity: 1.0,
    };
  } else {
    const size = 22;
    return {
      id,
      name: getFishName(species, usedNames),
      x: width * 0.3 + Math.random() * (width * 0.4),
      y: height * 0.3 + Math.random() * (height * 0.4),
      vx: (Math.random() > 0.5 ? 1 : -1) * 0.7,
      vy: 0,
      size,
      baseSize: size,
      type: species,
      color: '#38bdf8',
      angle: 0,
      tailPhase: 0,
      tailSpeed: 0.2,
      hunger: 20,
      eatenCount: 0,
      stage: 'adult',
      growthPoints: 5,
      ageSec: 25,
      fadeOpacity: 1.0,
    };
  }
}

/**
 * Creates an ecosystem school of fish with unique names from the catalog.
 */
export function createFishSchool(
  width: number,
  height: number,
  totalCount: number = 13,
  activeSpecies: FishSpeciesType[] = [
    'mascot',
    'angelfish',
    'cherryShrimp',
    'rasbora',
    'guppy',
    'neonTetra',
    'shark',
    'whale',
    'dolphin',
    'mantaRay',
    'pufferfish',
    'orca',
    'turtle',
  ],
  supabaseMode: boolean = false
): FishParticle[] {
  const fish: FishParticle[] = [];
  const usedNames = new Set<string>();

  // In Supabase mode the tank population comes entirely from communal fish.
  // The only ecosystem fish we keep is a single Aquascape mascot for identity,
  // so we do not dilute the canvas with local fish-names.json defaults.
  if (supabaseMode) {
    fish.push(createSingleFish('mascot', 1, width, height, usedNames));
    return fish;
  }

  const speciesList =
    activeSpecies.length > 0
      ? activeSpecies
      : ([
          'mascot',
          'angelfish',
          'cherryShrimp',
          'rasbora',
          'guppy',
          'neonTetra',
          'shark',
          'whale',
          'dolphin',
          'mantaRay',
          'pufferfish',
          'orca',
          'turtle',
        ] as FishSpeciesType[]);

  let idCounter = 1;
  const targetCount = Math.max(1, totalCount);

  // Phase 1: If mascot is active, always spawn 1 mascot first
  if (speciesList.includes('mascot') && fish.length < targetCount) {
    fish.push(createSingleFish('mascot', idCounter++, width, height, usedNames));
  }

  // Phase 2: Add other active species up to targetCount
  const otherSpecies = speciesList.filter((s) => s !== 'mascot');
  for (const sp of otherSpecies) {
    if (fish.length >= targetCount) break;
    fish.push(createSingleFish(sp, idCounter++, width, height, usedNames));
  }

  // Phase 3: If targetCount > speciesList.length, round-robin fill remaining slots
  let loopIndex = 0;
  while (fish.length < targetCount) {
    const nextSpecies = speciesList[loopIndex % speciesList.length];
    fish.push(createSingleFish(nextSpecies, idCounter++, width, height, usedNames));
    loopIndex++;
  }

  return fish;
}

/**
 * Synchronizes existing fish school with target density and active species.
 * CRITICAL: Preserves existing fish, custom names, baby stages, and hunger/growth states (Fixes Bug 2).
 */
export function syncFishSchool(
  existingFish: FishParticle[],
  totalCount: number = 13,
  activeSpecies: FishSpeciesType[] = [
    'mascot',
    'angelfish',
    'cherryShrimp',
    'rasbora',
    'guppy',
    'neonTetra',
    'shark',
    'whale',
    'dolphin',
    'mantaRay',
    'pufferfish',
    'orca',
    'turtle',
  ],
  width: number = 800,
  height: number = 500,
  supabaseMode: boolean = false
): FishParticle[] {
  if (!existingFish || existingFish.length === 0) {
    return createFishSchool(width, height, totalCount, activeSpecies, supabaseMode);
  }

  // Supabase mode: the tank is driven entirely by communal fish. Keep every
  // communal fish untouched, and reduce the ecosystem school to a single mascot
  // regardless of density / activeSpecies filters (which now only conceptually
  // apply to the local school that we intentionally suppress here).
  if (supabaseMode) {
    const communalOnly = existingFish.filter((f) => f.isCommunal);
    const existingMascot = existingFish.find((f) => !f.isCommunal && f.type === 'mascot');
    const usedNames = new Set<string>(existingFish.map((f) => f.name));
    const maxId = existingFish.reduce((max, f) => Math.max(max, f.id), 0);
    const mascot =
      existingMascot || createSingleFish('mascot', maxId + 1, width, height, usedNames);
    return [mascot, ...communalOnly];
  }

  const speciesList =
    activeSpecies.length > 0
      ? activeSpecies
      : ([
          'mascot',
          'angelfish',
          'cherryShrimp',
          'rasbora',
          'guppy',
          'neonTetra',
          'shark',
          'whale',
          'dolphin',
          'mantaRay',
          'pufferfish',
          'orca',
          'turtle',
        ] as FishSpeciesType[]);

  const targetCount = Math.max(1, totalCount);

  // 1. Separate communal fish from regular school fish
  const communalFish = existingFish.filter((f) => f.isCommunal);
  let regularFish = existingFish.filter(
    (f) => !f.isCommunal && (f.type === 'mascot' || speciesList.includes(f.type))
  );

  const usedNames = new Set<string>([
    ...communalFish.map((f) => f.name),
    ...regularFish.map((f) => f.name),
  ]);
  let maxId = existingFish.reduce((max, f) => Math.max(max, f.id), 0);

  // 2. targetCount applies to regular school fish (communal fish are ALWAYS preserved on top!)
  const mascotFish = regularFish.filter((f) => f.type === 'mascot');
  const otherRegular = regularFish.filter((f) => f.type !== 'mascot');
  const allowedOtherRegular = Math.max(0, targetCount - mascotFish.length);

  if (otherRegular.length > allowedOtherRegular) {
    // Keep younger/baby fish first
    otherRegular.sort((a, b) => {
      const stageWeight = (s: string) => (s === 'baby' ? 0 : s === 'juvenile' ? 1 : 2);
      return stageWeight(a.stage) - stageWeight(b.stage);
    });

    regularFish = [...mascotFish, ...otherRegular.slice(0, allowedOtherRegular)];
  }

  // 3. Ensure all active species from regular school are represented if capacity allows
  const presentSpecies = new Set<FishSpeciesType>(regularFish.map((f) => f.type));
  for (const sp of speciesList) {
    if (regularFish.length >= targetCount) break;
    if (!presentSpecies.has(sp)) {
      maxId++;
      regularFish.push(createSingleFish(sp, maxId, width, height, usedNames));
      presentSpecies.add(sp);
    }
  }

  // 4. Fill remaining slots for regular school up to targetCount
  let loopIndex = 0;
  while (regularFish.length < targetCount) {
    const nextSpecies = speciesList[loopIndex % speciesList.length];
    maxId++;
    regularFish.push(createSingleFish(nextSpecies, maxId, width, height, usedNames));
    loopIndex++;
  }

  // Combine ALL regular fish from .json + ALL communal fish from Supabase!
  return [...regularFish, ...communalFish];
}

/**
 * Adjusts and clamps fish positions to keep them inside the visible viewport during window resize
 * without re-creating or destroying existing fish (Fixes Bug 5).
 */
export function adjustFishPositionsForResize(
  fishList: FishParticle[],
  newWidth: number,
  newHeight: number
): void {
  for (const fish of fishList) {
    const marginX = Math.max(30, fish.size * 0.75);
    const marginY = Math.max(35, fish.size * 0.45);
    fish.x = Math.max(marginX, Math.min(newWidth - marginX, fish.x));
    fish.y = Math.max(marginY, Math.min(newHeight - marginY, fish.y));
  }
}


/**
 * Renders Angelfish (Manfish) - majestic centerpiece with tall vertical fins
 */
export function drawAngelfish(ctx: CanvasRenderingContext2D, fish: FishParticle, tailWag: number): void {
  ctx.save();
  const scale = fish.size / 68;
  ctx.scale(scale, scale);

  // 1. Long Ventral thread fins
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(4, 8);
  ctx.quadraticCurveTo(2, 28, -8, 42);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(8, 8);
  ctx.quadraticCurveTo(6, 26, -4, 40);
  ctx.stroke();

  // 2. Majestic Dorsal Fin (tall, swept back)
  ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
  ctx.beginPath();
  ctx.moveTo(5, -12);
  ctx.quadraticCurveTo(2, -38, -16, -46);
  ctx.lineTo(-14, -14);
  ctx.closePath();
  ctx.fill();

  // Dorsal fin dark spine accent
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(5, -12);
  ctx.quadraticCurveTo(2, -38, -16, -46);
  ctx.stroke();

  // 3. Long Anal Fin (swept back downwards)
  ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
  ctx.beginPath();
  ctx.moveTo(2, 10);
  ctx.quadraticCurveTo(-2, 34, -18, 42);
  ctx.lineTo(-15, 10);
  ctx.closePath();
  ctx.fill();

  // 4. Diamond Body (flat disc)
  ctx.fillStyle = '#f1f5f9';
  ctx.beginPath();
  ctx.moveTo(22, 0); // nose
  ctx.lineTo(6, -14);
  ctx.lineTo(-14, -6);
  ctx.lineTo(-20, 0);
  ctx.lineTo(-14, 6);
  ctx.lineTo(6, 14);
  ctx.closePath();
  ctx.fill();

  // Subtle pearlescent silver & yellow sheen
  ctx.fillStyle = 'rgba(250, 204, 21, 0.2)';
  ctx.beginPath();
  ctx.ellipse(4, -3, 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Vertical dark stripes
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.lineWidth = 2.5;

  // Stripe 1: Through eye
  ctx.beginPath();
  ctx.moveTo(14, -10);
  ctx.lineTo(12, 10);
  ctx.stroke();

  // Stripe 2: Mid body
  ctx.beginPath();
  ctx.moveTo(2, -14);
  ctx.lineTo(0, 14);
  ctx.stroke();

  // Stripe 3: Rear body
  ctx.beginPath();
  ctx.moveTo(-10, -9);
  ctx.lineTo(-12, 9);
  ctx.stroke();

  // Eye (bright red/orange ring)
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(13, -2, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(13, -2, 1.2, 0, Math.PI * 2);
  ctx.fill();

  // 5. Caudal Tail with animated wag
  ctx.save();
  ctx.translate(-20, 0);
  ctx.rotate(tailWag);
  ctx.fillStyle = 'rgba(226, 232, 240, 0.8)';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-16, -12);
  ctx.lineTo(-12, 0);
  ctx.lineTo(-16, 12);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * Renders Harlequin Rasbora - copper body with signature black triangular wedge patch
 */
export function drawRasbora(ctx: CanvasRenderingContext2D, fish: FishParticle, tailWag: number): void {
  ctx.save();
  const len = Math.max(1, Math.abs(fish.size));
  const hgt = Math.max(1, Math.abs(fish.size) * 0.42);

  // 1. Dorsal Fin (translucent red with black edge)
  ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
  ctx.beginPath();
  ctx.moveTo(len * 0.05, -hgt * 0.8);
  ctx.lineTo(-len * 0.15, -hgt * 1.7);
  ctx.lineTo(-len * 0.22, -hgt * 0.6);
  ctx.closePath();
  ctx.fill();

  // 2. Shimmering Copper-Orange Body
  ctx.fillStyle = '#fb923c';
  ctx.beginPath();
  ctx.ellipse(0, 0, Math.max(0.1, len * 0.5), Math.max(0.1, hgt), 0, 0, Math.PI * 2);
  ctx.fill();

  // Golden belly highlight
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.ellipse(len * 0.1, hgt * 0.3, Math.max(0.1, len * 0.25), Math.max(0.1, hgt * 0.4), 0, 0, Math.PI * 2);
  ctx.fill();

  // 3. Signature Black Triangular Wedge Patch (Harlequin mark)
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(-len * 0.05, -hgt * 0.2);
  ctx.lineTo(-len * 0.45, -hgt * 0.1);
  ctx.lineTo(-len * 0.45, hgt * 0.1);
  ctx.lineTo(-len * 0.12, hgt * 0.8);
  ctx.closePath();
  ctx.fill();

  // Subtle blue/purple iridescence around black wedge
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Eye
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.arc(len * 0.32, -hgt * 0.15, 2.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#020617';
  ctx.beginPath();
  ctx.arc(len * 0.32, -hgt * 0.15, 1.4, 0, Math.PI * 2);
  ctx.fill();

  // 4. Caudal Tail with tail wag
  ctx.save();
  ctx.translate(-len * 0.48, 0);
  ctx.rotate(tailWag);
  ctx.fillStyle = 'rgba(249, 115, 22, 0.85)';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-len * 0.38, -hgt * 0.85);
  ctx.lineTo(-len * 0.26, 0);
  ctx.lineTo(-len * 0.38, hgt * 0.85);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * Renders Fancy Guppy - sleek body with wide flowing ribbon/veil caudal tail
 */
export function drawGuppy(
  ctx: CanvasRenderingContext2D,
  fish: FishParticle,
  tailWag: number,
  timeSec: number
): void {
  ctx.save();
  const len = Math.max(1, Math.abs(fish.size));
  const hgt = Math.max(1, Math.abs(fish.size) * 0.3);

  // 1. Sleek Torpedo Body
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.ellipse(0, 0, Math.max(0.1, len * 0.45), Math.max(0.1, hgt), 0, 0, Math.PI * 2);
  ctx.fill();

  // Pearlescent belly & metallic scales
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.ellipse(len * 0.05, 0, Math.max(0.1, len * 0.25), Math.max(0.1, hgt * 0.6), 0, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(len * 0.3, -hgt * 0.2, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // 2. Small Fluttering Dorsal Fin
  ctx.fillStyle = fish.secondaryColor || '#ec4899';
  ctx.beginPath();
  ctx.moveTo(0, -hgt * 0.8);
  ctx.quadraticCurveTo(-len * 0.15, -hgt * 1.8, -len * 0.25, -hgt * 0.7);
  ctx.closePath();
  ctx.fill();

  // 3. Wide Flowing Caudal Veil Tail (Dynamic wavy ribbon)
  ctx.save();
  ctx.translate(-len * 0.42, 0);
  ctx.rotate(tailWag);

  const wave = Math.sin(timeSec * 4 + fish.id) * 4;
  const tailLength = len * 0.85;
  const tailSpread = hgt * 2.2;

  ctx.fillStyle = fish.secondaryColor || '#ec4899';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(
    -tailLength * 0.4,
    -tailSpread * 0.5 + wave,
    -tailLength * 0.7,
    -tailSpread + wave * 0.5,
    -tailLength,
    -tailSpread * 0.85 + wave
  );
  ctx.quadraticCurveTo(-tailLength * 0.7, wave, -tailLength, tailSpread * 0.85 + wave);
  ctx.bezierCurveTo(
    -tailLength * 0.7,
    tailSpread + wave * 0.5,
    -tailLength * 0.4,
    tailSpread * 0.5 + wave,
    0,
    0
  );
  ctx.closePath();
  ctx.fill();

  // Tail luminous streaks / highlights
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-tailLength * 0.5, wave, -tailLength * 0.95, wave);
  ctx.stroke();

  ctx.restore();

  ctx.restore();
}

/**
 * Renders Shark (Hiu) - sleek apex predator with sharp dorsal and heterocercal tail
 */
export function drawShark(ctx: CanvasRenderingContext2D, fish: FishParticle, tailWag: number): void {
  ctx.save();
  const scale = fish.size / 40;
  ctx.scale(scale, scale);

  // 1. Sharp dorsal fin
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(-4, -8);
  ctx.lineTo(-12, -26);
  ctx.lineTo(6, -8);
  ctx.closePath();
  ctx.fill();

  // 2. Torpedo Body
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.moveTo(32, 0); // sharp snout
  ctx.quadraticCurveTo(12, -14, -20, -8); // upper curved back
  ctx.lineTo(-32, 0);
  ctx.quadraticCurveTo(-15, 12, 10, 8); // lower belly curve
  ctx.closePath();
  ctx.fill();

  // 3. Pale Ventral Underbelly
  ctx.fillStyle = '#f1f5f9';
  ctx.beginPath();
  ctx.moveTo(28, 0);
  ctx.quadraticCurveTo(8, 2, -20, 0);
  ctx.quadraticCurveTo(-15, 11, 10, 8);
  ctx.closePath();
  ctx.fill();

  // 4. Pectoral Fin (swept back)
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(8, 4);
  ctx.lineTo(-4, 18);
  ctx.lineTo(1, 4);
  ctx.closePath();
  ctx.fill();

  // 5. Gill slits
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  for (let g = 0; g < 4; g++) {
    ctx.beginPath();
    ctx.moveTo(10 - g * 3.5, -4);
    ctx.lineTo(9 - g * 3.5, 4);
    ctx.stroke();
  }

  // 6. Predatory eye
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(22, -3, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(22.5, -3.5, 0.6, 0, Math.PI * 2);
  ctx.fill();

  // 7. Caudal Tail with tailWag (Heterocercal: upper lobe longer)
  ctx.save();
  ctx.translate(-32, 0);
  ctx.rotate(tailWag * 1.2);
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-18, -20); // upper long lobe
  ctx.lineTo(-10, -3);
  ctx.lineTo(-14, 12); // lower shorter lobe
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * Renders Whale (Paus) - massive oceanic giant with ventral grooves and majestic tail flukes
 */
export function drawWhale(
  ctx: CanvasRenderingContext2D,
  fish: FishParticle,
  tailWag: number,
  _timeSec: number = 0
): void {
  ctx.save();
  const scale = fish.size / 54;
  ctx.scale(scale, scale);

  // 1. Massive Oceanic Blue Body
  ctx.fillStyle = '#1e3a5f';
  ctx.beginPath();
  ctx.moveTo(42, -4); // round head
  ctx.quadraticCurveTo(25, -20, -22, -12); // upper spine
  ctx.lineTo(-44, -2);
  ctx.quadraticCurveTo(-20, 20, 22, 14); // lower belly
  ctx.quadraticCurveTo(42, 10, 42, -4);
  ctx.closePath();
  ctx.fill();

  // 2. Ventral Grooves / Pleats (Throat underbelly)
  ctx.fillStyle = '#93c5fd';
  ctx.beginPath();
  ctx.moveTo(38, 2);
  ctx.quadraticCurveTo(18, 16, -10, 10);
  ctx.lineTo(-8, 5);
  ctx.quadraticCurveTo(20, 8, 38, 2);
  ctx.closePath();
  ctx.fill();

  // Pleat stripes
  ctx.strokeStyle = 'rgba(30, 58, 95, 0.6)';
  ctx.lineWidth = 1;
  for (let s = 0; s < 4; s++) {
    ctx.beginPath();
    ctx.moveTo(32 - s * 8, 4 + s * 1.5);
    ctx.lineTo(8 - s * 6, 8 + s * 1.5);
    ctx.stroke();
  }

  // 3. Small curved dorsal fin far back
  ctx.fillStyle = '#0f243e';
  ctx.beginPath();
  ctx.moveTo(-16, -11);
  ctx.quadraticCurveTo(-20, -18, -24, -17);
  ctx.lineTo(-21, -10);
  ctx.closePath();
  ctx.fill();

  // 4. Pectoral Flipper
  ctx.fillStyle = '#173050';
  ctx.beginPath();
  ctx.moveTo(8, 6);
  ctx.quadraticCurveTo(4, 22, -8, 26);
  ctx.quadraticCurveTo(-2, 16, 2, 6);
  ctx.closePath();
  ctx.fill();

  // 5. Gentle Eye
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(28, -2, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(28, -2, 1.2, 0, Math.PI * 2);
  ctx.fill();

  // 6. Broad Whale Tail Fluke
  ctx.save();
  ctx.translate(-44, -2);
  ctx.rotate(tailWag * 0.9);
  ctx.fillStyle = '#173050';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-10, -18, -24, -22, -22, -6);
  ctx.lineTo(-14, 0); // fluke notch
  ctx.lineTo(-22, 6);
  ctx.bezierCurveTo(-24, 22, -10, 18, 0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * Renders Dolphin (Lumba-lumba) - streamlined marine mammal with falcate dorsal fin and horizontal fluke
 */
export function drawDolphin(
  ctx: CanvasRenderingContext2D,
  fish: FishParticle,
  tailWag: number,
  _timeSec: number = 0
): void {
  ctx.save();
  const scale = fish.size / 38;
  ctx.scale(scale, scale);

  // 1. Sleek falcate dorsal fin
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.moveTo(-2, -9);
  ctx.quadraticCurveTo(-4, -22, -14, -20);
  ctx.quadraticCurveTo(-8, -12, -4, -8);
  ctx.closePath();
  ctx.fill();

  // 2. Streamlined Body
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.moveTo(30, 1); // beak tip
  ctx.lineTo(24, -2);
  ctx.quadraticCurveTo(20, -12, 4, -11); // forehead melon & curved spine
  ctx.quadraticCurveTo(-14, -10, -28, 0);
  ctx.quadraticCurveTo(-12, 10, 6, 8); // belly curve
  ctx.quadraticCurveTo(22, 5, 30, 1);
  ctx.closePath();
  ctx.fill();

  // 3. Soft white ventral underbelly
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.moveTo(22, 2);
  ctx.quadraticCurveTo(6, 7, -18, 2);
  ctx.quadraticCurveTo(-10, 9, 6, 8);
  ctx.closePath();
  ctx.fill();

  // 4. Pectoral Flipper
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.moveTo(8, 4);
  ctx.quadraticCurveTo(4, 16, -6, 16);
  ctx.quadraticCurveTo(-2, 10, 4, 4);
  ctx.closePath();
  ctx.fill();

  // 5. Expressive eye
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(16, -2, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(16.4, -2.4, 0.6, 0, Math.PI * 2);
  ctx.fill();

  // 6. Horizontal undulating Fluke
  ctx.save();
  ctx.translate(-28, 0);
  ctx.rotate(tailWag * 1.3);
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-8, -14, -16, -12);
  ctx.lineTo(-10, 0);
  ctx.lineTo(-16, 12);
  ctx.quadraticCurveTo(-8, 14, 0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * Renders Manta Ray (Ikan Pari) - wide graceful pectoral wings with cephalic horns and whip tail
 */
export function drawMantaRay(
  ctx: CanvasRenderingContext2D,
  fish: FishParticle,
  _tailWag: number = 0,
  timeSec: number = 0
): void {
  ctx.save();
  const scale = fish.size / 34;
  ctx.scale(scale, scale);

  // Pectoral wing flap wave calculation
  const wingFlap = Math.sin(fish.tailPhase * 1.8 + timeSec * 2) * 6;

  // 1. Cephalic Horns (front filter lobes)
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(18, -4);
  ctx.quadraticCurveTo(24, -6, 26, -2);
  ctx.lineTo(20, -1);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(18, 4);
  ctx.quadraticCurveTo(24, 6, 26, 2);
  ctx.lineTo(20, 1);
  ctx.closePath();
  ctx.fill();

  // 2. Broad Diamond Wing Disc
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(20, 0); // head
  // Left wing tip (sweeps up/down with wingFlap)
  ctx.bezierCurveTo(8, -14, 4, -26 + wingFlap, -8, -28 + wingFlap);
  ctx.quadraticCurveTo(-10, -16, -18, -2);
  ctx.lineTo(-24, 0); // tail root
  ctx.lineTo(-18, 2);
  // Right wing tip
  ctx.quadraticCurveTo(-10, 16, -8, 28 - wingFlap);
  ctx.bezierCurveTo(4, 26 - wingFlap, 8, 14, 20, 0);
  ctx.closePath();
  ctx.fill();

  // 3. Elegant dorsal shoulder markings
  ctx.fillStyle = 'rgba(203, 213, 225, 0.4)';
  ctx.beginPath();
  ctx.ellipse(2, -6, 7, 3, Math.PI / 6, 0, Math.PI * 2);
  ctx.ellipse(2, 6, 7, 3, -Math.PI / 6, 0, Math.PI * 2);
  ctx.fill();

  // 4. Subtle lateral eyes
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(14, -7, 1.4, 0, Math.PI * 2);
  ctx.arc(14, 7, 1.4, 0, Math.PI * 2);
  ctx.fill();

  // 5. Long whip tail
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';
  const tailSway = Math.sin(fish.tailPhase) * 8;
  ctx.beginPath();
  ctx.moveTo(-24, 0);
  ctx.quadraticCurveTo(-38, tailSway * 0.5, -52, tailSway);
  ctx.stroke();

  ctx.restore();
}

/**
 * Renders Pufferfish (Ikan Buntal) - round plump body with rim spikes, expressive eye, and fluttering fin
 */
export function drawPufferfish(
  ctx: CanvasRenderingContext2D,
  fish: FishParticle,
  tailWag: number,
  timeSec: number = 0
): void {
  ctx.save();
  const scale = fish.size / 24;
  ctx.scale(scale, scale);

  // 1. Spikes / Spines around body rim
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 1.2;
  const spineCount = 10;
  for (let i = 0; i < spineCount; i++) {
    const angle = (i / spineCount) * Math.PI * 2;
    const r1 = 12;
    const r2 = 15;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * r1, Math.sin(angle) * r1);
    ctx.lineTo(Math.cos(angle) * r2, Math.sin(angle) * r2);
    ctx.stroke();
  }

  // 2. Round Plump Body
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.ellipse(0, 0, 13, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  // 3. Creamy Underbelly
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.ellipse(0, 4, 11, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // 4. Pouty Beak Mouth
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.ellipse(12, 0, 2, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // 5. Big Expressive Eye
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(6, -4, 3.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(7, -4, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(8, -5, 1, 0, Math.PI * 2);
  ctx.fill();

  // 6. Rapidly fluttering pectoral fin
  const finFlutter = Math.sin(timeSec * 28) * 0.4;
  ctx.save();
  ctx.translate(1, 2);
  ctx.rotate(finFlutter);
  ctx.fillStyle = 'rgba(254, 240, 138, 0.85)';
  ctx.beginPath();
  ctx.ellipse(0, 4, 2, 4.5, -Math.PI / 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 7. Small fluttering caudal tail
  ctx.save();
  ctx.translate(-13, 0);
  ctx.rotate(tailWag * 1.5);
  ctx.fillStyle = '#d97706';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-7, -6);
  ctx.lineTo(-5, 0);
  ctx.lineTo(-7, 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * Renders Orca (Paus Pembunuh / Paus Orca) - majestic apex predator with striking monochrome contrast,
 * towering erect dorsal fin, distinctive white oval eye patch, and white ventral markings.
 */
export function drawOrca(
  ctx: CanvasRenderingContext2D,
  fish: FishParticle,
  tailWag: number,
  _timeSec: number = 0
): void {
  ctx.save();
  const scale = Math.max(0.1, fish.size) / 52;
  ctx.scale(scale, scale);

  // 1. Towering Dorsal Fin (Iconic erect triangular dorsal fin pointing up along -Y)
  ctx.fillStyle = '#090d16';
  ctx.beginPath();
  ctx.moveTo(-2, -10);
  ctx.lineTo(-8, -32); // High towering apex
  ctx.quadraticCurveTo(-11, -33, -13, -28);
  ctx.quadraticCurveTo(-14, -18, -18, -9);
  ctx.closePath();
  ctx.fill();

  // 2. Main Sleek Jet-Black Hydrodynamic Body
  ctx.fillStyle = '#090d16';
  ctx.beginPath();
  ctx.moveTo(34, 1); // Snout tip
  ctx.quadraticCurveTo(24, -12, 6, -13); // Forehead / blowhole arch
  ctx.quadraticCurveTo(-14, -13, -34, -3); // Back arch down to tail stock
  ctx.quadraticCurveTo(-22, 13, 4, 12); // Belly arch
  ctx.quadraticCurveTo(22, 9, 34, 1); // Chin to snout
  ctx.closePath();
  ctx.fill();

  // 3. Iconic Oval White Eye Patch (Just above & behind eye)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(18, -6, 5.5, 2.6, -Math.PI / 10, 0, Math.PI * 2);
  ctx.fill();

  // 4. White Saddle Patch (Behind dorsal fin)
  ctx.fillStyle = 'rgba(226, 232, 240, 0.65)';
  ctx.beginPath();
  ctx.moveTo(-13, -9);
  ctx.quadraticCurveTo(-19, -12, -25, -7);
  ctx.quadraticCurveTo(-20, -5, -15, -7);
  ctx.closePath();
  ctx.fill();

  // 5. White Underbelly & Throat Field
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(30, 2); // Lower jaw
  ctx.quadraticCurveTo(18, 9, 6, 9); // Throat & chest
  ctx.quadraticCurveTo(-12, 11, -26, 4); // Ventral flank patch
  ctx.quadraticCurveTo(-18, 12, 2, 11);
  ctx.quadraticCurveTo(18, 8, 30, 2);
  ctx.closePath();
  ctx.fill();

  // 6. Large Rounded Pectoral Paddle Flipper
  ctx.fillStyle = '#090d16';
  ctx.beginPath();
  ctx.moveTo(10, 6);
  ctx.quadraticCurveTo(4, 20, -4, 19);
  ctx.quadraticCurveTo(-10, 16, -2, 6);
  ctx.closePath();
  ctx.fill();

  // 7. Orca Eye
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(22, -1.5, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.arc(22.5, -2, 0.6, 0, Math.PI * 2);
  ctx.fill();

  // 8. Caudal Fluke (Horizontal whale tail with wag)
  ctx.save();
  ctx.translate(-34, -2);
  ctx.rotate(tailWag * 1.25);
  ctx.fillStyle = '#090d16';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-10, -18, -18, -15);
  ctx.lineTo(-12, 0); // Center notch
  ctx.lineTo(-18, 15);
  ctx.quadraticCurveTo(-10, 18, 0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * Renders Sea Turtle (Penyu Laut) - ancient marine reptile with ornate geometric scutes on shell,
 * rowing front flippers, textured reptilian head, and calm swimming grace.
 */
export function drawTurtle(
  ctx: CanvasRenderingContext2D,
  fish: FishParticle,
  _tailWag: number = 0,
  _timeSec: number = 0
): void {
  ctx.save();
  const scale = Math.max(0.1, fish.size) / 36;
  ctx.scale(scale, scale);

  // Rowing flipper rhythm (synchronous graceful sweep)
  const flipperAngle = Math.sin(fish.tailPhase * 1.4) * 0.45;

  // 1. Far Rear Flipper (Behind body)
  ctx.fillStyle = '#166534';
  ctx.beginPath();
  ctx.moveTo(-16, 5);
  ctx.quadraticCurveTo(-24, 12, -28, 9);
  ctx.quadraticCurveTo(-22, 4, -14, 3);
  ctx.closePath();
  ctx.fill();

  // 2. Far Front Flipper (Top stroke behind shell)
  ctx.save();
  ctx.translate(12, -2);
  ctx.rotate(-flipperAngle * 0.7 - 0.2);
  ctx.fillStyle = '#14532d';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(8, -16, -2, -24);
  ctx.quadraticCurveTo(-12, -18, -4, -4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 3. Plastron (Warm Ivory Underbelly Shell)
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.moveTo(14, 3);
  ctx.quadraticCurveTo(0, 7, -18, 3);
  ctx.quadraticCurveTo(0, 4, 14, 3);
  ctx.closePath();
  ctx.fill();

  // 4. Carapace (Arched Emerald Geometric Shell)
  ctx.fillStyle = '#15803d';
  ctx.beginPath();
  ctx.moveTo(15, 2);
  ctx.quadraticCurveTo(6, -18, -6, -18);
  ctx.quadraticCurveTo(-18, -14, -20, 2);
  ctx.quadraticCurveTo(0, 5, 15, 2);
  ctx.closePath();
  ctx.fill();

  // Carapace Scutes (Beautiful Geometrical Plates with Gold Outlines)
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 1.2;

  // Central Scute 1
  ctx.fillStyle = '#166534';
  ctx.beginPath();
  ctx.moveTo(9, -2);
  ctx.lineTo(3, -12);
  ctx.lineTo(-4, -12);
  ctx.lineTo(-2, -2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Central Scute 2
  ctx.fillStyle = '#14532d';
  ctx.beginPath();
  ctx.moveTo(-2, -2);
  ctx.lineTo(-4, -12);
  ctx.lineTo(-12, -10);
  ctx.lineTo(-10, -2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Front Marginal Scute
  ctx.fillStyle = '#15803d';
  ctx.beginPath();
  ctx.moveTo(14, 1);
  ctx.lineTo(9, -2);
  ctx.lineTo(3, -12);
  ctx.quadraticCurveTo(8, -14, 14, 1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Rear Marginal Scute
  ctx.fillStyle = '#15803d';
  ctx.beginPath();
  ctx.moveTo(-10, -2);
  ctx.lineTo(-12, -10);
  ctx.quadraticCurveTo(-18, -8, -19, 1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 5. Short Pointed Tail
  ctx.fillStyle = '#166534';
  ctx.beginPath();
  ctx.moveTo(-19, 1);
  ctx.lineTo(-25, 3);
  ctx.lineTo(-18, 4);
  ctx.closePath();
  ctx.fill();

  // 6. Near Rear Flipper
  ctx.fillStyle = '#15803d';
  ctx.beginPath();
  ctx.moveTo(-14, 4);
  ctx.quadraticCurveTo(-22, 14, -26, 12);
  ctx.quadraticCurveTo(-20, 6, -11, 4);
  ctx.closePath();
  ctx.fill();

  // 7. Reptilian Head & Neck (Emerging forward at +X)
  ctx.fillStyle = '#166534';
  ctx.beginPath();
  ctx.moveTo(13, -1);
  ctx.quadraticCurveTo(18, -4, 25, -4);
  ctx.quadraticCurveTo(31, -3, 31, 0); // Beak tip
  ctx.quadraticCurveTo(28, 3, 20, 2);
  ctx.lineTo(13, 2);
  ctx.closePath();
  ctx.fill();

  // Sea Turtle Eye (Golden amber ring with gleaming pupil)
  ctx.fillStyle = '#ca8a04';
  ctx.beginPath();
  ctx.arc(24, -2, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(24.2, -2, 1.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(24.7, -2.4, 0.5, 0, Math.PI * 2);
  ctx.fill();

  // 8. Main Front Wing-Flipper (Near side, energetic rowing stroke!)
  ctx.save();
  ctx.translate(11, 3);
  ctx.rotate(flipperAngle);
  ctx.fillStyle = '#15803d';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(10, 14, 8, 24);
  ctx.quadraticCurveTo(2, 26, -4, 18);
  ctx.quadraticCurveTo(-4, 8, -2, 0);
  ctx.closePath();
  ctx.fill();

  // Flipper scale highlights
  ctx.fillStyle = '#ca8a04';
  ctx.beginPath();
  ctx.arc(3, 10, 1.2, 0, Math.PI * 2);
  ctx.arc(4, 17, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * Draws an interactive nametag badge above a fish.
 */
export function drawFishNametag(
  ctx: CanvasRenderingContext2D,
  fish: FishParticle,
  isHovered: boolean = false
): void {
  ctx.save();
  ctx.translate(fish.x, fish.y - fish.size * 0.8 - (isHovered ? 20 : 12));

  const stagePrefix = fish.stage === 'baby' ? '[Bayi] ' : fish.stage === 'juvenile' ? '[Remaja] ' : '';
  const displayName = `${stagePrefix}${fish.name || 'Ikan'}`;

  ctx.font = isHovered ? 'bold 11px monospace' : '10px monospace';
  const textWidth = ctx.measureText(displayName).width;
  const badgeWidth = textWidth + (isHovered ? 22 : 14);
  const badgeHeight = isHovered ? 20 : 16;

  // Frosted dark pill background
  ctx.fillStyle = isHovered ? 'rgba(9, 19, 29, 0.94)' : 'rgba(9, 19, 29, 0.68)';
  ctx.strokeStyle = isHovered ? 'rgba(45, 212, 191, 0.9)' : 'rgba(45, 212, 191, 0.35)';
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.roundRect(-badgeWidth / 2, -badgeHeight / 2, badgeWidth, badgeHeight, 8);
  ctx.fill();
  ctx.stroke();

  // Glowing dot (color-coded by stage)
  ctx.fillStyle = fish.stage === 'baby' ? '#38bdf8' : fish.stage === 'juvenile' ? '#34d399' : (isHovered ? '#2dd4bf' : '#38bdf8');
  ctx.beginPath();
  ctx.arc(-badgeWidth / 2 + (isHovered ? 7 : 5), 0, isHovered ? 2.5 : 2, 0, Math.PI * 2);
  ctx.fill();

  // Fish Name Text
  ctx.fillStyle = isHovered ? '#ffffff' : '#e2e8f0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(displayName, isHovered ? 4 : 3, 0);

  // Extra hover tooltip line: Species, Kuaci eaten, Stage & Hunger Level
  if (isHovered) {
    const speciesLabel =
      fish.type === 'angelfish'
        ? 'Manfish'
        : fish.type === 'rasbora'
        ? 'Rasbora'
        : fish.type === 'guppy'
        ? 'Guppy'
        : fish.type === 'mascot'
        ? 'Origami'
        : fish.type === 'cherryShrimp'
        ? 'Shrimp'
        : fish.type === 'shark'
        ? 'Hiu'
        : fish.type === 'whale'
        ? 'Paus'
        : fish.type === 'orca'
        ? 'Paus Orca'
        : fish.type === 'turtle'
        ? 'Penyu'
        : fish.type === 'dolphin'
        ? 'Lumba-lumba'
        : fish.type === 'mantaRay'
        ? 'Pari'
        : fish.type === 'pufferfish'
        ? 'Buntal'
        : 'Tetra';

    const hungerInfo = getHungerStatus(fish.hunger);
    const stageLabel = fish.stage === 'baby' ? 'Bayi' : fish.stage === 'juvenile' ? 'Remaja' : fish.stage === 'elderly' ? 'Tua' : 'Dewasa';
    const subText = `${speciesLabel} (${stageLabel}) • ${fish.eatenCount || 0} kuaci • Lapar: ${hungerInfo.percentage}% (${hungerInfo.label})`;

    ctx.font = '9px sans-serif';
    const subWidth = ctx.measureText(subText).width + 14;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.beginPath();
    ctx.roundRect(-subWidth / 2, -badgeHeight / 2 - 16, subWidth, 14, 4);
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(subText, 0, -badgeHeight / 2 - 9);
  }

  ctx.restore();
}

/**
 * Calculates the horizontal flip and pitch rotation for a fish so its dorsal fin
 * is always oriented upwards and never upside-down (Fixes inverted fish body bug).
 */
export function getFishOrientation(vx: number, vy: number): {
  isFacingLeft: boolean;
  pitch: number;
} {
  const isFacingLeft = vx < 0;
  const maxPitch = Math.PI / 5; // max tilt approx 36 degrees for natural, graceful swimming
  const horizontalSpeed = Math.max(0.05, Math.abs(vx));
  const rawPitch = Math.atan2(vy, horizontalSpeed);
  const pitch = Math.max(-maxPitch, Math.min(maxPitch, rawPitch));

  return { isFacingLeft, pitch };
}
