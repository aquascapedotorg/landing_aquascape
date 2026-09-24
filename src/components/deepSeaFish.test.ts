import { describe, it, expect } from 'vitest';
import { FishSpeciesType } from '../types';
import {
  createSingleFish,
  createFishSchool,
  drawMarlin,
  drawAnglerfish,
  drawLanternfish,
  drawViperfish,
  drawMoray,
  drawElectricEel,
} from './fishRenderer';
import { VALID_FISH_SPECIES, normalizeFishSpecies } from '../services/supabaseFishService';
import { FISH_CATALOG } from '../data/fishCatalog';

const NEW_SPECIES: FishSpeciesType[] = [
  'marlin',
  'anglerfish',
  'lanternfish',
  'viperfish',
  'moray',
  'electricEel',
];

describe('new deep-sea species', () => {
  describe('createSingleFish', () => {
    NEW_SPECIES.forEach((sp) => {
      it(`builds a valid ${sp}`, () => {
        const fish = createSingleFish(sp, 1, 800, 500, new Set());
        expect(fish.type).toBe(sp);
        expect(fish.size).toBeGreaterThan(0);
        expect(typeof fish.name).toBe('string');
        expect(fish.name.length).toBeGreaterThan(0);
        expect(Number.isFinite(fish.x)).toBe(true);
        expect(Number.isFinite(fish.y)).toBe(true);
      });
    });
  });

  describe('createFishSchool with new species', () => {
    it('spawns the requested new species', () => {
      const school = createFishSchool(800, 500, 6, NEW_SPECIES, false);
      const types = new Set(school.map((f) => f.type));
      // At least a few of the new species should appear in the school.
      const appeared = NEW_SPECIES.filter((s) => types.has(s));
      expect(appeared.length).toBeGreaterThan(0);
    });
  });

  describe('catalog registration', () => {
    NEW_SPECIES.forEach((sp) => {
      it(`has a catalog definition for ${sp}`, () => {
        const def = FISH_CATALOG.species.find((s) => s.id === sp);
        expect(def).toBeDefined();
        expect(def?.defaultNames.length).toBeGreaterThan(0);
      });
    });
  });

  describe('supabase species validity', () => {
    NEW_SPECIES.forEach((sp) => {
      it(`${sp} is a valid supabase species`, () => {
        expect(VALID_FISH_SPECIES).toContain(sp);
        expect(normalizeFishSpecies(sp)).toBe(sp);
      });
    });
  });

  describe('indonesian aliases for new species', () => {
    const cases: Array<[string, string]> = [
      ['ikan pedang', 'marlin'],
      ['pedang', 'marlin'],
      ['todak', 'marlin'],
      ['pemancing', 'anglerfish'],
      ['ikan pemancing', 'anglerfish'],
      ['sungut ganda', 'anglerfish'],
      ['lentera', 'lanternfish'],
      ['ikan lentera', 'lanternfish'],
      ['viper', 'viperfish'],
      ['ular', 'viperfish'],
      ['belut', 'moray'],
      ['sidat', 'moray'],
      ['belut moray', 'moray'],
      ['belut listrik', 'electricEel'],
      ['listrik', 'electricEel'],
    ];
    cases.forEach(([alias, expected]) => {
      it(`maps "${alias}" -> ${expected}`, () => {
        expect(normalizeFishSpecies(alias)).toBe(expected);
        expect(normalizeFishSpecies(alias.toUpperCase())).toBe(expected);
      });
    });

    it('distinguishes belut (moray) from belut listrik (electricEel)', () => {
      expect(normalizeFishSpecies('belut')).toBe('moray');
      expect(normalizeFishSpecies('belut listrik')).toBe('electricEel');
    });
  });

  describe('draw functions are callable (smoke test)', () => {
    const makeCtx = () => {
      const calls: string[] = [];
      const handler: ProxyHandler<object> = {
        get: (_t, prop: string) => {
          if (prop === '__calls') return calls;
          return (..._args: unknown[]) => {
            calls.push(prop);
            // createRadialGradient/createLinearGradient must return a gradient-like
            if (prop === 'createRadialGradient' || prop === 'createLinearGradient') {
              return { addColorStop: () => {} };
            }
            return undefined;
          };
        },
        set: () => true,
      };
      return new Proxy({}, handler) as unknown as CanvasRenderingContext2D & {
        __calls: string[];
      };
    };

    const drawers: Array<[string, (c: CanvasRenderingContext2D, f: ReturnType<typeof createSingleFish>, w: number) => void]> = [
      ['marlin', drawMarlin],
      ['anglerfish', drawAnglerfish],
      ['lanternfish', drawLanternfish],
      ['viperfish', drawViperfish],
      ['moray', drawMoray],
      ['electricEel', drawElectricEel],
    ];

    drawers.forEach(([sp, fn]) => {
      it(`${sp} draw runs without throwing and paints`, () => {
        const ctx = makeCtx();
        const fish = createSingleFish(sp as FishSpeciesType, 1, 800, 500, new Set());
        expect(() => fn(ctx, fish, 0.1)).not.toThrow();
        const calls = (ctx as unknown as { __calls: string[] }).__calls;
        expect(calls.length).toBeGreaterThan(0);
      });
    });
  });
});
