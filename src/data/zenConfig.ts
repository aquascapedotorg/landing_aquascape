import rawZenConfig from '../../public/zen-config.json';
import { FishSpeciesType } from '../types';

export interface ZenPreset {
  id: string;
  label: string;
  density: number;
  activeSpecies: FishSpeciesType[];
}

export interface ZenConfigData {
  version: string;
  name: string;
  defaults: {
    lighting: 'daylight' | 'moonlight' | 'golden';
    co2Active: boolean;
    waterFlow: 'calm' | 'normal' | 'lively';
    soundEnabled: boolean;
    showFlora: boolean;
    showNametags: boolean;
    enableLifeCycle: boolean;
    fishDensity: number;
    activeSpecies: FishSpeciesType[];
  };
  telemetry: {
    temperature: string;
    ph: string;
    co2: string;
  };
  presets: ZenPreset[];
}

export const ZEN_CONFIG: ZenConfigData = {
  version: rawZenConfig.version,
  name: rawZenConfig.name,
  defaults: {
    ...rawZenConfig.defaults,
    activeSpecies: rawZenConfig.defaults.activeSpecies as FishSpeciesType[],
    lighting: rawZenConfig.defaults.lighting as 'daylight' | 'moonlight' | 'golden',
    waterFlow: rawZenConfig.defaults.waterFlow as 'calm' | 'normal' | 'lively',
  },
  telemetry: rawZenConfig.telemetry,
  presets: rawZenConfig.presets as unknown as ZenPreset[],
};

/**
 * Asynchronously loads zen-config.json from public folder to keep runtime settings synchronized
 */
export async function loadZenConfig(): Promise<ZenConfigData> {
  try {
    const res = await fetch('./zen-config.json');
    if (res.ok) {
      const json = await res.json();
      if (json && json.defaults) {
        ZEN_CONFIG.defaults = { ...ZEN_CONFIG.defaults, ...json.defaults };
        if (json.telemetry) {
          ZEN_CONFIG.telemetry = { ...ZEN_CONFIG.telemetry, ...json.telemetry };
        }
        if (Array.isArray(json.presets)) {
          ZEN_CONFIG.presets = json.presets;
        }
      }
    }
  } catch (err) {
    console.log('Using bundled ZEN_CONFIG fallback:', err);
  }
  return ZEN_CONFIG;
}
