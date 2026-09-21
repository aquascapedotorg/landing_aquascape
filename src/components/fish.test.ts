import { describe, it, expect, vi } from 'vitest';
import { FISH_CATALOG, getFishName } from '../data/fishCatalog';
import { FishSpeciesType, FishParticle } from '../types';
import {
  createFishSchool,
  drawAngelfish,
  drawRasbora,
  drawGuppy,
} from './fishRenderer';

describe('Fish Fauna & Naming System (TDD)', () => {
  it('should have all 6 species registered in the catalog', () => {
    expect(FISH_CATALOG.species).toHaveLength(6);
    const speciesIds = FISH_CATALOG.species.map((s) => s.id);
    expect(speciesIds).toContain('mascot');
    expect(speciesIds).toContain('neonTetra');
    expect(speciesIds).toContain('cherryShrimp');
    expect(speciesIds).toContain('angelfish');
    expect(speciesIds).toContain('rasbora');
    expect(speciesIds).toContain('guppy');
  });

  it('should prioritize the custom primary names defined by the user', () => {
    const used = new Set<string>();
    expect(getFishName('mascot', used)).toBe('Andreas');
    expect(getFishName('angelfish', used)).toBe('Amsal');
    expect(getFishName('cherryShrimp', used)).toBe('Fahrudin');
    expect(getFishName('rasbora', used)).toBe('Pandu');
    expect(getFishName('guppy', used)).toBe('Fransisca');
    expect(getFishName('neonTetra', used)).toBe('Piki');
  });

  it('should pick unique default names for species', () => {
    const used = new Set<string>();
    const name1 = getFishName('angelfish', used);
    const name2 = getFishName('angelfish', used);

    expect(name1).toBeTruthy();
    expect(name2).toBeTruthy();
    expect(name1).not.toBe(name2);
  });

  it('should generate a school of fish matching density and active species', () => {
    const activeSpecies: FishSpeciesType[] = ['angelfish', 'rasbora', 'guppy'];
    const width = 800;
    const height = 500;
    const count = 9;

    const school = createFishSchool(width, height, count, activeSpecies);

    expect(school).toHaveLength(count);
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

  it('should render Angelfish with majestic elongated fins and body', () => {
    const mockCtx = {
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
    } as unknown as CanvasRenderingContext2D;

    const angelfish: FishParticle = {
      id: 1,
      name: 'Gabriel',
      x: 100,
      y: 100,
      vx: 1,
      vy: 0,
      size: 38,
      type: 'angelfish',
      color: '#e2e8f0',
      secondaryColor: '#0f172a',
      angle: 0,
      tailPhase: 0,
      tailSpeed: 0.15,
      eatenCount: 0,
    };

    drawAngelfish(mockCtx, angelfish, 0.1);

    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.beginPath).toHaveBeenCalled();
    expect(mockCtx.fill).toHaveBeenCalled();
    expect(mockCtx.restore).toHaveBeenCalled();
  });

  it('should render Harlequin Rasbora with iconic black wedge patch', () => {
    const mockCtx = {
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
    } as unknown as CanvasRenderingContext2D;

    const rasbora: FishParticle = {
      id: 2,
      name: 'Copper',
      x: 200,
      y: 150,
      vx: 1,
      vy: 0,
      size: 20,
      type: 'rasbora',
      color: '#f97316',
      secondaryColor: '#0f172a',
      angle: 0,
      tailPhase: 0,
      tailSpeed: 0.2,
      eatenCount: 0,
    };

    drawRasbora(mockCtx, rasbora, 0.1);

    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.fill).toHaveBeenCalled();
    expect(mockCtx.restore).toHaveBeenCalled();
  });

  it('should render Fancy Guppy with flowing rippling caudal tail', () => {
    const mockCtx = {
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
    } as unknown as CanvasRenderingContext2D;

    const guppy: FishParticle = {
      id: 3,
      name: 'Rainbow',
      x: 300,
      y: 200,
      vx: 1,
      vy: 0,
      size: 22,
      type: 'guppy',
      color: '#38bdf8',
      secondaryColor: '#ec4899',
      angle: 0,
      tailPhase: 0,
      tailSpeed: 0.25,
      eatenCount: 0,
    };

    drawGuppy(mockCtx, guppy, 0.1, 1.0);

    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.fill).toHaveBeenCalled();
    expect(mockCtx.restore).toHaveBeenCalled();
  });
});
