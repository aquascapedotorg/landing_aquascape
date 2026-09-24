import { LightingMode } from '../types';

/** A concrete lighting mode the canvas can actually render (never 'auto'). */
export type ResolvedLighting = 'daylight' | 'golden' | 'moonlight';

/**
 * Maps a local hour (0-23) to a concrete lighting mode:
 *   06:00-14:59 -> daylight, 15:00-17:59 -> golden, 18:00-05:59 -> moonlight.
 */
export function lightingForHour(hour: number): ResolvedLighting {
  if (hour >= 6 && hour < 15) return 'daylight';
  if (hour >= 15 && hour < 18) return 'golden';
  return 'moonlight';
}

/**
 * Resolves a lighting setting to a concrete mode. 'auto' follows the real local
 * time of day; any explicit mode is returned unchanged. `now` is injectable for
 * testing.
 */
export function resolveLighting(mode: LightingMode, now: Date = new Date()): ResolvedLighting {
  if (mode === 'auto') return lightingForHour(now.getHours());
  return mode;
}
