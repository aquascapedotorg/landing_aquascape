import React from 'react';

interface Props {
  /** Ukuran (lebar) siluet dalam px. Tinggi mengikuti rasio. */
  size?: number;
  className?: string;
}

/**
 * Siluet koi legendaris yang belum tiba — bentuk ikan koi remang dengan isian
 * emas transparan dan glow lembut, dipakai sebagai hint "Legend Incoming" di
 * Zen mode. Presentasi murni (tanpa state).
 */
export const LegendaryKoiSilhouette: React.FC<Props> = ({ size = 44, className = '' }) => {
  const height = size * 0.55;
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 100 55"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`animate-pulse ${className}`}
      aria-hidden="true"
      style={{ filter: 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.55))' }}
    >
      {/* Ekor koi */}
      <path
        d="M6 27 C 16 12, 22 20, 26 27 C 22 34, 16 42, 6 27 Z"
        fill="rgba(255, 215, 0, 0.28)"
      />
      {/* Sirip atas */}
      <path d="M52 16 C 60 4, 70 6, 66 18 Z" fill="rgba(255, 215, 0, 0.22)" />
      {/* Sirip bawah */}
      <path d="M50 40 C 58 50, 68 48, 62 38 Z" fill="rgba(255, 215, 0, 0.22)" />
      {/* Badan koi */}
      <path
        d="M24 27 C 34 14, 62 12, 82 22 C 90 26, 92 28, 92 28 C 92 28, 90 30, 82 34 C 62 44, 34 40, 24 27 Z"
        fill="rgba(255, 215, 0, 0.34)"
        stroke="rgba(255, 224, 128, 0.5)"
        strokeWidth="1"
      />
      {/* Mata */}
      <circle cx="80" cy="26" r="2" fill="rgba(120, 90, 10, 0.8)" />
    </svg>
  );
};
