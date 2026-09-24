import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AquascapeSettings, FishParticle, BubbleParticle, FoodParticle, FishSpeciesType } from '../types';
import { aquascapeAudio } from './AquascapeAudio';
import { aquascapeEvents } from './aquascapeEvents';
import {
  createFishSchool,
  syncFishSchool,
  adjustFishPositionsForResize,
  createSingleFish,
  drawAngelfish,
  drawRasbora,
  drawGuppy,
  drawFishNametag,
  drawShark,
  drawWhale,
  drawDolphin,
  drawMantaRay,
  drawPufferfish,
  drawOrca,
  drawTurtle,
  drawMarlin,
  drawAnglerfish,
  drawLanternfish,
  drawViperfish,
  drawMoray,
  drawElectricEel,
  getFishOrientation,
} from './fishRenderer';
import { getFishName, getActiveCommunalFishes } from '../data/fishCatalog';
import { isSupabaseModeActive } from '../services/supabaseFishService';
import { normalizeName } from '../services/streakCalculations';
import { getLegendaryNames, getTodayLegendaryList } from '../services/legendaryService';
import { shouldTeaseLegend } from '../services/legendaryPresence';
import { GhostKoi, createGhostKoi, updateGhostKoi } from './ghostKoi';
import { resolveLighting } from '../data/lightingUtils';
import { ensureMascotSprite, getMascotSprite, getMascotAspect, getMascotParts } from './mascotImage';
import { recordKuaciEaten, getStreakFor } from '../services/streakService';
import { CommunalFishInput } from './aquascapeEvents';
import {
  updateFishLifeCycle,
  feedFishKuaci,
  spawnBabyFish,
  getFishStageScale,
} from './lifeCycleHelper';

interface CanvasProps {
  settings: AquascapeSettings;
  onFeed?: () => void;
  className?: string;
  isHeroOnly?: boolean;
  cleanMode?: boolean;
  onRegenerate?: (count?: number) => void;
}

interface PlantStem {
  baseX: number;
  baseY: number;
  height: number;
  segments: number;
  color: string;
  stemWidth: number;
  phase: number;
  speed: number;
  leafType: 'blade' | 'rotala' | 'broad' | 'hairgrass';
}

export function applyCommunalFishesToSchool(
  currentFish: FishParticle[],
  communalList: CommunalFishInput[],
  width: number,
  height: number
): FishParticle[] {
  if (!communalList || communalList.length === 0) return currentFish;

  const usedNames = new Set<string>(currentFish.map((f) => f.name));
  const communalFish: FishParticle[] = [];

  communalList.forEach((communal, idx) => {
    // 1. Check if an active communal fish particle already exists
    const existing = currentFish.find(
      (f) =>
        f.isCommunal &&
        !communalFish.includes(f) &&
        ((f.communalId !== undefined && f.communalId === communal.id) ||
          (f.name === communal.name && f.type === communal.species))
    );

    if (existing) {
      existing.name = communal.name;
      existing.type = communal.species;
      existing.isCommunal = true;
      existing.communalId = communal.id;
      communalFish.push(existing);
    } else {
      // 2. Spawn a dedicated communal fish! (Communal fish are added on top of regular fish)
      const newFish = createSingleFish(
        communal.species,
        Date.now() + idx + 5000,
        width,
        height,
        usedNames,
        communal.name,
        true
      );
      newFish.communalId = communal.id;
      usedNames.add(newFish.name);
      communalFish.push(newFish);
    }
  });

  // Keep ALL non-communal regular fish from .json!
  const regularFish = currentFish.filter((f) => !f.isCommunal);

  return [...regularFish, ...communalFish];
}

export const AquascapeCanvas: React.FC<CanvasProps> = ({
  settings,
  className = '',
  isHeroOnly = false,
  cleanMode = false,
  onRegenerate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const settingsRef = useRef<AquascapeSettings>(settings);
  const cleanModeRef = useRef(cleanMode);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    cleanModeRef.current = cleanMode;
  }, [cleanMode]);

  // Particles and entities stored in refs for optimal 60fps rendering without React re-render lag
  const fishRef = useRef<FishParticle[]>([]);
  const bubblesRef = useRef<BubbleParticle[]>([]);
  const foodRef = useRef<FoodParticle[]>([]);
  const legendaryTrailRef = useRef<Map<number, { x: number; y: number }[]>>(new Map());
  // Ghost "Legend?" koi: swims separately from fishRef so it is never counted,
  // clickable, or made legendary. Active only while no legend exists today.
  const ghostRef = useRef<GhostKoi | null>(null);
  const ghostActiveRef = useRef(false);
  const plantsRef = useRef<PlantStem[]>([]);
  const ripplesRef = useRef<{ x: number; y: number; r: number; opacity: number }[]>([]);
  const mouseRef = useRef<{ x: number; y: number; isDown: boolean; active: boolean }>({
    x: -1000,
    y: -1000,
    isDown: false,
    active: false,
  });

  const [fishCount, setFishCount] = useState(8);
  const [foodCount, setFoodCount] = useState(0);

  // Initialize plants & hardscape based on canvas dimensions
  const initAquascape = useCallback((width: number, height: number) => {
    // 1. Initialize flora / plants
    const plants: PlantStem[] = [];

    // Left thick background forest (Vallisneria & Rotala)
    const leftCount = Math.floor(width * 0.05);
    for (let i = 0; i < leftCount; i++) {
      const baseX = Math.random() * (width * 0.32);
      const heightVar = height * (0.45 + Math.random() * 0.48);
      const isRotala = Math.random() > 0.5;
      plants.push({
        baseX,
        baseY: height,
        height: heightVar,
        segments: 10 + Math.floor(Math.random() * 6),
        color: isRotala
          ? (Math.random() > 0.4 ? '#2d6a4f' : '#38b000')
          : (Math.random() > 0.3 ? '#1b4332' : '#2d6a4f'),
        stemWidth: isRotala ? 3.5 : 5,
        phase: Math.random() * Math.PI * 2,
        speed: 0.8 + Math.random() * 0.6,
        leafType: isRotala ? 'rotala' : 'blade',
      });
    }

    // Right background forest (Amazon swords & Tall grasses)
    const rightCount = Math.floor(width * 0.04);
    for (let i = 0; i < rightCount; i++) {
      const baseX = width * 0.68 + Math.random() * (width * 0.32);
      const heightVar = height * (0.4 + Math.random() * 0.5);
      plants.push({
        baseX,
        baseY: height,
        height: heightVar,
        segments: 12,
        color: Math.random() > 0.5 ? '#1f4e38' : '#2d6a4f',
        stemWidth: 4.5,
        phase: Math.random() * Math.PI * 2,
        speed: 0.7 + Math.random() * 0.5,
        leafType: Math.random() > 0.6 ? 'broad' : 'blade',
      });
    }

    // Foreground carpeting hairgrass across the bed
    const grassCount = Math.floor(width / 14);
    for (let i = 0; i < grassCount; i++) {
      const baseX = (i / grassCount) * width + (Math.random() * 10 - 5);
      plants.push({
        baseX,
        baseY: height,
        height: 25 + Math.random() * 45,
        segments: 4,
        color: Math.random() > 0.3 ? '#40916c' : '#52b788',
        stemWidth: 2,
        phase: Math.random() * Math.PI * 2,
        speed: 1.2 + Math.random() * 0.8,
        leafType: 'hairgrass',
      });
    }

    plantsRef.current = plants;

    // 2. Initialize Fish with custom density and species
    const defaultDensity = 11;
    const targetDensity = settings.fishDensity ?? defaultDensity;
    const activeSpecies: FishSpeciesType[] = settings.activeSpecies && settings.activeSpecies.length > 0
      ? settings.activeSpecies
      : ([
          'mascot',
          'angelfish',
          'cherryShrimp',
          'rasbora',
          'guppy',
          'neonTetra',
          'shark',
          'whale',
          'dolphin',
          'mantaRay',
          'pufferfish',
          'orca',
          'turtle',
          'marlin',
          'anglerfish',
          'lanternfish',
          'viperfish',
          'moray',
          'electricEel',
        ] as FishSpeciesType[]);

    const supabaseMode = isSupabaseModeActive();

    if (fishRef.current.length === 0) {
      // 1. Inherit from active provider if another canvas (e.g. Hero canvas when Zen mounts) already has live fish!
      const existing = aquascapeEvents.getExistingFishWithSize();
      const existingLive = existing.fish;
      let fish: FishParticle[];

      if (existingLive && existingLive.length > 0) {
        // Rescale inherited positions PROPORTIONALLY using the source canvas's
        // actual size (not a hardcoded resolution), so fish keep their relative
        // spread on any screen instead of piling up at an edge.
        const srcW = existing.width && existing.width > 0 ? existing.width : width;
        const srcH = existing.height && existing.height > 0 ? existing.height : height;
        fish = existingLive.map((f) => ({
          ...f,
          id: f.id,
          x: Math.min(Math.max(20, (f.x / srcW) * width), width - 20),
          y: Math.min(Math.max(20, (f.y / srcH) * height), height - 20),
        }));
      } else {
        fish = createFishSchool(width, height, targetDensity, activeSpecies, supabaseMode);
      }

      // 2. Unconditionally sync all communal fish from Supabase (bypasses activeSpecies & density limits)
      const communalList = getActiveCommunalFishes();
      if (communalList.length > 0) {
        fish = applyCommunalFishesToSchool(fish, communalList, width, height);
      }

      fishRef.current = fish;
      tagLegendary(fishRef.current);
      setFishCount(fish.length);
    } else {
      // Canvas already has fish (e.g. Zen canvas whose density effect ran on mount
      // before this init). Still merge in ALL communal fish so switching canvases
      // never drops Supabase fauna, then reconcile positions.
      const communalList = getActiveCommunalFishes();
      if (communalList.length > 0) {
        fishRef.current = applyCommunalFishesToSchool(
          fishRef.current,
          communalList,
          width,
          height
        );
      }
      adjustFishPositionsForResize(fishRef.current, width, height);
      tagLegendary(fishRef.current);
      setFishCount(fishRef.current.length);
    }

    // 3. Initialize ambient bubbles & CO2 diffuser
    const bubbles: BubbleParticle[] = [];
    for (let i = 0; i < 28; i++) {
      bubbles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 1.5 + Math.random() * 3.5,
        speed: 0.6 + Math.random() * 1.2,
        wobbleSpeed: 1 + Math.random() * 2,
        wobbleDist: 0.8 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
        opacity: 0.25 + Math.random() * 0.5,
        isCo2: false,
      });
    }
    bubblesRef.current = bubbles;
  }, []);

  // Drop food function (callable via button or click)
  const dropFood = useCallback((targetX?: number, targetY?: number) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const dropX = targetX !== undefined ? targetX : canvas.width * 0.5 + (Math.random() * 200 - 100);
    const dropY = targetY !== undefined ? Math.min(targetY, 80) : 10;

    const newFood: FoodParticle[] = [];
    const count = 4 + Math.floor(Math.random() * 3);

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

    foodRef.current = [...foodRef.current, ...newFood];
    setFoodCount(foodRef.current.length);

    // Create water surface ripple at drop location
    ripplesRef.current.push({
      x: dropX,
      y: 15,
      r: 4,
      opacity: 0.8,
    });

    // Alert fish to food
    fishRef.current.forEach((f) => {
      f.hunger = 100;
    });

    aquascapeAudio.playBubblePop();
  }, []);

  // Instant baby fish spawning triggered manually by user
  const spawnBaby = useCallback(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const speciesList =
      settings.activeSpecies && settings.activeSpecies.length > 0
        ? settings.activeSpecies
        : (['neonTetra', 'rasbora', 'guppy'] as FishSpeciesType[]);

    // Pick species (prefer non-mascot for baby schooling, or mascot if only mascot)
    const candidates = speciesList.filter((s) => s !== 'mascot');
    const pickedSpecies =
      candidates.length > 0
        ? candidates[Math.floor(Math.random() * candidates.length)]
        : speciesList[0];

    const usedNames = new Set(fishRef.current.map((f) => f.name));
    const baby = spawnBabyFish(rect.width, rect.height, pickedSpecies, usedNames);

    ripplesRef.current.push({
      x: baby.x,
      y: baby.y,
      r: 8,
      opacity: 0.8,
    });
    aquascapeAudio.playBubblePop();

    fishRef.current.push(baby);
    setFishCount(fishRef.current.length);

    if (onRegenerate) {
      onRegenerate(1);
    }
  }, [settings.activeSpecies, onRegenerate]);

  const syncCommunalFish = useCallback(
    (communalList: Array<{ id?: string | number; name: string; species: FishSpeciesType }>) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const w = rect.width > 0 ? rect.width : 800;
      const h = rect.height > 0 ? rect.height : 500;

      fishRef.current = applyCommunalFishesToSchool(fishRef.current, communalList, w, h);
      tagLegendary(fishRef.current);
      setFishCount(fishRef.current.length);
      aquascapeEvents.notifyFishRosterChanged();
    },
    []
  );

  const spawnFish = useCallback(
    (species: FishSpeciesType, name?: string) => {
      if (!containerRef.current) return undefined;
      const rect = containerRef.current.getBoundingClientRect();
      const w = rect.width > 0 ? rect.width : 800;
      const h = rect.height > 0 ? rect.height : 500;

      const usedNames = new Set(fishRef.current.map((f) => f.name));
      const finalName = name || getFishName(species, usedNames);

      const newFish = createSingleFish(
        species,
        Date.now() + Math.floor(Math.random() * 1000),
        w,
        h,
        usedNames,
        finalName,
        true
      );

      ripplesRef.current.push({
        x: newFish.x,
        y: 15,
        r: 10,
        opacity: 0.9,
      });
      aquascapeAudio.playBubblePop();

      fishRef.current.push(newFish);
      tagLegendary(fishRef.current);
      setFishCount(fishRef.current.length);
      aquascapeEvents.notifyFishRosterChanged();
      return newFish;
    },
    []
  );

  const highlightFish = useCallback(
    (name: string, opts: { hover?: boolean; focus?: boolean }) => {
      const target = normalizeName(name);
      fishRef.current.forEach((f) => {
        if (normalizeName(f.name) === target) {
          if (opts.hover) f.hovered = true;
          if (opts.focus) f.highlightUntil = Date.now() + 4000;
        }
      });
    },
    []
  );

  const clearFishHighlight = useCallback((name?: string) => {
    const target = name ? normalizeName(name) : null;
    fishRef.current.forEach((f) => {
      if (target === null || normalizeName(f.name) === target) {
        f.hovered = false;
      }
    });
  }, []);

  const tagLegendary = useCallback((list: FishParticle[]) => {
    const names = getLegendaryNames();
    list.forEach((f) => {
      f.isLegendary = f.isCommunal === true && names.has(normalizeName(f.name));
    });
  }, []);

  // Ghost koi is active only in the full Zen canvas, in Supabase mode, while no
  // legend has been born yet today. Recompute on mount and on legendary updates.
  useEffect(() => {
    const recompute = () => {
      ghostActiveRef.current =
        !isHeroOnly && isSupabaseModeActive() && shouldTeaseLegend(getTodayLegendaryList());
      if (!ghostActiveRef.current) ghostRef.current = null;
    };
    recompute();
    const unsub = aquascapeEvents.onLegendaryUpdated(recompute);
    return unsub;
  }, [isHeroOnly]);

  const canvasIdRef = useRef<string>(isHeroOnly ? 'hero' : `zen-${Math.random()}`);

  // Register with aquascapeEvents provider
  useEffect(() => {
    const unregister = aquascapeEvents.registerProvider(canvasIdRef.current, {
      dropFood: (x, y) => dropFood(x, y),
      spawnBaby: () => spawnBaby(),
      getFishList: () => fishRef.current,
      renameFish: (id, newName) => {
        const target = fishRef.current.find((f) => f.id === id);
        if (target) {
          target.name = newName;
        }
      },
      syncCommunalFish: (fishes) => syncCommunalFish(fishes),
      spawnFish: (species, name) => spawnFish(species, name),
      highlightFish: (name, opts) => highlightFish(name, opts),
      clearFishHighlight: (name) => clearFishHighlight(name),
      getCanvasSize: () => {
        const rect = containerRef.current?.getBoundingClientRect();
        return {
          width: rect && rect.width > 0 ? rect.width : 800,
          height: rect && rect.height > 0 ? rect.height : 500,
        };
      },
    });

    return () => {
      unregister();
    };
  }, [dropFood, spawnBaby, syncCommunalFish, spawnFish, highlightFish, clearFishHighlight]);

  // Re-apply catalog names when asynchronously loaded
  useEffect(() => {
    const unsubscribe = aquascapeEvents.onCatalogLoaded(() => {
      const usedNames = new Set(
        fishRef.current.filter((f) => f.isCommunal).map((f) => f.name)
      );
      fishRef.current.forEach((f) => {
        if (!f.isCommunal) {
          f.name = getFishName(f.type, usedNames);
        }
      });
      aquascapeEvents.notifyFishRosterChanged();
    });
    return () => unsubscribe();
  }, []);

  // Re-tag legendary fish whenever the winner set changes.
  useEffect(() => {
    const unsub = aquascapeEvents.onLegendaryUpdated(() => {
      tagLegendary(fishRef.current);
      aquascapeEvents.notifyFishRosterChanged();
    });
    return () => unsub();
  }, [tagLegendary]);

  // Dynamically synchronize fish population when density or active species change
  useEffect(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const w = rect.width > 0 ? rect.width : 800;
    const h = rect.height > 0 ? rect.height : 500;

    // When this canvas has no fish yet (e.g. Zen modal just mounted), adopt the
    // LIVE fish objects from any existing canvas so accumulated per-fish state
    // (kuaci eaten, growth stage, hunger, age) carries over instead of resetting.
    if (fishRef.current.length === 0) {
      const existingLive = aquascapeEvents.getExistingFishList();
      if (existingLive && existingLive.length > 0) {
        fishRef.current = existingLive.map((f) => ({
          ...f,
          x: Math.min(Math.max(20, (f.x / 800) * w), w - 20),
          y: Math.min(Math.max(20, (f.y / 500) * h), h - 20),
        }));
      }
    }

    const defaultDensity = 11;
    const targetDensity = settings.fishDensity || defaultDensity;
    const activeSpecies: FishSpeciesType[] =
      settings.activeSpecies && settings.activeSpecies.length > 0
        ? settings.activeSpecies
        : ([
            'mascot',
            'angelfish',
            'cherryShrimp',
            'rasbora',
            'guppy',
            'neonTetra',
            'shark',
            'whale',
            'dolphin',
            'mantaRay',
            'pufferfish',
            'orca',
            'turtle',
          ] as FishSpeciesType[]);

    fishRef.current = syncFishSchool(
      fishRef.current,
      targetDensity,
      activeSpecies,
      w,
      h,
      isSupabaseModeActive()
    );
    tagLegendary(fishRef.current);
    setFishCount(fishRef.current.length);
    aquascapeEvents.notifyFishRosterChanged();
  }, [settings.fishDensity, settings.activeSpecies]);

  // Main Canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Start loading the logo-based mascot sprite (chroma-keyed, cropped).
    ensureMascotSprite();

    let animationFrameId: number;
    let lastTime = performance.now();

    // Handle Resize with DevicePixelRatio for crisp visuals
    const handleResize = () => {
      if (!containerRef.current || !canvas) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      ctx.scale(dpr, dpr);
      initAquascape(rect.width, rect.height);
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Animation Loop
    const render = (currentTime: number) => {
      const rawDt = (currentTime - lastTime) / 1000;
      const dt = Math.max(0, Math.min(rawDt, 0.1));
      lastTime = currentTime;
      const timeSec = currentTime * 0.001;

      if (!containerRef.current) return;
      const currentSettings = settingsRef.current;
      if (isHeroOnly && currentSettings.zenMode) {
        // Pause Hero animation frame loop while Zen Mode is active to eliminate dual canvas load
        animationFrameId = requestAnimationFrame(render);
        return;
      }
      const rect = containerRef.current.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      // Current water flow multiplier
      const flowMultiplier =
        currentSettings.waterFlow === 'calm' ? 0.6 : currentSettings.waterFlow === 'lively' ? 1.6 : 1.0;

      // -------------------------------------------------------------
      // 1. Draw Underwater Backdrop & Lighting Modes
      // -------------------------------------------------------------
      // Resolve 'auto' to a concrete mode based on the real local time of day.
      const lighting = resolveLighting(currentSettings.lighting);
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      if (lighting === 'daylight') {
        // Natural ADA Style planted aquarium daylight
        bgGrad.addColorStop(0, '#0a233a');
        bgGrad.addColorStop(0.35, '#0d3246');
        bgGrad.addColorStop(0.75, '#0b2633');
        bgGrad.addColorStop(1, '#06131c');
      } else if (lighting === 'moonlight') {
        // Deep bioluminescent twilight moonlight
        bgGrad.addColorStop(0, '#040b17');
        bgGrad.addColorStop(0.4, '#07162b');
        bgGrad.addColorStop(0.8, '#061a33');
        bgGrad.addColorStop(1, '#020914');
      } else {
        // Golden hour / Warm tropical rays
        bgGrad.addColorStop(0, '#1c2833');
        bgGrad.addColorStop(0.3, '#1a3338');
        bgGrad.addColorStop(0.7, '#132e2c');
        bgGrad.addColorStop(1, '#091a18');
      }

      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // -------------------------------------------------------------
      // 2. Animated Caustics & Sun Rays (God Rays)
      // -------------------------------------------------------------
      ctx.save();
      const rayCount = 5;
      for (let i = 0; i < rayCount; i++) {
        const rayOffset = (i / rayCount) * w + Math.sin(timeSec * 0.6 + i * 1.5) * 40;
        const rayWidth = 60 + Math.sin(timeSec * 0.8 + i) * 20;

        const rayGrad = ctx.createLinearGradient(rayOffset, 0, rayOffset + 40, h);
        const rayColor =
          lighting === 'daylight'
            ? 'rgba(56, 189, 176, '
            : lighting === 'moonlight'
            ? 'rgba(96, 165, 250, '
            : 'rgba(251, 191, 36, ';

        rayGrad.addColorStop(0, `${rayColor}0.14)`);
        rayGrad.addColorStop(0.6, `${rayColor}0.05)`);
        rayGrad.addColorStop(1, `${rayColor}0)`);

        ctx.fillStyle = rayGrad;
        ctx.beginPath();
        ctx.moveTo(rayOffset - rayWidth * 0.3, 0);
        ctx.lineTo(rayOffset + rayWidth * 0.3, 0);
        ctx.lineTo(rayOffset + rayWidth * 1.2 + 80, h);
        ctx.lineTo(rayOffset - rayWidth * 0.8 + 80, h);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // -------------------------------------------------------------
      // 3. Aquascape Hardscape: Dragon Stone / Driftwood Silhouettes
      // -------------------------------------------------------------
      ctx.save();
      // Substrate bottom layer (ADA Amazonia soil)
      const soilGrad = ctx.createLinearGradient(0, h - 35, 0, h);
      soilGrad.addColorStop(0, '#111b24');
      soilGrad.addColorStop(1, '#060a0f');
      ctx.fillStyle = soilGrad;
      ctx.beginPath();
      ctx.moveTo(0, h - 30);
      // Gentle wavy substrate terrain
      ctx.bezierCurveTo(w * 0.25, h - 40, w * 0.45, h - 22, w * 0.7, h - 35);
      ctx.bezierCurveTo(w * 0.85, h - 42, w * 0.95, h - 28, w, h - 32);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // Dragon Stone & Seiryu Stone formations
      ctx.fillStyle = '#182836';
      // Left stone group
      ctx.beginPath();
      ctx.moveTo(w * 0.12, h - 30);
      ctx.lineTo(w * 0.15, h - 90);
      ctx.lineTo(w * 0.19, h - 110);
      ctx.lineTo(w * 0.24, h - 70);
      ctx.lineTo(w * 0.27, h - 32);
      ctx.closePath();
      ctx.fill();

      // Center-Right Driftwood root arch
      ctx.strokeStyle = '#1e2428';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(w * 0.42, h - 30);
      ctx.quadraticCurveTo(w * 0.52, h - 130, w * 0.65, h - 60);
      ctx.stroke();

      // Smaller branch
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h - 115);
      ctx.quadraticCurveTo(w * 0.56, h - 150, w * 0.59, h - 140);
      ctx.stroke();

      // Moss patch on driftwood
      ctx.fillStyle = '#2d6a4f';
      ctx.beginPath();
      ctx.arc(w * 0.51, h - 116, 12, 0, Math.PI * 2);
      ctx.arc(w * 0.54, h - 122, 10, 0, Math.PI * 2);
      ctx.arc(w * 0.48, h - 105, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // -------------------------------------------------------------
      // 4. Draw & Sway Aquatic Plants (Flora)
      // -------------------------------------------------------------
      if (currentSettings.showFlora) {
        ctx.save();
        plantsRef.current.forEach((plant) => {
          const segHeight = plant.height / plant.segments;
          ctx.beginPath();
          ctx.moveTo(plant.baseX, plant.baseY);

          let currentX = plant.baseX;
          let currentY = plant.baseY;

          // Compute stem sway using chained sine curves
          for (let s = 1; s <= plant.segments; s++) {
            const progress = s / plant.segments;
            const sway =
              Math.sin(timeSec * plant.speed * flowMultiplier + plant.phase + s * 0.3) *
              (progress * progress * 24 * flowMultiplier);

            currentX = plant.baseX + sway;
            currentY = plant.baseY - s * segHeight;

            // Draw individual leaf flourishes for rotala or broad leaves
            if (plant.leafType === 'rotala' && s % 2 === 0) {
              ctx.save();
              ctx.fillStyle = plant.color;
              ctx.beginPath();
              ctx.ellipse(currentX - 5, currentY, 6, 2.5, Math.PI / 4, 0, Math.PI * 2);
              ctx.ellipse(currentX + 5, currentY, 6, 2.5, -Math.PI / 4, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            } else if (plant.leafType === 'broad' && s === Math.floor(plant.segments * 0.7)) {
              ctx.save();
              ctx.fillStyle = plant.color;
              ctx.beginPath();
              ctx.ellipse(currentX, currentY, 14, 28, Math.PI / 12, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }

            ctx.lineTo(currentX, currentY);
          }

          ctx.strokeStyle = plant.color;
          ctx.lineWidth = plant.stemWidth;
          ctx.lineCap = 'round';
          ctx.stroke();
        });
        ctx.restore();
      }

      // -------------------------------------------------------------
      // 5. CO2 Diffuser & Micro-Pearling Bubbles
      // -------------------------------------------------------------
      // Diffuser bell at bottom right
      const diffuserX = w * 0.88;
      const diffuserY = h - 50;

      ctx.save();
      // Glass diffuser stem
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(diffuserX, h);
      ctx.lineTo(diffuserX, diffuserY + 12);
      ctx.stroke();

      // Ceramic disc
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.beginPath();
      ctx.ellipse(diffuserX, diffuserY + 12, 11, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glass cup
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillStyle = 'rgba(56, 189, 176, 0.15)';
      ctx.beginPath();
      ctx.arc(diffuserX, diffuserY + 6, 12, 0, Math.PI);
      ctx.stroke();
      ctx.fill();
      ctx.restore();

      // Emit continuous fine CO2 mist if active
      if (currentSettings.co2Active && Math.random() < 0.65) {
        bubblesRef.current.push({
          x: diffuserX + (Math.random() * 12 - 6),
          y: diffuserY + 8,
          radius: 0.8 + Math.random() * 1.5,
          speed: (1.2 + Math.random() * 1.5) * flowMultiplier,
          wobbleSpeed: 2 + Math.random() * 3,
          wobbleDist: 0.5 + Math.random() * 1.2,
          phase: Math.random() * Math.PI * 2,
          opacity: 0.5 + Math.random() * 0.4,
          isCo2: true,
        });
      }

      // Occasional natural plant pearling (Oxygen bubble from leaf)
      if (Math.random() < 0.08) {
        const randomPlant = plantsRef.current[Math.floor(Math.random() * plantsRef.current.length)];
        if (randomPlant) {
          bubblesRef.current.push({
            x: randomPlant.baseX + (Math.random() * 20 - 10),
            y: randomPlant.baseY - randomPlant.height * 0.6,
            radius: 1.2 + Math.random() * 2.2,
            speed: 0.8 + Math.random() * 1.0,
            wobbleSpeed: 1.5,
            wobbleDist: 1.0,
            phase: Math.random() * Math.PI * 2,
            opacity: 0.6,
            isCo2: false,
          });
        }
      }

      // Update and Draw Bubbles
      ctx.save();
      for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
        const b = bubblesRef.current[i];
        b.y -= b.speed;
        b.phase += b.wobbleSpeed * dt;
        const currentX = b.x + Math.sin(b.phase) * b.wobbleDist;

        // Draw bubble
        ctx.fillStyle = `rgba(180, 240, 255, ${b.opacity})`;
        ctx.beginPath();
        ctx.arc(currentX, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();

        // Highlight shine on bubble
        if (b.radius > 2) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.beginPath();
          ctx.arc(currentX - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.28, 0, Math.PI * 2);
          ctx.fill();
        }

        // Pop at water surface
        if (b.y <= 18) {
          if (b.radius > 2.5) {
            ripplesRef.current.push({
              x: currentX,
              y: 18,
              r: 2,
              opacity: 0.6,
            });
            aquascapeAudio.playBubblePop();
          }
          bubblesRef.current.splice(i, 1);
        }
      }
      ctx.restore();

      // -------------------------------------------------------------
      // 6. Kuaci (Sunflower Seeds) Sinking & Physics Logic
      // -------------------------------------------------------------
      ctx.save();
      for (let i = foodRef.current.length - 1; i >= 0; i--) {
        const flake = foodRef.current[i];
        flake.y += flake.vy * dt * 45;
        flake.x += Math.sin(timeSec * 2.5 + flake.id * 8) * 0.35 + flake.vx;
        flake.angle += flake.vRot * dt;

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

        // Bersihkan jika sudah dimakan ikan atau menyentuh substrat dasar
        if (flake.eaten || flake.y > h - 35) {
          foodRef.current.splice(i, 1);
        }
      }
      if (foodRef.current.length === 0 && foodCount > 0) {
        setFoodCount(0);
      }
      ctx.restore();

      // -------------------------------------------------------------
      // 7. Living Fish Simulation & Mascot Rendering
      // -------------------------------------------------------------
      // In Supabase mode the population is authoritative from the database, so the
      // natural birth/death life cycle is disabled: a "reborn" fish would otherwise
      // be recreated with a local fish-names.json name, corrupting the roster.
      const enableLifeCycle = isSupabaseModeActive()
        ? false
        : currentSettings.enableLifeCycle ?? true;
      const usedNames = new Set(fishRef.current.map((f) => f.name));

      for (let i = fishRef.current.length - 1; i >= 0; i--) {
        const fish = fishRef.current[i];

        // 7a. Natural Life Cycle & Aging Evolution
        const { rebornNeeded } = updateFishLifeCycle(fish, dt, { enableLifeCycle });
        if (rebornNeeded) {
          // Fish life ended naturally; spawn baby replacement
          const baby = spawnBabyFish(w, h, fish.type, usedNames);
          fishRef.current[i] = baby;
          ripplesRef.current.push({
            x: baby.x,
            y: baby.y,
            r: 8,
            opacity: 0.8,
          });
          if (onRegenerate) {
            onRegenerate(1);
          }
          continue;
        }

        // Dynamically compute size based on current life cycle stage
        fish.size = fish.baseSize * getFishStageScale(fish.stage);

        // Nearest food search if hungry
        let targetFood: FoodParticle | null = null;
        if (foodRef.current.length > 0) {
          let minDist = 300;
          foodRef.current.forEach((flake) => {
            const d = Math.hypot(flake.x - fish.x, flake.y - fish.y);
            if (d < minDist) {
              minDist = d;
              targetFood = flake;
            }
          });
        }

        // Fish steering & behavior
        if (targetFood) {
          const dx = (targetFood as FoodParticle).x - fish.x;
          const dy = (targetFood as FoodParticle).y - fish.y;
          const dist = Math.hypot(dx, dy);

          // Shrimp normally sink, so they need a stronger pull to climb up and
          // reach food anywhere in the tank.
          const chase = fish.type === 'cherryShrimp' ? 0.28 : 0.15;
          fish.vx += (dx / dist) * chase;
          fish.vy += (dy / dist) * chase;

          // Eat food when close
          if (dist < fish.size * 0.6) {
            (targetFood as FoodParticle).eaten = true;
            const growth = feedFishKuaci(fish);
            if (fish.isCommunal && fish.name) {
              recordKuaciEaten(fish.name, 1);
            }
            if (growth.grew) {
              // Growth evolution ripple
              ripplesRef.current.push({
                x: fish.x,
                y: fish.y,
                r: 10,
                opacity: 0.85,
              });
            }
            // Little eating ripple
            ripplesRef.current.push({
              x: fish.x,
              y: fish.y,
              r: 3,
              opacity: 0.5,
            });
            aquascapeAudio.playBubblePop();
          }
        } else {
          // Ambient swimming cruise
          if (fish.type === 'mascot') {
            // Elegant slow glide
            fish.vx += (Math.random() - 0.5) * 0.05;
            fish.vy += (Math.random() - 0.5) * 0.04;

            // Repel slightly from cursor if active
            if (mouseRef.current.active) {
              const mdx = fish.x - mouseRef.current.x;
              const mdy = fish.y - mouseRef.current.y;
              const mDist = Math.hypot(mdx, mdy);
              if (mDist < 140 && mDist > 0) {
                fish.vx += (mdx / mDist) * 0.3;
                fish.vy += (mdy / mDist) * 0.2;
              }
            }
          } else if (fish.type === 'cherryShrimp') {
            // Crawl gently along the bottom, but SINK smoothly toward the floor
            // instead of being hard-pinned there — so after chasing food up, the
            // shrimp glides back down naturally rather than snapping to the bed.
            fish.vx += Math.sin(timeSec * 0.8 + fish.id) * 0.06 + (Math.random() - 0.5) * 0.04;
            const floorZone = h - 60; // preferred crawling band near the substrate
            if (fish.y < floorZone) {
              fish.vy += 0.05; // gentle, constant pull downward when above the floor
            } else {
              // Within the floor band: hover/creep with tiny vertical jitter.
              fish.vy += (Math.random() - 0.5) * 0.04;
              if (fish.y > h - 34) fish.vy -= 0.06; // don't burrow into the substrate
            }
          } else if (fish.type === 'angelfish') {
            // Majestic slow glide in mid-upper column
            fish.vx += (Math.random() - 0.5) * 0.04;
            fish.vy += (Math.random() - 0.5) * 0.03;
            if (fish.y > h * 0.65) fish.vy -= 0.06;
            if (fish.y < h * 0.15) fish.vy += 0.06;
          } else if (fish.type === 'guppy') {
            // Active surface/mid swimming
            fish.vx += (Math.random() - 0.5) * 0.08;
            fish.vy += (Math.random() - 0.5) * 0.07;
            if (fish.y > h * 0.55) fish.vy -= 0.07;
            if (fish.y < h * 0.12) fish.vy += 0.07;
          } else if (fish.type === 'whale') {
            // Majestic deep slow cruise in lower-mid column
            fish.vx += (Math.random() - 0.5) * 0.02;
            fish.vy += (Math.random() - 0.5) * 0.02;
            if (fish.y > h * 0.75) fish.vy -= 0.04;
            if (fish.y < h * 0.3) fish.vy += 0.04;
          } else if (fish.type === 'dolphin') {
            // Energetic undulating swim with vertical waves
            fish.vx += (Math.random() - 0.5) * 0.07;
            fish.vy = Math.sin(timeSec * 2.2 + fish.id) * 0.28;
            if (fish.y > h * 0.65) fish.vy -= 0.08;
            if (fish.y < h * 0.12) fish.vy += 0.08;
          } else if (fish.type === 'shark') {
            // Sleek powerful patrol cruise across mid tank
            fish.vx += (Math.random() - 0.5) * 0.06;
            fish.vy += (Math.random() - 0.5) * 0.04;
            if (fish.y > h * 0.7) fish.vy -= 0.05;
            if (fish.y < h * 0.2) fish.vy += 0.05;
          } else if (fish.type === 'mantaRay') {
            // Gentle wide gliding, banking turns
            fish.vx += (Math.random() - 0.5) * 0.03;
            fish.vy = Math.sin(timeSec * 1.2 + fish.id) * 0.2;
            if (fish.y > h * 0.7) fish.vy -= 0.05;
            if (fish.y < h * 0.25) fish.vy += 0.05;
          } else if (fish.type === 'pufferfish') {
            // Hovering, gentle fluttering, drifting curiously
            fish.vx += (Math.random() - 0.5) * 0.05;
            fish.vy += (Math.random() - 0.5) * 0.05;
            if (fish.y > h * 0.7) fish.vy -= 0.05;
            if (fish.y < h * 0.2) fish.vy += 0.05;
          } else {
            // Neon Tetra and Rasbora schooling behavior
            if (fish.y < h * 0.18) fish.vy += 0.06;
            if (fish.y > h * 0.8) fish.vy -= 0.06;
            fish.vx += (Math.random() - 0.5) * 0.1;
            fish.vy += (Math.random() - 0.5) * 0.08;
          }
        }

        // Clamp speed
        const speed = Math.hypot(fish.vx, fish.vy);
        let maxSpeed = 3.0;
        if (fish.type === 'whale') maxSpeed = 1.2;
        else if (fish.type === 'cherryShrimp') maxSpeed = 2.0;
        else if (fish.type === 'mantaRay') maxSpeed = 1.5;
        else if (fish.type === 'angelfish') maxSpeed = 1.6;
        else if (fish.type === 'pufferfish') maxSpeed = 1.8;
        else if (fish.type === 'mascot') maxSpeed = 2.2;
        else if (fish.type === 'shark') maxSpeed = 2.5;
        else if (fish.type === 'dolphin') maxSpeed = 2.8;
        else if (fish.type === 'marlin') maxSpeed = 3.4;
        else if (fish.type === 'anglerfish') maxSpeed = 1.3;
        else if (fish.type === 'lanternfish') maxSpeed = 2.2;
        else if (fish.type === 'viperfish') maxSpeed = 2.0;
        else if (fish.type === 'moray') maxSpeed = 1.4;
        else if (fish.type === 'electricEel') maxSpeed = 1.5;
        if (speed > maxSpeed) {
          fish.vx = (fish.vx / speed) * maxSpeed;
          fish.vy = (fish.vy / speed) * maxSpeed;
        }

        // Move fish
        fish.x += fish.vx * flowMultiplier;
        fish.y += fish.vy * flowMultiplier;

        // Boundary reflection with smooth turning proportional to fish size
        const marginX = Math.max(35, fish.size * 0.75);
        const marginY = Math.max(45, fish.size * 0.45);
        if (fish.x < marginX) {
          fish.vx = Math.abs(fish.vx) * 0.8 + 0.3;
        } else if (fish.x > w - marginX) {
          fish.vx = -Math.abs(fish.vx) * 0.8 - 0.3;
        }

        if (fish.y < marginY) {
          fish.vy = Math.abs(fish.vy) * 0.7 + 0.2;
        } else if (fish.y > h - marginY) {
          fish.vy = -Math.abs(fish.vy) * 0.7 - 0.2;
        }

        // Hard-clamp position inside the canvas so no fish (especially bottom-
        // crawling shrimp, or any fish spawned with a stale height) can drift
        // below/outside the viewport and become invisible. Leave headroom at the
        // bottom so the nametag drawn above the fish stays on-screen too.
        fish.x = Math.min(Math.max(fish.x, marginX), w - marginX);
        fish.y = Math.min(Math.max(fish.y, marginY), h - Math.max(marginY, fish.size + 22));

        // Compute swimming orientation (horizontal flip + pitch tilt)
        const { isFacingLeft, pitch } = getFishOrientation(fish.vx, fish.vy);
        fish.angle = isFacingLeft ? Math.PI - pitch : pitch;
        fish.tailPhase += fish.tailSpeed * (0.8 + speed * 0.8);

        // Legendary gold aura, sparkles, and a fading trail (behind the fish).
        if (fish.isLegendary) {
          let trail = legendaryTrailRef.current.get(fish.id);
          if (!trail) { trail = []; legendaryTrailRef.current.set(fish.id, trail); }
          trail.push({ x: fish.x, y: fish.y });
          if (trail.length > 14) trail.shift();
          for (let ti = 0; ti < trail.length; ti++) {
            const p = trail[ti];
            ctx.fillStyle = `rgba(255, 215, 0, ${(ti / trail.length) * 0.4})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2 + (ti / trail.length) * 3, 0, Math.PI * 2);
            ctx.fill();
          }
          const glowR = Math.max(34, fish.size * 1.9) * (0.9 + Math.sin(timeSec * 3) * 0.1);
          const gg = ctx.createRadialGradient(fish.x, fish.y, 0, fish.x, fish.y, glowR);
          gg.addColorStop(0, 'rgba(255, 215, 0, 0.5)');
          gg.addColorStop(0.5, 'rgba(245, 197, 66, 0.22)');
          gg.addColorStop(1, 'rgba(245, 197, 66, 0)');
          ctx.save();
          ctx.fillStyle = gg;
          ctx.beginPath();
          ctx.arc(fish.x, fish.y, glowR, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          for (let k = 0; k < 5; k++) {
            const ang = (k / 5) * Math.PI * 2 + timeSec * 0.8;
            const rad = fish.size * (1.1 + 0.25 * Math.sin(timeSec * 2 + k));
            const tw = 0.5 + 0.5 * Math.sin(timeSec * 5 + k * 1.7);
            ctx.fillStyle = `rgba(255, 243, 176, ${tw})`;
            ctx.beginPath();
            ctx.arc(fish.x + Math.cos(ang) * rad, fish.y + Math.sin(ang) * rad, 1.6 * tw + 0.6, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (legendaryTrailRef.current.has(fish.id)) {
          legendaryTrailRef.current.delete(fish.id);
        }

        // Highlight glow (hover) / spotlight (click, time-decayed) drawn behind fish.
        const isFocus = fish.highlightUntil !== undefined && fish.highlightUntil > Date.now();
        const isHighlight = fish.hovered === true || isFocus;
        if (isHighlight) {
          const glowR = Math.max(26, fish.size * 1.4);
          const g = ctx.createRadialGradient(fish.x, fish.y, 0, fish.x, fish.y, glowR);
          const strength = isFocus ? 0.55 : 0.32;
          g.addColorStop(0, `rgba(45, 212, 191, ${strength})`);
          g.addColorStop(1, 'rgba(45, 212, 191, 0)');
          ctx.save();
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(fish.x, fish.y, glowR, 0, Math.PI * 2);
          ctx.fill();
          if (isFocus) {
            // Pulsing ring marker around the focused fish.
            const pulse = glowR * (0.7 + Math.sin(timeSec * 6) * 0.12);
            ctx.strokeStyle = 'rgba(94, 234, 212, 0.9)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(fish.x, fish.y, pulse, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.restore();
        }

        // ---------------------------------------------------------
        // RENDER FISH GRAPHICS
        // ---------------------------------------------------------
        ctx.save();
        if (fish.fadeOpacity !== undefined) {
          ctx.globalAlpha = Math.max(0, Math.min(1, fish.fadeOpacity));
        }
        ctx.translate(fish.x, fish.y);
        if (isFacingLeft) {
          ctx.scale(-1, 1);
        }
        ctx.rotate(pitch);

        // Tail wag sinusoidal calculation
        const tailWag = Math.sin(fish.tailPhase) * 0.28;

        if (fish.isLegendary) {
          // --- LEGENDARY GOLD KOI (overrides the participant's normal species) ---
          const L = fish.size * 1.15;
          const Hh = L * 0.42;
          ctx.save();
          ctx.translate(-L * 0.42, 0);
          ctx.rotate(tailWag * 1.2);
          ctx.fillStyle = 'rgba(255, 215, 0, 0.85)';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(-L * 0.35, -Hh * 0.9, -L * 0.55, -Hh * 0.5);
          ctx.quadraticCurveTo(-L * 0.4, 0, -L * 0.55, Hh * 0.5);
          ctx.quadraticCurveTo(-L * 0.35, Hh * 0.9, 0, 0);
          ctx.fill();
          ctx.restore();
          const bg = ctx.createLinearGradient(0, -Hh, 0, Hh);
          bg.addColorStop(0, '#fff3b0');
          bg.addColorStop(0.5, '#f5c542');
          bg.addColorStop(1, '#b8860b');
          ctx.fillStyle = bg;
          ctx.beginPath();
          ctx.ellipse(0, 0, L * 0.5, Hh, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
          ctx.beginPath();
          ctx.moveTo(L * 0.05, -Hh);
          ctx.quadraticCurveTo(-L * 0.1, -Hh * 1.8, -L * 0.25, -Hh * 0.9);
          ctx.lineTo(-L * 0.1, -Hh * 0.7);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(L * 0.05, Hh);
          ctx.quadraticCurveTo(-L * 0.1, Hh * 1.8, -L * 0.25, Hh * 0.9);
          ctx.lineTo(-L * 0.1, Hh * 0.7);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.beginPath();
          ctx.ellipse(L * 0.1, -Hh * 0.2, L * 0.12, Hh * 0.35, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255, 140, 0, 0.35)';
          ctx.beginPath();
          ctx.ellipse(-L * 0.12, Hh * 0.15, L * 0.1, Hh * 0.3, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#3a2a00';
          ctx.beginPath();
          ctx.arc(L * 0.32, -Hh * 0.15, Math.max(1.5, L * 0.045), 0, Math.PI * 2);
          ctx.fill();
        } else if (fish.type === 'mascot') {
          const sprite = getMascotSprite();
          const parts = getMascotParts();
          if (parts) {
            // --- LOGO MASCOT with an independently FLAPPING TAIL ---
            // Body stays as the logo; the tail piece rotates at its joint so the
            // fish actually swishes like a real fish. Sprite faces +X; the outer
            // flip handles leftward swimming.
            const drawH = fish.size * 1.15;
            const drawW = drawH * (parts.width / parts.height);
            const s = drawW / parts.width; // sprite px -> world px scale
            const t = timeSec * 4 + fish.id;

            // Gentle whole-body life: bob + slight bank on vertical turns.
            const bob = Math.sin(t) * (fish.size * 0.06);
            const bank = Math.max(-0.22, Math.min(0.22, fish.vy * 0.12));
            ctx.translate(0, bob);
            ctx.rotate(bank);
            ctx.imageSmoothingEnabled = true;

            // Origin currently at the fish center; sprite's own center is (w/2,h/2).
            // Draw offset so the sprite is centered.
            const ox = -parts.width * 0.5 * s;
            const oy = -parts.height * 0.5 * s;

            // Tail: rotate around the joint (splitX, vertical middle).
            const jointX = ox + parts.splitX * s;
            const jointY = oy + parts.height * 0.5 * s;
            const wag = Math.sin(t) * 0.22; // radians — lively but no joint gap
            ctx.save();
            ctx.translate(jointX, jointY);
            ctx.rotate(wag);
            ctx.translate(-jointX, -jointY);
            ctx.drawImage(parts.tail, ox, oy, parts.width * s, parts.height * s);
            ctx.restore();

            // Body on top (static, the recognizable logo).
            ctx.drawImage(parts.body, ox, oy, parts.width * s, parts.height * s);
          } else if (sprite) {
            // Fallback: whole sprite with light procedural motion (before split ready).
            const baseH = fish.size * 1.15;
            const baseW = baseH * getMascotAspect();
            const t = timeSec * 3.2 + fish.id;
            ctx.translate(0, Math.sin(t) * (fish.size * 0.1));
            ctx.rotate(Math.sin(t) * 0.12);
            ctx.imageSmoothingEnabled = true;
            ctx.drawImage(sprite, -baseW / 2, -baseH / 2, baseW, baseH);
          } else {
          // --- AQUASCAPE MASCOT ORIGAMI FISH (fallback until sprite loads) ---
          // Faceted origami fish facing +X: a sharp diamond head with an eye, a
          // two-facet gradient body, and a pointed V-notch tail. All edges are
          // straight and pointed like folded paper — no rounded fins.
          const scale = fish.size / 44;
          ctx.scale(scale, scale);

          // Body top facet (lighter) — sharp diamond from mid-body to head base.
          ctx.fillStyle = '#2f6d92';
          ctx.beginPath();
          ctx.moveTo(14, -14); // top, near head
          ctx.lineTo(-14, 0);  // left mid (body/tail seam)
          ctx.lineTo(14, 0);   // center-right seam
          ctx.closePath();
          ctx.fill();

          // Body bottom facet (darker).
          ctx.fillStyle = '#1c4a6b';
          ctx.beginPath();
          ctx.moveTo(14, 14);  // bottom, near head
          ctx.lineTo(-14, 0);  // left mid
          ctx.lineTo(14, 0);   // center-right seam
          ctx.closePath();
          ctx.fill();

          // Head — dark navy diamond with a sharp nose tip at the right.
          ctx.fillStyle = '#0d2438';
          ctx.beginPath();
          ctx.moveTo(38, 0);   // sharp nose tip
          ctx.lineTo(14, -14); // top
          ctx.lineTo(14, 14);  // bottom
          ctx.closePath();
          ctx.fill();

          // Eye — round navy socket with a bright cyan pupil (as in the logo).
          ctx.fillStyle = '#0a1a2c';
          ctx.beginPath();
          ctx.arc(22, 0, 4.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#7fe4ef';
          ctx.beginPath();
          ctx.arc(22.5, -0.5, 1.8, 0, Math.PI * 2);
          ctx.fill();

          // Tail — pointed V notch made of two bright cyan triangles, wagging.
          ctx.save();
          ctx.translate(-14, 0);
          ctx.rotate(tailWag);
          // upper tail blade
          ctx.fillStyle = '#8fdff0';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-22, -16);
          ctx.lineTo(-8, 0);
          ctx.closePath();
          ctx.fill();
          // lower tail blade (slightly darker for the fold)
          ctx.fillStyle = '#63c7dd';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-22, 16);
          ctx.lineTo(-8, 0);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          } // end sprite/path fallback
        } else if (fish.type === 'cherryShrimp') {
          // --- CHERRY SHRIMP ---
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          // Curved shrimp body
          ctx.ellipse(0, 0, 9, 3.5, -Math.PI / 8, 0, Math.PI * 2);
          ctx.fill();

          // Antennae
          ctx.strokeStyle = 'rgba(255, 200, 200, 0.7)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(8, -1);
          ctx.quadraticCurveTo(15, -6, 22, -8);
          ctx.stroke();

          // Little swimmeret legs
          ctx.strokeStyle = '#dc2626';
          ctx.beginPath();
          ctx.moveTo(-2, 3);
          ctx.lineTo(-4, 6);
          ctx.moveTo(2, 3);
          ctx.lineTo(0, 6);
          ctx.stroke();
        } else if (fish.type === 'angelfish') {
          // --- ANGELFISH (MANFISH) ---
          drawAngelfish(ctx, fish, tailWag);
        } else if (fish.type === 'rasbora') {
          // --- HARLEQUIN RASBORA ---
          drawRasbora(ctx, fish, tailWag);
        } else if (fish.type === 'guppy') {
          // --- FANCY GUPPY ---
          drawGuppy(ctx, fish, tailWag, timeSec);
        } else if (fish.type === 'shark') {
          // --- HIU (SHARK) ---
          drawShark(ctx, fish, tailWag);
        } else if (fish.type === 'whale') {
          // --- PAUS (WHALE) ---
          drawWhale(ctx, fish, tailWag);
        } else if (fish.type === 'dolphin') {
          // --- LUMBA-LUMBA (DOLPHIN) ---
          drawDolphin(ctx, fish, tailWag);
        } else if (fish.type === 'mantaRay') {
          // --- PARI (MANTA RAY) ---
          drawMantaRay(ctx, fish, tailWag);
        } else if (fish.type === 'pufferfish') {
          // --- BUNTAL (PUFFERFISH) ---
          drawPufferfish(ctx, fish, tailWag, timeSec);
        } else if (fish.type === 'orca') {
          // --- PAUS ORCA ---
          drawOrca(ctx, fish, tailWag, timeSec);
        } else if (fish.type === 'turtle') {
          // --- PENYU LAUT ---
          drawTurtle(ctx, fish, tailWag, timeSec);
        } else if (fish.type === 'marlin') {
          drawMarlin(ctx, fish, tailWag);
        } else if (fish.type === 'anglerfish') {
          drawAnglerfish(ctx, fish, tailWag);
        } else if (fish.type === 'lanternfish') {
          drawLanternfish(ctx, fish, tailWag);
        } else if (fish.type === 'viperfish') {
          drawViperfish(ctx, fish, tailWag);
        } else if (fish.type === 'moray') {
          drawMoray(ctx, fish, tailWag);
        } else if (fish.type === 'electricEel') {
          drawElectricEel(ctx, fish, tailWag);
        } else {
          // --- NEON / CARDINAL TETRA ---
          const len = Math.max(1, Math.abs(fish.size));
          const hgt = Math.max(1, Math.abs(fish.size) * 0.34);

          // Upper dark olive-blue spine
          ctx.fillStyle = '#0f293b';
          ctx.beginPath();
          ctx.ellipse(0, 0, Math.max(0.1, len * 0.5), Math.max(0.1, hgt), 0, 0, Math.PI * 2);
          ctx.fill();

          // Iconic Glowing Neon Cyan Stripe
          ctx.strokeStyle = '#00f7ff';
          ctx.lineWidth = 2.2;
          ctx.shadowColor = '#00f7ff';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.moveTo(len * 0.35, -hgt * 0.1);
          ctx.lineTo(-len * 0.15, -hgt * 0.1);
          ctx.stroke();
          ctx.shadowBlur = 0; // reset

          // Radiant Red Tail Section
          ctx.fillStyle = '#ff2b4f';
          ctx.beginPath();
          ctx.moveTo(-len * 0.1, 0);
          ctx.lineTo(-len * 0.45, 0);
          ctx.lineTo(-len * 0.25, hgt * 0.8);
          ctx.closePath();
          ctx.fill();

          // Little fish eye
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(len * 0.3, -1, 1.4, 0, Math.PI * 2);
          ctx.fill();

          // Translucent caudal tail with wag
          ctx.save();
          ctx.translate(-len * 0.45, 0);
          ctx.rotate(tailWag * 1.4);
          ctx.fillStyle = 'rgba(255, 120, 140, 0.65)';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-len * 0.4, -hgt * 0.8);
          ctx.lineTo(-len * 0.3, 0);
          ctx.lineTo(-len * 0.4, hgt * 0.8);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        ctx.restore();

        // 7b. Interactive Nametag on Hover / Always On
        const distToMouse = Math.hypot(fish.x - mouseRef.current.x, fish.y - mouseRef.current.y);
        const isHovered = mouseRef.current.active && distToMouse < Math.max(38, fish.size * 1.5);
        if (currentSettings.showNametags || isHovered || isHighlight || (fish.isLegendary && !cleanModeRef.current)) {
          const streakInfo = fish.isCommunal ? getStreakFor(fish.name) : undefined;
          drawFishNametag(ctx, fish, isHovered || isHighlight, streakInfo);
        }
      }

      // -------------------------------------------------------------
      // 7c. Ghost "Legend?" koi — swims separately from fishRef so it is never
      //     counted, clickable, or made legendary. Drawn dim/translucent as a
      //     hint that today's legend has not been born yet.
      // -------------------------------------------------------------
      if (ghostActiveRef.current && !cleanModeRef.current) {
        if (!ghostRef.current) ghostRef.current = createGhostKoi(w, h);
        const gk = ghostRef.current;
        updateGhostKoi(gk, dt, w, h);

        const facingLeft = gk.vx < 0;
        const tailWag = Math.sin(gk.tailPhase) * 0.28;

        ctx.save();
        ctx.globalAlpha = 0.5; // ghostly translucency
        ctx.translate(gk.x, gk.y);
        if (facingLeft) ctx.scale(-1, 1);

        const L = gk.size * 1.15;
        const Hh = L * 0.42;

        // Soft golden glow
        const glowR = Math.max(30, gk.size * 1.6);
        const gg = ctx.createRadialGradient(0, 0, 0, 0, 0, glowR);
        gg.addColorStop(0, 'rgba(255, 215, 0, 0.28)');
        gg.addColorStop(1, 'rgba(245, 197, 66, 0)');
        ctx.fillStyle = gg;
        ctx.beginPath();
        ctx.arc(0, 0, glowR, 0, Math.PI * 2);
        ctx.fill();

        // Tail (fan, wagging)
        ctx.save();
        ctx.translate(-L * 0.42, 0);
        ctx.rotate(tailWag * 1.2);
        ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-L * 0.35, -Hh * 0.9, -L * 0.55, -Hh * 0.5);
        ctx.quadraticCurveTo(-L * 0.4, 0, -L * 0.55, Hh * 0.5);
        ctx.quadraticCurveTo(-L * 0.35, Hh * 0.9, 0, 0);
        ctx.fill();
        ctx.restore();

        // Body (translucent gold ellipse)
        const bg = ctx.createLinearGradient(0, -Hh, 0, Hh);
        bg.addColorStop(0, 'rgba(255, 243, 176, 0.45)');
        bg.addColorStop(0.5, 'rgba(245, 197, 66, 0.4)');
        bg.addColorStop(1, 'rgba(184, 134, 11, 0.4)');
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.ellipse(0, 0, L * 0.5, Hh, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 224, 128, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Dorsal + ventral fins
        ctx.fillStyle = 'rgba(255, 215, 0, 0.35)';
        ctx.beginPath();
        ctx.moveTo(L * 0.05, -Hh);
        ctx.quadraticCurveTo(-L * 0.1, -Hh * 1.8, -L * 0.25, -Hh * 0.9);
        ctx.lineTo(-L * 0.1, -Hh * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(L * 0.05, Hh);
        ctx.quadraticCurveTo(-L * 0.1, Hh * 1.8, -L * 0.25, Hh * 0.9);
        ctx.lineTo(-L * 0.1, Hh * 0.7);
        ctx.closePath();
        ctx.fill();

        // Eye
        ctx.fillStyle = 'rgba(58, 42, 0, 0.7)';
        ctx.beginPath();
        ctx.arc(L * 0.32, -Hh * 0.15, Math.max(1.5, L * 0.045), 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      } else if (ghostRef.current) {
        ghostRef.current = null;
      }

      // -------------------------------------------------------------
      // 8. Water Ripples from interactions & surface
      // -------------------------------------------------------------
      ctx.save();
      for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
        const rp = ripplesRef.current[i];
        rp.r = Math.max(0.1, rp.r + 24 * dt);
        rp.opacity -= 0.6 * dt;

        ctx.strokeStyle = `rgba(180, 240, 255, ${Math.max(0, rp.opacity)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const rx = Math.max(0.1, rp.r);
        const ry = Math.max(0.1, rp.r * 0.35);
        ctx.ellipse(rp.x, rp.y, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();

        if (rp.opacity <= 0) {
          ripplesRef.current.splice(i, 1);
        }
      }
      ctx.restore();

      // -------------------------------------------------------------
      // 9. Water Surface Line & Specular Shimmer (Top)
      // -------------------------------------------------------------
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 16);
      for (let x = 0; x <= w; x += 30) {
        const waveY = 16 + Math.sin(x * 0.02 + timeSec * 2.5) * 3;
        ctx.lineTo(x, waveY);
      }
      ctx.stroke();
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    // Click on canvas to drop food or create ripples
    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      dropFood(clickX, clickY);
    };

    // Mouse move tracking
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        isDown: mouseRef.current.isDown,
        active: true,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      canvas.removeEventListener('click', handleCanvasClick);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [initAquascape, dropFood, isHeroOnly]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-crosshair"
        title="Klik di mana saja di dalam aquascape untuk menabur kuaci & memicu riak air!"
      />

      {/* Floating subtle overlay status */}
      {isHeroOnly && (
        <div className="absolute bottom-3 left-4 z-20 pointer-events-none hidden sm:flex items-center gap-3 text-xs text-cyan-200/60 font-mono backdrop-blur-sm px-2.5 py-1 rounded-md bg-black/20 border border-cyan-500/15">
          <span className="inline-block w-2 h-2 rounded-full bg-teal-400 animate-ping" />
          <span>Biotope: Nature Aquascape</span>
          <span>•</span>
          <span>Ikan: {fishCount}</span>
          {foodCount > 0 && <span>• Kuaci: {foodCount}</span>}
        </div>
      )}
    </div>
  );
};
