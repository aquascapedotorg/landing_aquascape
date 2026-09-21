import { FishParticle, FishLifeStage, FishSpeciesType } from '../types';
import { getFishName } from '../data/fishCatalog';

/**
 * Returns the visual scale factor for a given life cycle stage.
 */
export function getFishStageScale(stage: FishLifeStage): number {
  switch (stage) {
    case 'baby':
      return 0.45;
    case 'juvenile':
      return 0.75;
    case 'adult':
      return 1.05;
    case 'elderly':
      return 1.0;
    case 'fading':
      return 0.92;
    default:
      return 1.0;
  }
}

/**
 * Feeds a fish with kuaci, reducing hunger and increasing growth progress.
 */
export function feedFishKuaci(fish: FishParticle): { grew: boolean; newStage?: FishLifeStage } {
  fish.eatenCount = (fish.eatenCount || 0) + 1;
  fish.hunger = Math.max(0, (fish.hunger || 0) - 40);
  fish.growthPoints = (fish.growthPoints || 0) + 1;

  if (fish.stage === 'baby' && fish.growthPoints >= 2) {
    fish.stage = 'juvenile';
    fish.size = fish.baseSize * getFishStageScale('juvenile');
    return { grew: true, newStage: 'juvenile' };
  }

  if (fish.stage === 'juvenile' && fish.growthPoints >= 5) {
    fish.stage = 'adult';
    fish.size = fish.baseSize * getFishStageScale('adult');
    return { grew: true, newStage: 'adult' };
  }

  return { grew: false };
}

/**
 * Spawns a new baby fry from plant biotope cover.
 */
export function spawnBabyFish(
  width: number,
  height: number,
  species: FishSpeciesType,
  usedNames: Set<string> = new Set()
): FishParticle {
  const baseSizes: Record<FishSpeciesType, number> = {
    whale: 88,
    shark: 56,
    mantaRay: 50,
    dolphin: 46,
    mascot: 48,
    angelfish: 38,
    pufferfish: 27,
    guppy: 25,
    rasbora: 21,
    neonTetra: 18,
    cherryShrimp: 13,
  };

  const baseSize = baseSizes[species] || 20;
  const initialScale = getFishStageScale('baby');

  // Emerges from plant thickets (left or right side)
  const spawnLeft = Math.random() > 0.5;
  const startX = spawnLeft
    ? width * 0.12 + Math.random() * (width * 0.18)
    : width * 0.72 + Math.random() * (width * 0.18);
  const startY = height * 0.3 + Math.random() * (height * 0.4);

  const getSpeciesColor = (type: FishSpeciesType): { color: string; secondaryColor: string } => {
    switch (type) {
      case 'mascot':
        return { color: '#0e385e', secondaryColor: '#48b3bf' };
      case 'angelfish':
        return { color: '#e2e8f0', secondaryColor: '#334155' };
      case 'cherryShrimp':
        return { color: '#ef4444', secondaryColor: '#fca5a5' };
      case 'rasbora':
        return { color: '#f97316', secondaryColor: '#0f172a' };
      case 'guppy':
        return { color: '#cbd5e1', secondaryColor: '#ec4899' };
      case 'shark':
        return { color: '#475569', secondaryColor: '#94a3b8' };
      case 'whale':
        return { color: '#1e3a5f', secondaryColor: '#60a5fa' };
      case 'dolphin':
        return { color: '#38bdf8', secondaryColor: '#e0f2fe' };
      case 'mantaRay':
        return { color: '#1e293b', secondaryColor: '#cbd5e1' };
      case 'pufferfish':
        return { color: '#f59e0b', secondaryColor: '#fef08a' };
      case 'neonTetra':
      default:
        return { color: '#00f7ff', secondaryColor: '#ff2b4f' };
    }
  };

  const colors = getSpeciesColor(species);

  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    name: getFishName(species, usedNames),
    x: startX,
    y: startY,
    vx: (spawnLeft ? 1 : -1) * (0.9 + Math.random() * 0.6),
    vy: (Math.random() - 0.5) * 0.4,
    size: baseSize * initialScale,
    baseSize,
    type: species,
    color: colors.color,
    secondaryColor: colors.secondaryColor,
    angle: 0,
    tailPhase: Math.random() * Math.PI * 2,
    tailSpeed: 0.28,
    hunger: 45,
    eatenCount: 0,
    stage: 'baby',
    growthPoints: 0,
    ageSec: 0,
    fadeOpacity: 1.0,
  };
}

/**
 * Returns hunger label and percentage without any emojis.
 */
export function getHungerStatus(hunger: number = 0): { label: string; percentage: number } {
  const percentage = Math.min(100, Math.max(0, Math.round(hunger)));
  let label = 'Kenyang';

  if (percentage > 80) {
    label = 'Sangat Lapar';
  } else if (percentage > 55) {
    label = 'Lapar';
  } else if (percentage > 25) {
    label = 'Normal';
  }

  return { label, percentage };
}

/**
 * Updates age, natural hunger buildup, and lifecycle state.
 */
export function updateFishLifeCycle(
  fish: FishParticle,
  dt: number,
  options?: { enableLifeCycle?: boolean }
): { rebornNeeded: boolean } {
  fish.ageSec += dt;

  // Hunger naturally builds up slowly over time (approx. 100% in 120s without food)
  fish.hunger = Math.min(100, (fish.hunger || 0) + dt * 0.85);

  if (options?.enableLifeCycle) {
    // Mascot is immortal emblem; other fish undergo full natural cycle
    if (fish.type !== 'mascot') {
      if (fish.stage === 'adult' && fish.ageSec > 320) {
        fish.stage = 'elderly';
      }

      if (fish.stage === 'elderly' && fish.ageSec > 440) {
        fish.stage = 'fading';
        if (fish.fadeOpacity === undefined) {
          fish.fadeOpacity = 1.0;
        }
      }

      if (fish.stage === 'fading') {
        fish.fadeOpacity = Math.max(0, (fish.fadeOpacity ?? 1) - dt * 0.4);
        if (fish.fadeOpacity <= 0) {
          return { rebornNeeded: true };
        }
      }
    }
  }

  return { rebornNeeded: false };
}
