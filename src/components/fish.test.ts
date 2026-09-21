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

  it('should prioritize the custom primary names defined by the user for team members', () => {
    const used = new Set<string>();
    expect(getFishName('mascot', used)).toBe('Andreas');
    expect(getFishName('angelfish', used)).toBe('Amsal');
    expect(getFishName('cherryShrimp', used)).toBe('Fahrudin');
    expect(getFishName('rasbora', used)).toBe('Pandu');
    expect(getFishName('guppy', used)).toBe('Fransisca');
    expect(getFishName('neonTetra', used)).toBe('Piki');
  });

  it('should support default names for all 5 new oceanic species', () => {
    const used = new Set<string>();
    expect(getFishName('shark', used)).toBe('Baron');
    expect(getFishName('whale', used)).toBe('Leviathan');
    expect(getFishName('dolphin', used)).toBe('Delta');
    expect(getFishName('mantaRay', used)).toBe('Phantom');
    expect(getFishName('pufferfish', used)).toBe('Spike');
  });

  it('should pick unique default names for species', () => {
    const used = new Set<string>();
    const name1 = getFishName('shark', used);
    const name2 = getFishName('shark', used);

    expect(name1).toBeTruthy();
    expect(name2).toBeTruthy();
    expect(name1).not.toBe(name2);
  });

  it('should spawn the 5 default team members from fish-names.json when using defaults', () => {
    const school = createFishSchool(800, 500);
    expect(school).toHaveLength(5);
    const names = school.map((f) => f.name);
    expect(names).toContain('Andreas');
    expect(names).toContain('Amsal');
    expect(names).toContain('Fahrudin');
    expect(names).toContain('Pandu');
    expect(names).toContain('Fransisca');
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
});
