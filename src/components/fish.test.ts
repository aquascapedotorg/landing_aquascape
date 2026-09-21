import { describe, it, expect, vi } from 'vitest';
import { FISH_CATALOG, getFishName } from '../data/fishCatalog';
import { FishSpeciesType, FishParticle } from '../types';
import {
  createFishSchool,
  drawAngelfish,
  drawRasbora,
  drawGuppy,
  drawShark,
  drawWhale,
  drawDolphin,
  drawMantaRay,
  drawPufferfish,
  syncFishSchool,
  adjustFishPositionsForResize,
} from './fishRenderer';

describe('Fish Fauna & Naming System (TDD)', () => {
  it('should have all 11 species registered in the catalog', () => {
    expect(FISH_CATALOG.species).toHaveLength(11);
    const speciesIds = FISH_CATALOG.species.map((s) => s.id);
    expect(speciesIds).toContain('mascot');
    expect(speciesIds).toContain('neonTetra');
    expect(speciesIds).toContain('cherryShrimp');
    expect(speciesIds).toContain('angelfish');
    expect(speciesIds).toContain('rasbora');
    expect(speciesIds).toContain('guppy');
    expect(speciesIds).toContain('shark');
    expect(speciesIds).toContain('whale');
    expect(speciesIds).toContain('dolphin');
    expect(speciesIds).toContain('mantaRay');
    expect(speciesIds).toContain('pufferfish');
  });

  it('should prioritize the custom primary names defined by the user in fish-names.json', () => {
    const used = new Set<string>();
    FISH_CATALOG.species.forEach((sp) => {
      const expectedFirstName = sp.defaultNames[0];
      const actualName = getFishName(sp.id, used);
      expect(actualName).toBe(expectedFirstName);
    });
  });

  it('should pick unique default names for species', () => {
    const used = new Set<string>();
    const name1 = getFishName('shark', used);
    const name2 = getFishName('shark', used);

    expect(name1).toBeTruthy();
    expect(name2).toBeTruthy();
    expect(name1).not.toBe(name2);
  });

  it('should spawn fish school matching active species when using defaults', () => {
    const school = createFishSchool(800, 500);
    expect(school.length).toBeGreaterThanOrEqual(1);
    school.forEach((fish) => {
      expect(fish.name).toBeTruthy();
      expect(fish.type).toBeTruthy();
    });
  });

  it('should generate a school of fish matching density and active oceanic species', () => {
    const activeSpecies: FishSpeciesType[] = ['shark', 'whale', 'dolphin', 'mantaRay', 'pufferfish'];
    const width = 800;
    const height = 500;
    const count = 5;

    const school = createFishSchool(width, height, count, activeSpecies);

    expect(school).toHaveLength(count);
    const speciesInSchool = school.map((f) => f.type);
    activeSpecies.forEach((sp) => {
      expect(speciesInSchool).toContain(sp);
    });
    school.forEach((fish) => {
      expect(fish.name).toBeTruthy();
      expect(activeSpecies).toContain(fish.type);
      expect(fish.x).toBeGreaterThanOrEqual(0);
      expect(fish.x).toBeLessThanOrEqual(width);
      expect(fish.y).toBeGreaterThanOrEqual(0);
      expect(fish.y).toBeLessThanOrEqual(height);
      expect(fish.eatenCount).toBe(0);
    });
  });

  const createMockCtx = () =>
    ({
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      bezierCurveTo: vi.fn(),
      ellipse: vi.fn(),
      arc: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      lineCap: 'butt',
    } as unknown as CanvasRenderingContext2D);

  it('should render Angelfish with majestic elongated fins and body', () => {
    const mockCtx = createMockCtx();
    const fish: FishParticle = {
      id: 1,
      name: 'Gabriel',
      x: 100,
      y: 100,
      vx: 1,
      vy: 0,
      size: 38,
      baseSize: 38,
      type: 'angelfish',
      color: '#e2e8f0',
      secondaryColor: '#0f172a',
      angle: 0,
      tailPhase: 0,
      tailSpeed: 0.15,
      hunger: 10,
      eatenCount: 0,
      stage: 'adult',
      growthPoints: 5,
      ageSec: 20,
    };

    drawAngelfish(mockCtx, fish, 0.1);
    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.beginPath).toHaveBeenCalled();
    expect(mockCtx.fill).toHaveBeenCalled();
    expect(mockCtx.restore).toHaveBeenCalled();
  });

  it('should render Harlequin Rasbora with iconic black wedge patch', () => {
    const mockCtx = createMockCtx();
    const fish: FishParticle = {
      id: 2,
      name: 'Copper',
      x: 200,
      y: 150,
      vx: 1,
      vy: 0,
      size: 20,
      baseSize: 20,
      type: 'rasbora',
      color: '#f97316',
      secondaryColor: '#0f172a',
      angle: 0,
      tailPhase: 0,
      tailSpeed: 0.2,
      hunger: 10,
      eatenCount: 0,
      stage: 'adult',
      growthPoints: 5,
      ageSec: 20,
    };

    drawRasbora(mockCtx, fish, 0.1);
    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.fill).toHaveBeenCalled();
    expect(mockCtx.restore).toHaveBeenCalled();
  });

  it('should render Fancy Guppy with flowing rippling caudal tail', () => {
    const mockCtx = createMockCtx();
    const fish: FishParticle = {
      id: 3,
      name: 'Rainbow',
      x: 300,
      y: 200,
      vx: 1,
      vy: 0,
      size: 22,
      baseSize: 22,
      type: 'guppy',
      color: '#38bdf8',
      secondaryColor: '#ec4899',
      angle: 0,
      tailPhase: 0,
      tailSpeed: 0.25,
      hunger: 10,
      eatenCount: 0,
      stage: 'adult',
      growthPoints: 5,
      ageSec: 20,
    };

    drawGuppy(mockCtx, fish, 0.1, 1.0);
    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.fill).toHaveBeenCalled();
    expect(mockCtx.restore).toHaveBeenCalled();
  });

  it('should render Shark (Hiu) with sleek dorsal fin, countershading and gill slits', () => {
    const mockCtx = createMockCtx();
    const fish: FishParticle = {
      id: 4,
      name: 'Apex',
      x: 250,
      y: 200,
      vx: 1,
      vy: 0,
      size: 44,
      baseSize: 44,
      type: 'shark',
      color: '#475569',
      secondaryColor: '#94a3b8',
      angle: 0,
      tailPhase: 0,
      tailSpeed: 0.18,
      hunger: 10,
      eatenCount: 0,
      stage: 'adult',
      growthPoints: 5,
      ageSec: 20,
    };

    drawShark(mockCtx, fish, 0.15);
    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.fill).toHaveBeenCalled();
    expect(mockCtx.restore).toHaveBeenCalled();
  });

  it('should render Whale (Paus) with majestic curved rostrum and ventral pleats', () => {
    const mockCtx = createMockCtx();
    const fish: FishParticle = {
      id: 5,
      name: 'Titan',
      x: 250,
      y: 200,
      vx: 1,
      vy: 0,
      size: 62,
      baseSize: 62,
      type: 'whale',
      color: '#1e293b',
      secondaryColor: '#38bdf8',
      angle: 0,
      tailPhase: 0,
      tailSpeed: 0.1,
      hunger: 10,
      eatenCount: 0,
      stage: 'adult',
      growthPoints: 5,
      ageSec: 20,
    };

    drawWhale(mockCtx, fish, 0.1);
    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.fill).toHaveBeenCalled();
    expect(mockCtx.restore).toHaveBeenCalled();
  });

  it('should render Dolphin (Lumba-lumba) with iconic beak, curved dorsal fin and flukes', () => {
    const mockCtx = createMockCtx();
    const fish: FishParticle = {
      id: 6,
      name: 'Sonar',
      x: 250,
      y: 200,
      vx: 1,
      vy: 0,
      size: 40,
      baseSize: 40,
      type: 'dolphin',
      color: '#0284c7',
      secondaryColor: '#e0f2fe',
      angle: 0,
      tailPhase: 0,
      tailSpeed: 0.22,
      hunger: 10,
      eatenCount: 0,
      stage: 'adult',
      growthPoints: 5,
      ageSec: 20,
    };

    drawDolphin(mockCtx, fish, 0.15);
    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.fill).toHaveBeenCalled();
    expect(mockCtx.restore).toHaveBeenCalled();
  });

  it('should render Manta Ray (Pari) with triangular pectoral wings and whip tail', () => {
    const mockCtx = createMockCtx();
    const fish: FishParticle = {
      id: 7,
      name: 'Glide',
      x: 250,
      y: 200,
      vx: 1,
      vy: 0,
      size: 38,
      baseSize: 38,
      type: 'mantaRay',
      color: '#0f172a',
      secondaryColor: '#38bdf8',
      angle: 0,
      tailPhase: 0,
      tailSpeed: 0.12,
      hunger: 10,
      eatenCount: 0,
      stage: 'adult',
      growthPoints: 5,
      ageSec: 20,
    };

    drawMantaRay(mockCtx, fish, 0.1);
    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.fill).toHaveBeenCalled();
    expect(mockCtx.restore).toHaveBeenCalled();
  });

  it('should render Pufferfish (Buntal) with round speckled body and fluttering fins', () => {
    const mockCtx = createMockCtx();
    const fish: FishParticle = {
      id: 8,
      name: 'Puffy',
      x: 250,
      y: 200,
      vx: 1,
      vy: 0,
      size: 24,
      baseSize: 24,
      type: 'pufferfish',
      color: '#eab308',
      secondaryColor: '#fef08a',
      angle: 0,
      tailPhase: 0,
      tailSpeed: 0.3,
      hunger: 10,
      eatenCount: 0,
      stage: 'adult',
      growthPoints: 5,
      ageSec: 20,
    };

    drawPufferfish(mockCtx, fish, 0.15, 1.5);
    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.fill).toHaveBeenCalled();
    expect(mockCtx.restore).toHaveBeenCalled();
  });

  it('should synchronize fish school when density increases without wiping existing fish or babies', () => {
    const existingBaby: FishParticle = {
      id: 999,
      name: 'Si Imut',
      x: 150,
      y: 120,
      vx: 0.8,
      vy: 0.1,
      size: 9,
      baseSize: 20,
      type: 'neonTetra',
      color: '#00f7ff',
      angle: 0,
      tailPhase: 0,
      tailSpeed: 0.2,
      hunger: 55,
      eatenCount: 1,
      stage: 'baby',
      growthPoints: 1,
      ageSec: 15,
    };

    const existingSchool = [
      ...createFishSchool(800, 500, 4, ['mascot', 'angelfish', 'guppy', 'neonTetra']),
      existingBaby,
    ];
    expect(existingSchool).toHaveLength(5);

    // Increase density from 5 to 7
    const activeSpecies: FishSpeciesType[] = ['mascot', 'angelfish', 'guppy', 'neonTetra', 'shark'];
    const synced = syncFishSchool(existingSchool, 7, activeSpecies, 800, 500);

    expect(synced).toHaveLength(7);

    // The baby fish MUST be preserved with all its properties (Fix for Bug 2)
    const preservedBaby = synced.find((f) => f.id === 999);
    expect(preservedBaby).toBeDefined();
    expect(preservedBaby?.name).toBe('Si Imut');
    expect(preservedBaby?.stage).toBe('baby');
    expect(preservedBaby?.growthPoints).toBe(1);
    expect(preservedBaby?.hunger).toBe(55);
  });

  it('should clamp fish positions during resize without destroying fish identities', () => {
    const fishList = createFishSchool(1000, 800, 4, ['mascot', 'shark']);
    fishList[0].x = 950;
    fishList[0].y = 750;
    const originalId = fishList[0].id;
    const originalName = fishList[0].name;

    // Resize canvas to a smaller dimension 400x300
    adjustFishPositionsForResize(fishList, 400, 300);

    expect(fishList[0].id).toBe(originalId);
    expect(fishList[0].name).toBe(originalName);
    expect(fishList[0].x).toBeLessThan(400);
    expect(fishList[0].y).toBeLessThan(300);
    expect(fishList[0].x).toBeGreaterThan(0);
    expect(fishList[0].y).toBeGreaterThan(0);
  });
});

