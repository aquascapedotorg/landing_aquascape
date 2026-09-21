export interface RepoItem {
  name: string;
  description: string;
  language: string | null;
  visibility: string;
  created_at: string;
  updated_at: string;
  topics: string[];
  html_url: string;
  readme: string | null;
}

export interface ReposData {
  generated_at: string;
  org: string;
  repos: RepoItem[];
}

export type LightingMode = 'daylight' | 'moonlight' | 'golden';

export interface AquascapeSettings {
  lighting: LightingMode;
  co2Active: boolean;
  waterFlow: 'calm' | 'normal' | 'lively';
  soundEnabled: boolean;
  zenMode: boolean;
  showFlora: boolean;
  fishDensity?: number;
  activeSpecies?: FishSpeciesType[];
  showNametags?: boolean;
  enableLifeCycle?: boolean;
  totalRegenerations?: number;
}

export type FishSpeciesType =
  | 'mascot'
  | 'neonTetra'
  | 'cherryShrimp'
  | 'angelfish'
  | 'rasbora'
  | 'guppy'
  | 'shark'
  | 'whale'
  | 'dolphin'
  | 'mantaRay'
  | 'pufferfish'
  | 'orca'
  | 'turtle';
export type FishLifeStage = 'baby' | 'juvenile' | 'adult' | 'elderly' | 'fading';

export interface FishParticle {
  id: number;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseSize: number;
  type: FishSpeciesType;
  color: string;
  secondaryColor?: string;
  accentColor?: string;
  angle: number;
  tailPhase: number;
  tailSpeed: number;
  targetX?: number;
  targetY?: number;
  hunger?: number;
  eatenCount?: number;
  stage: FishLifeStage;
  growthPoints: number;
  ageSec: number;
  fadeOpacity?: number;
}

export interface BubbleParticle {
  x: number;
  y: number;
  radius: number;
  speed: number;
  wobbleSpeed: number;
  wobbleDist: number;
  phase: number;
  opacity: number;
  isCo2: boolean;
}

export interface FoodParticle {
  id: number;
  x: number;
  y: number;
  vy: number;
  vx: number;
  size: number;
  angle: number;                           // Sudut rotasi saat melayang
  vRot: number;                            // Kecepatan putar di air
  seedType: 'striped' | 'black' | 'kernel';// Variasi cangkang kuaci
  color: string;
  eaten: boolean;
}

declare global {
  interface Window {
    __aquascapeDropFood?: (x?: number, y?: number) => void;
    __aquascapeSpawnBaby?: () => void;
    __aquascapeGetFishList?: () => FishParticle[];
    __aquascapeRenameFish?: (id: number, newName: string) => void;
  }
}

