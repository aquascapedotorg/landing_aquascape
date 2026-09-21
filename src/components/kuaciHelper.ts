import { FoodParticle } from '../types';

/**
 * Generates a batch of realistic Kuaci (Sunflower Seeds) particles.
 */
export function generateKuaciBatch(dropX: number, dropY: number, customCount?: number): FoodParticle[] {
  const newFood: FoodParticle[] = [];
  const count = customCount !== undefined ? customCount : 4 + Math.floor(Math.random() * 3);

  for (let i = 0; i < count; i++) {
    const typeRand = Math.random();
    const seedType: 'striped' | 'black' | 'kernel' =
      typeRand < 0.65 ? 'striped' : typeRand < 0.88 ? 'black' : 'kernel';

    newFood.push({
      id: Math.random(),
      x: dropX + (Math.random() * 34 - 17),
      y: dropY + Math.random() * 10,
      vx: (Math.random() - 0.5) * 0.35,
      vy: 0.45 + Math.random() * 0.35,
      size: 5 + Math.random() * 2.2,
      angle: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 2.4,
      seedType,
      color: seedType === 'kernel' ? '#fef08a' : seedType === 'striped' ? '#18202c' : '#0b0f17',
      eaten: false,
    });
  }

  return newFood;
}

/**
 * Updates individual Kuaci position and floating physics with water drift.
 */
export function updateKuaciParticle(flake: FoodParticle, dt: number, timeSec: number): void {
  flake.y += flake.vy * dt * 45;
  flake.x += Math.sin(timeSec * 2.5 + flake.id * 8) * 0.35 + flake.vx;
  flake.angle += flake.vRot * dt;
}

/**
 * Draws a single Kuaci particle with realistic teardrop shell, striped textures, or roasted kernel.
 */
export function drawKuaciParticle(ctx: CanvasRenderingContext2D, flake: FoodParticle): void {
  ctx.save();
  ctx.translate(flake.x, flake.y);
  ctx.rotate(flake.angle);

  const len = flake.size;
  const w = flake.size * 0.52;

  if (flake.seedType === 'kernel') {
    // Inti biji kuaci kupas (Roasted golden kernel)
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(0, -len * 0.85);
    ctx.bezierCurveTo(w * 0.8, -len * 0.3, w * 0.8, len * 0.7, 0, len * 0.85);
    ctx.bezierCurveTo(-w * 0.8, len * 0.7, -w * 0.8, -len * 0.3, 0, -len * 0.85);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.3, len * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Cangkang kuaci bunga matahari (Classic pointed sunflower seed)
    ctx.fillStyle = flake.seedType === 'striped' ? '#18202c' : '#0b0f17';
    ctx.beginPath();
    ctx.moveTo(0, -len);
    ctx.bezierCurveTo(w, -len * 0.3, w * 0.95, len * 0.7, 0, len * 0.85);
    ctx.bezierCurveTo(-w * 0.95, len * 0.7, -w, -len * 0.3, 0, -len);
    ctx.fill();

    // Bingkai tepi cangkang
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Garis putih khas kuaci (Lengthwise stripes)
    if (flake.seedType === 'striped') {
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 0.7;
      ctx.lineCap = 'round';

      // Garis kiri
      ctx.beginPath();
      ctx.moveTo(0, -len * 0.75);
      ctx.quadraticCurveTo(-w * 0.45, 0, 0, len * 0.7);
      ctx.stroke();

      // Garis kanan
      ctx.beginPath();
      ctx.moveTo(0, -len * 0.75);
      ctx.quadraticCurveTo(w * 0.45, 0, 0, len * 0.7);
      ctx.stroke();
    }

    // Garis belahan tengah cangkang
    ctx.strokeStyle = flake.seedType === 'striped' ? '#94a3b8' : '#475569';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -len * 0.85);
    ctx.lineTo(0, len * 0.75);
    ctx.stroke();
  }

  ctx.restore();
}
