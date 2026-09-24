import React from 'react';
import { FishSpeciesType } from '../types';

// Fill color per species, aligned with the canvas palette so the icon reads as
// the same fish that swims in the tank.
const SPECIES_COLOR: Record<FishSpeciesType, string> = {
  mascot: '#48b3bf',
  neonTetra: '#00f7ff',
  cherryShrimp: '#ef4444',
  angelfish: '#e2e8f0',
  rasbora: '#f97316',
  guppy: '#ec4899',
  shark: '#94a3b8',
  whale: '#60a5fa',
  dolphin: '#38bdf8',
  mantaRay: '#cbd5e1',
  pufferfish: '#f59e0b',
  orca: '#e2e8f0',
  turtle: '#22c55e',
  marlin: '#2f6591',
  anglerfish: '#8b5cf6',
  lanternfish: '#5eead4',
  viperfish: '#38bdf8',
  moray: '#3a6b52',
  electricEel: '#e8c65a',
};

// A simple, distinct silhouette per species drawn in a 24x24 viewBox. Bodies are
// an ellipse with a triangular tail; species differ by proportions and one accent
// so they are visually separable at small sizes.
function shapeFor(species: FishSpeciesType, color: string): React.ReactNode {
  const tail = (x: number, w: number, h: number) => (
    <path d={`M${x} 12 l-${w} -${h} l0 ${h * 2} z`} fill={color} />
  );
  switch (species) {
    case 'whale':
    case 'orca':
      return (
        <>
          <ellipse cx="13" cy="12" rx="9" ry="6" fill={color} />
          {tail(4, 4, 5)}
          <circle cx="17" cy="10" r="1.1" fill="#0a121d" />
        </>
      );
    case 'shark':
      return (
        <>
          <ellipse cx="13" cy="12" rx="9" ry="4.5" fill={color} />
          <path d="M12 8 l3 -5 l2 5 z" fill={color} />
          {tail(4, 4, 5)}
          <circle cx="18" cy="11" r="1" fill="#0a121d" />
        </>
      );
    case 'dolphin':
      return (
        <>
          <ellipse cx="13" cy="12" rx="9" ry="4" fill={color} />
          <path d="M11 9 l2 -3 l2 3 z" fill={color} />
          {tail(4, 4, 4)}
          <circle cx="18" cy="11" r="1" fill="#0a121d" />
        </>
      );
    case 'mantaRay':
      return (
        <>
          <path d="M4 12 q8 -7 16 0 q-8 5 -16 0 z" fill={color} />
          <circle cx="16" cy="11" r="1" fill="#0a121d" />
        </>
      );
    case 'pufferfish':
      return (
        <>
          <circle cx="12" cy="12" r="7" fill={color} />
          {tail(5, 3, 4)}
          <circle cx="15" cy="10" r="1.1" fill="#0a121d" />
        </>
      );
    case 'cherryShrimp':
      return (
        <>
          <path d="M6 14 q3 -8 12 -6 q-2 8 -12 6 z" fill={color} />
          <path d="M18 8 q3 -2 4 -4" stroke={color} strokeWidth="1" fill="none" />
          <circle cx="16" cy="9" r="0.9" fill="#0a121d" />
        </>
      );
    case 'angelfish':
      return (
        <>
          <path d="M12 4 q6 8 0 16 q-6 -8 0 -16 z" fill={color} />
          <circle cx="12" cy="9" r="1" fill="#0a121d" />
        </>
      );
    case 'guppy':
      return (
        <>
          <ellipse cx="12" cy="12" rx="6" ry="4" fill={color} />
          <path d="M6 12 l-4 -4 l1 4 l-1 4 z" fill={color} />
          <circle cx="15" cy="11" r="1" fill="#0a121d" />
        </>
      );
    case 'turtle':
      return (
        <>
          <ellipse cx="12" cy="12" rx="7" ry="5.5" fill={color} />
          <circle cx="20" cy="12" r="2" fill={color} />
          <path d="M9 8 l6 0 M9 16 l6 0" stroke="#0a121d" strokeWidth="0.8" />
        </>
      );
    case 'mascot':
      return (
        <>
          <path d="M18 12 l-6 -6 l-8 6 l8 6 z" fill={color} />
          {tail(4, 4, 5)}
          <circle cx="12" cy="10" r="1" fill="#ffffff" />
        </>
      );
    case 'marlin':
      return (
        <>
          <line x1="18" y1="12" x2="23" y2="11" stroke={color} strokeWidth="1.2" />
          <path d="M10 8 l2 -5 l3 6 z" fill={color} />
          <ellipse cx="11" cy="12" rx="8" ry="3.5" fill={color} />
          {tail(3, 4, 4)}
          <circle cx="16" cy="11" r="1" fill="#0a121d" />
        </>
      );
    case 'anglerfish':
      return (
        <>
          <path d="M9 6 q6 -4 8 1" stroke={color} strokeWidth="1" fill="none" />
          <circle cx="17" cy="7" r="1.6" fill="#96e6ff" />
          <ellipse cx="11" cy="13" rx="8" ry="7" fill={color} />
          <path d="M15 12 q-6 -1 -9 2 q5 4 9 2 z" fill="#0a0710" />
          <circle cx="12" cy="10" r="1" fill="#cfefff" />
        </>
      );
    case 'lanternfish':
      return (
        <>
          <ellipse cx="12" cy="12" rx="7" ry="4" fill={color} />
          {tail(5, 3, 3)}
          <circle cx="16" cy="11" r="1.6" fill="#ddffff" />
          <circle cx="16" cy="11" r="0.7" fill="#0a1a20" />
          <circle cx="10" cy="15" r="0.8" fill="#aef4d0" />
          <circle cx="13" cy="15" r="0.8" fill="#aef4d0" />
          <circle cx="7" cy="15" r="0.8" fill="#aef4d0" />
        </>
      );
    case 'viperfish':
      return (
        <>
          <circle cx="9" cy="5" r="1.4" fill="#96e6ff" />
          <ellipse cx="12" cy="12" rx="8" ry="3.5" fill={color} />
          <path d="M18 11 l-2 3 l-1 -3 z" fill="#eef5fb" />
          {tail(4, 4, 4)}
          <circle cx="16" cy="11" r="1" fill="#0a121d" />
        </>
      );
    case 'moray':
      return (
        <>
          <path d="M3 14 q4 -6 9 -5 q6 1 9 -3" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="20" cy="7" r="1" fill="#0c1a12" />
        </>
      );
    case 'electricEel':
      return (
        <>
          <path d="M3 14 q4 -6 9 -5 q6 1 9 -3" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M9 6 l1 -3 l1 2 l1 -2" stroke="#96e6ff" strokeWidth="1" fill="none" />
          <circle cx="20" cy="7" r="1" fill="#0c1a20" />
        </>
      );
    case 'rasbora':
    case 'neonTetra':
    default:
      return (
        <>
          <ellipse cx="13" cy="12" rx="8" ry="3.5" fill={color} />
          {tail(5, 4, 4)}
          <circle cx="18" cy="11" r="1" fill="#0a121d" />
        </>
      );
  }
}

export const FishSpeciesIcon: React.FC<{
  species: FishSpeciesType;
  size?: number;
  className?: string;
}> = ({ species, size = 22, className }) => {
  const color = SPECIES_COLOR[species] || SPECIES_COLOR.neonTetra;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {shapeFor(species, color)}
    </svg>
  );
};
