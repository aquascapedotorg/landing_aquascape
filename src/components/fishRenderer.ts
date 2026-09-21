import { FishParticle, FishSpeciesType } from '../types';
import { getFishName } from '../data/fishCatalog';

/**
 * Creates an ecosystem school of fish with unique names from the catalog.
 */
export function createFishSchool(
  width: number,
  height: number,
  totalCount: number = 10,
  activeSpecies: FishSpeciesType[] = ['mascot', 'neonTetra', 'cherryShrimp', 'angelfish', 'rasbora', 'guppy']
): FishParticle[] {
  const fish: FishParticle[] = [];
  const usedNames = new Set<string>();
  const speciesList = activeSpecies.length > 0 ? activeSpecies : (['mascot', 'neonTetra'] as FishSpeciesType[]);

  let idCounter = 1;

  // 1. Always spawn Flagship Mascot if active
  if (speciesList.includes('mascot')) {
    fish.push({
      id: idCounter++,
      name: getFishName('mascot', usedNames),
      x: width * 0.35 + Math.random() * (width * 0.3),
      y: height * 0.35 + Math.random() * (height * 0.3),
      vx: 1.1,
      vy: 0.1,
      size: 42,
      type: 'mascot',
      color: '#0e385e',
      secondaryColor: '#48b3bf',
      angle: 0,
      tailPhase: Math.random() * Math.PI * 2,
      tailSpeed: 0.18,
      hunger: 0,
      eatenCount: 0,
    });
  }

  // 2. Spawn Angelfish Centerpiece if active (swims higher and gracefully)
  if (speciesList.includes('angelfish') && fish.length < totalCount) {
    const angelfishCount = Math.min(2, Math.max(1, Math.floor(totalCount / 7)));
    for (let i = 0; i < angelfishCount; i++) {
      if (fish.length >= totalCount) break;
      fish.push({
        id: idCounter++,
        name: getFishName('angelfish', usedNames),
        x: width * 0.2 + Math.random() * (width * 0.6),
        y: height * 0.2 + Math.random() * (height * 0.4),
        vx: (Math.random() > 0.5 ? 1 : -1) * (0.45 + Math.random() * 0.35),
        vy: (Math.random() - 0.5) * 0.2,
        size: 34 + Math.random() * 8,
        type: 'angelfish',
        color: '#e2e8f0',
        secondaryColor: '#334155',
        accentColor: '#facc15',
        angle: 0,
        tailPhase: Math.random() * Math.PI * 2,
        tailSpeed: 0.12,
        hunger: 0,
        eatenCount: 0,
      });
    }
  }

  // 3. Spawn Cherry Shrimp if active (substrate crawler)
  if (speciesList.includes('cherryShrimp') && fish.length < totalCount) {
    const shrimpCount = Math.min(3, Math.max(1, Math.floor(totalCount / 6)));
    for (let i = 0; i < shrimpCount; i++) {
      if (fish.length >= totalCount) break;
      fish.push({
        id: idCounter++,
        name: getFishName('cherryShrimp', usedNames),
        x: width * 0.15 + Math.random() * (width * 0.7),
        y: height - 32 - Math.random() * 10,
        vx: (Math.random() > 0.5 ? 1 : -1) * 0.35,
        vy: 0,
        size: 13 + Math.random() * 3,
        type: 'cherryShrimp',
        color: '#ef4444',
        secondaryColor: '#fca5a5',
        angle: 0,
        tailPhase: 0,
        tailSpeed: 0.1,
        hunger: 0,
        eatenCount: 0,
      });
    }
  }

  // 4. Fill remaining slots with schooling fish (neonTetra, rasbora, guppy)
  const schoolingSpecies = speciesList.filter(
    (s) => s === 'neonTetra' || s === 'rasbora' || s === 'guppy'
  );
  const pool = schoolingSpecies.length > 0 ? schoolingSpecies : speciesList;

  while (fish.length < totalCount) {
    const species = pool[Math.floor(Math.random() * pool.length)];

    if (species === 'neonTetra') {
      fish.push({
        id: idCounter++,
        name: getFishName('neonTetra', usedNames),
        x: width * 0.2 + Math.random() * (width * 0.6),
        y: height * 0.25 + Math.random() * (height * 0.5),
        vx: (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 0.7),
        vy: (Math.random() - 0.5) * 0.3,
        size: 16 + Math.random() * 5,
        type: 'neonTetra',
        color: '#00f7ff',
        secondaryColor: '#ff2b4f',
        angle: 0,
        tailPhase: Math.random() * Math.PI * 2,
        tailSpeed: 0.22 + Math.random() * 0.1,
        hunger: 0,
        eatenCount: 0,
      });
    } else if (species === 'rasbora') {
      fish.push({
        id: idCounter++,
        name: getFishName('rasbora', usedNames),
        x: width * 0.2 + Math.random() * (width * 0.6),
        y: height * 0.2 + Math.random() * (height * 0.5),
        vx: (Math.random() > 0.5 ? 1 : -1) * (0.75 + Math.random() * 0.6),
        vy: (Math.random() - 0.5) * 0.35,
        size: 17 + Math.random() * 5,
        type: 'rasbora',
        color: '#f97316',
        secondaryColor: '#0f172a',
        accentColor: '#dc2626',
        angle: 0,
        tailPhase: Math.random() * Math.PI * 2,
        tailSpeed: 0.2 + Math.random() * 0.08,
        hunger: 0,
        eatenCount: 0,
      });
    } else if (species === 'guppy') {
      const guppyTails = ['#06b6d4', '#ec4899', '#8b5cf6', '#f59e0b'];
      const pickedTail = guppyTails[Math.floor(Math.random() * guppyTails.length)];
      fish.push({
        id: idCounter++,
        name: getFishName('guppy', usedNames),
        x: width * 0.15 + Math.random() * (width * 0.7),
        y: height * 0.15 + Math.random() * (height * 0.45),
        vx: (Math.random() > 0.5 ? 1 : -1) * (0.6 + Math.random() * 0.5),
        vy: (Math.random() - 0.5) * 0.3,
        size: 18 + Math.random() * 5,
        type: 'guppy',
        color: '#cbd5e1',
        secondaryColor: pickedTail,
        angle: 0,
        tailPhase: Math.random() * Math.PI * 2,
        tailSpeed: 0.24 + Math.random() * 0.1,
        hunger: 0,
        eatenCount: 0,
      });
    } else {
      // Fallback
      fish.push({
        id: idCounter++,
        name: getFishName(species, usedNames),
        x: width * 0.3 + Math.random() * (width * 0.4),
        y: height * 0.3 + Math.random() * (height * 0.4),
        vx: (Math.random() > 0.5 ? 1 : -1) * 0.8,
        vy: 0,
        size: 20,
        type: species,
        color: '#38bdf8',
        angle: 0,
        tailPhase: 0,
        tailSpeed: 0.2,
        hunger: 0,
        eatenCount: 0,
      });
    }
  }

  return fish;
}

/**
 * Renders Angelfish (Manfish) - majestic centerpiece with tall vertical fins
 */
export function drawAngelfish(ctx: CanvasRenderingContext2D, fish: FishParticle, tailWag: number): void {
  ctx.save();
  const scale = fish.size / 40;
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
 * Draws an interactive nametag badge above a fish.
 */
export function drawFishNametag(
  ctx: CanvasRenderingContext2D,
  fish: FishParticle,
  isHovered: boolean = false
): void {
  ctx.save();
  ctx.translate(fish.x, fish.y - fish.size * 0.8 - (isHovered ? 18 : 12));

  const name = fish.name || 'Ikan';
  ctx.font = isHovered ? 'bold 11px monospace' : '10px monospace';
  const textWidth = ctx.measureText(name).width;
  const badgeWidth = textWidth + (isHovered ? 20 : 14);
  const badgeHeight = isHovered ? 20 : 16;

  // Frosted dark pill background
  ctx.fillStyle = isHovered ? 'rgba(9, 19, 29, 0.92)' : 'rgba(9, 19, 29, 0.65)';
  ctx.strokeStyle = isHovered ? 'rgba(45, 212, 191, 0.85)' : 'rgba(45, 212, 191, 0.3)';
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.roundRect(-badgeWidth / 2, -badgeHeight / 2, badgeWidth, badgeHeight, 8);
  ctx.fill();
  ctx.stroke();

  // Glowing dot
  ctx.fillStyle = isHovered ? '#2dd4bf' : '#38bdf8';
  ctx.beginPath();
  ctx.arc(-badgeWidth / 2 + (isHovered ? 6 : 5), 0, isHovered ? 2.5 : 2, 0, Math.PI * 2);
  ctx.fill();

  // Fish Name Text
  ctx.fillStyle = isHovered ? '#ffffff' : '#e2e8f0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, isHovered ? 3 : 2, 0);

  // Extra hover tooltip line: Species & Eaten Kuaci
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
        : 'Tetra';
    const subText = `${speciesLabel} • ${fish.eatenCount || 0} kuaci`;

    ctx.font = '9px sans-serif';
    const subWidth = ctx.measureText(subText).width + 12;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.beginPath();
    ctx.roundRect(-subWidth / 2, -badgeHeight / 2 - 14, subWidth, 13, 4);
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(subText, 0, -badgeHeight / 2 - 8);
  }

  ctx.restore();
}
