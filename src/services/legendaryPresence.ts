import { normalizeName } from './streakCalculations';

/**
 * Menentukan apakah ada legend hari ini yang MENANG tapi ikannya BELUM muncul
 * di canvas. Dipakai untuk menampilkan siluet "Legend Incoming" di Zen mode.
 *
 * Pencocokan nama memakai normalizeName yang sama dengan tagLegendary di canvas
 * (trim + collapse spasi, case-sensitive), agar konsisten dengan cara ikan asli
 * ditandai legendaris.
 *
 * Fungsi murni: tidak menyentuh jaringan, mudah diuji.
 */
export function hasPendingLegend(
  winners: { name: string }[],
  canvasNames: string[]
): boolean {
  if (!Array.isArray(winners) || winners.length === 0) return false;
  const present = new Set(
    (Array.isArray(canvasNames) ? canvasNames : []).map((n) => normalizeName(n || ''))
  );
  return winners.some((w) => {
    if (!w || !w.name) return false;
    return !present.has(normalizeName(w.name));
  });
}
