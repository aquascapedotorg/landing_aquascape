import { FishParticle, FishSpeciesType } from '../types';
import { getFishName } from '../data/fishCatalog';
import { getHungerStatus } from './lifeCycleHelper';

/**
 * Creates an ecosystem school of fish with unique names from the catalog.
 */
export function createFishSchool(
  width: number,
  height: number,
  totalCount: number = 11,
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
  ]
): FishParticle[] {
  const fish: FishParticle[] = [];
  const usedNames = new Set<string>();
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
        ] as FishSpeciesType[]);

  let idCounter = 1;

  const spawnSingleFish = (species: FishSpeciesType) => {
    if (species === 'mascot') {
      const size = 48;
      fish.push({
        id: idCounter++,
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
      });
    } else if (species === 'angelfish') {
      const size = 38 + Math.random() * 4;
      fish.push({
        id: idCounter++,
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
      });
    } else if (species === 'cherryShrimp') {
      const size = 13 + Math.random() * 2;
      fish.push({
        id: idCounter++,
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
      });
    } else if (species === 'rasbora') {
      const size = 21 + Math.random() * 3;
      fish.push({
        id: idCounter++,
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
      });
    } else if (species === 'guppy') {
      const guppyTails = ['#06b6d4', '#ec4899', '#8b5cf6', '#f59e0b'];
      const pickedTail = guppyTails[Math.floor(Math.random() * guppyTails.length)];
      const size = 25 + Math.random() * 3;
      fish.push({
        id: idCounter++,
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
      });
    } else if (species === 'neonTetra') {
      const size = 18 + Math.random() * 2;
      fish.push({
        id: idCounter++,
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
      });
    } else if (species === 'shark') {
      const size = 56 + Math.random() * 5;
      fish.push({
        id: idCounter++,
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
      });
    } else if (species === 'whale') {
      const size = 88 + Math.random() * 8;
      fish.push({
        id: idCounter++,
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
      });
    } else if (species === 'dolphin') {
      const size = 46 + Math.random() * 4;
      fish.push({
        id: idCounter++,
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
      });
    } else if (species === 'mantaRay') {
      const size = 50 + Math.random() * 4;
      fish.push({
        id: idCounter++,
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
      });
    } else if (species === 'pufferfish') {
      const size = 27 + Math.random() * 3;
      fish.push({
        id: idCounter++,
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
      });
    } else {
      const size = 22;
      fish.push({
        id: idCounter++,
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
      });
    }
  };

  // Ensure targetCount is at least the number of active species so every chosen species is represented
  const targetCount = Math.max(totalCount, speciesList.length);

  // Phase 1: Guarantee exactly 1 fish for EVERY active species first
  for (const sp of speciesList) {
    if (fish.length >= targetCount) break;
    spawnSingleFish(sp);
  }

  // Phase 2: If targetCount > speciesList.length (e.g. user dragged density slider), round-robin fill remaining slots
  let loopIndex = 0;
  while (fish.length < targetCount) {
    const nextSpecies = speciesList[loopIndex % speciesList.length];
    spawnSingleFish(nextSpecies);
    loopIndex++;
  }

  return fish;
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
  const len = fish.size;
  const hgt = fish.size * 0.42;

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
  ctx.ellipse(0, 0, len * 0.5, hgt, 0, 0, Math.PI * 2);
  ctx.fill();

  // Golden belly highlight
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.ellipse(len * 0.1, hgt * 0.3, len * 0.25, hgt * 0.4, 0, 0, Math.PI * 2);
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
  const len = fish.size;
  const hgt = fish.size * 0.3;

  // 1. Sleek Torpedo Body
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.ellipse(0, 0, len * 0.45, hgt, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pearlescent belly & metallic scales
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.ellipse(len * 0.05, 0, len * 0.25, hgt * 0.6, 0, 0, Math.PI * 2);
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
