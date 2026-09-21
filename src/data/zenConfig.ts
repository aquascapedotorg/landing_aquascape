import { AquascapeSettings, FishSpeciesType } from '../types';

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
  version: "1.0.0",
  name: "AQUASCAPE Zen Aquarium Configuration",
  defaults: {
    lighting: "daylight",
    co2Active: true,
    waterFlow: "normal",
    soundEnabled: false,
    showFlora: true,
    showNametags: true,
    enableLifeCycle: true,
    fishDensity: 5,
    activeSpecies: [
      "mascot",
      "angelfish",
      "cherryShrimp",
      "rasbora",
      "guppy"
    ]
  },
  telemetry: {
    temperature: "24.8°C",
    ph: "pH 6.6",
    co2: "CO2 ~28ppm"
  },
  presets: [
    {
      id: "team",
      label: "Tim Inti AQUASCAPE",
      density: 5,
      activeSpecies: ["mascot", "angelfish", "cherryShrimp", "rasbora", "guppy"]
    },
    {
      id: "oceanic",
      label: "Samudra Tropis (Hiu, Paus & Pari)",
      density: 5,
      activeSpecies: ["shark", "whale", "dolphin", "mantaRay", "pufferfish"]
    },
    {
      id: "schooling",
      label: "Schooling Ramai",
      density: 15,
      activeSpecies: ["neonTetra", "rasbora", "guppy", "pufferfish"]
    },
    {
      id: "minimalist",
      label: "Zen Minimalis",
      density: 2,
      activeSpecies: ["mascot", "whale"]
    }
  ]
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
