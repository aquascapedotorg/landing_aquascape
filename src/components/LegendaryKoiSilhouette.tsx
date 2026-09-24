import React from 'react';

interface Props {
  /** Ukuran (lebar) siluet dalam px. Tinggi mengikuti rasio. */
  size?: number;
  className?: string;
}

/**
 * Siluet koi legendaris — meniru BENTUK koi asli yang di-render di canvas
 * (AquascapeCanvas: badan bulat gempal, ekor kipas dua-cuping, sirip punggung
 * & perut segitiga), tetapi dibuat redup/transparan sebagai "bayangan" koi yang
 * belum lahir. Menghadap KANAN (kepala + mata di kanan, ekor kipas di kiri).
 *
 * Koi asli TIDAK bersungut, jadi siluet ini pun tanpa sungut agar konsisten.
 * Presentasi murni (tanpa state).
 *
 * Geometri diselaraskan dengan konstanta canvas (L = panjang, Hh = setengah
 * tinggi ≈ 0.42·L), dipetakan ke viewBox 100×60 dengan pusat badan di (52, 30).
 */
export const LegendaryKoiSilhouette: React.FC<Props> = ({ size = 50, className = '' }) => {
  const height = size * 0.6;
  // Warna emas transparan (bayangan), mengikuti palet koi canvas namun redup.
  const gold = 'rgba(245, 197, 66, 0.34)';
  const goldSoft = 'rgba(255, 215, 0, 0.24)';
  const goldStroke = 'rgba(255, 224, 128, 0.5)';
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 100 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`animate-pulse ${className}`}
      aria-hidden="true"
      style={{ filter: 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.55))' }}
    >
      {/* Ekor kipas dua-cuping di kiri (meniru quadraticCurve ekor canvas) */}
      <path
        d="M40 30
           C 28 18, 20 20, 16 24
           C 24 30, 24 30, 16 36
           C 20 40, 28 42, 40 30 Z"
        fill={goldSoft}
      />

      {/* Sirip punggung (segitiga menyapu ke belakang, di atas badan) */}
      <path d="M56 12 C 48 2, 40 6, 38 14 L 48 16 Z" fill={goldSoft} />
      {/* Sirip perut (bawah badan) */}
      <path d="M56 48 C 48 58, 40 54, 38 46 L 48 44 Z" fill={goldSoft} />

      {/* Badan bulat gempal (ellipse) — ciri koi chibi di canvas */}
      <ellipse
        cx="60"
        cy="30"
        rx="28"
        ry="21"
        fill={gold}
        stroke={goldStroke}
        strokeWidth="1"
      />

      {/* Kilau lembut (menandai badan atas, seperti sheen putih koi asli) */}
      <ellipse cx="66" cy="22" rx="7" ry="9" fill="rgba(255, 255, 255, 0.14)" />

      {/* Mata */}
      <circle cx="78" cy="26" r="2.6" fill="rgba(60, 42, 0, 0.85)" />
    </svg>
  );
};
