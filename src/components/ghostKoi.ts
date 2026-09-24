/**
 * Koi hantu "Legend" — satu siluet yang berenang di canvas Zen sebagai isyarat
 * bahwa legend belum lahir hari ini. Ia hidup TERPISAH dari fishRef, jadi tidak
 * pernah masuk hitungan jumlah ikan, tidak bisa diklik, dan tidak jadi legendary.
 *
 * Modul ini hanya berisi state gerak + fisika (murni, mudah diuji). Penggambaran
 * dilakukan di AquascapeCanvas memakai path koi legendary yang sama (redup).
 */
export interface GhostKoi {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tailPhase: number;
  size: number;
}

/** Margin dari tepi agar koi (dan labelnya) tidak keluar layar. */
function margin(g: { size: number }): number {
  return Math.max(48, g.size * 1.2);
}

/**
 * Buat ghost koi dengan posisi acak di dalam kanvas dan kecepatan awal tak nol.
 * Bergerak pelan (lebih lambat dari ikan biasa) agar terasa anggun & misterius.
 */
export function createGhostKoi(w: number, h: number): GhostKoi {
  const size = 40;
  const m = Math.max(48, size * 1.2);
  const dir = Math.random() < 0.5 ? -1 : 1;
  return {
    x: m + Math.random() * Math.max(1, w - 2 * m),
    y: m + Math.random() * Math.max(1, h - 2 * m),
    vx: dir * (0.6 + Math.random() * 0.4), // px per frame @60fps
    vy: (Math.random() - 0.5) * 0.4,
    tailPhase: Math.random() * Math.PI * 2,
    size,
  };
}

/**
 * Update posisi ghost koi. Bergerak sesuai kecepatan (diskala ke dt·60 agar
 * konsisten dgn ikan lain), memantul lembut di tepi, memajukan tailPhase, lalu
 * meng-clamp posisi agar selalu di dalam kanvas. Memutasi `g`.
 */
export function updateGhostKoi(g: GhostKoi, dt: number, w: number, h: number): void {
  const step = dt * 60;
  const m = margin(g);

  // Gerak vertikal alami yang halus.
  g.vy += Math.sin(g.tailPhase * 0.5) * 0.01;

  g.x += g.vx * step;
  g.y += g.vy * step;

  // Pantul di tepi.
  if (g.x < m) g.vx = Math.abs(g.vx);
  else if (g.x > w - m) g.vx = -Math.abs(g.vx);
  if (g.y < m) g.vy = Math.abs(g.vy);
  else if (g.y > h - m) g.vy = -Math.abs(g.vy);

  // Batasi kecepatan vertikal agar tidak menukik.
  if (g.vy > 0.6) g.vy = 0.6;
  else if (g.vy < -0.6) g.vy = -0.6;

  // Kibas ekor.
  g.tailPhase += dt * 6;

  // Clamp posisi di dalam kanvas.
  g.x = Math.min(Math.max(g.x, m), Math.max(m, w - m));
  g.y = Math.min(Math.max(g.y, m), Math.max(m, h - m));
}
