import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aquascapeEvents, AquascapeCanvasProvider } from './aquascapeEvents';
import { FishParticle } from '../types';

describe('Aquascape Events & Canvas Provider Manager (TDD)', () => {
  const globalWin = (typeof window !== 'undefined' ? window : globalThis) as unknown as Window;

  beforeEach(() => {
    aquascapeEvents.clearAll();
  });

  const createDummyFish = (id: number, name: string): FishParticle => ({
    id,
    name,
    x: 100,
    y: 100,
    vx: 1,
    vy: 0,
    size: 20,
    baseSize: 20,
    type: 'neonTetra',
    color: '#00f7ff',
    angle: 0,
    tailPhase: 0,
    tailSpeed: 0.2,
    hunger: 20,
    eatenCount: 0,
    stage: 'adult',
    growthPoints: 5,
    ageSec: 30,
  });

  it('should route actions to the registered primary provider', () => {
    const dropFoodMock = vi.fn();
    const spawnBabyMock = vi.fn();
    const fishList = [createDummyFish(1, 'Glowy')];
    const getFishListMock = vi.fn(() => fishList);
    const renameFishMock = vi.fn();

    const heroProvider: AquascapeCanvasProvider = {
      dropFood: dropFoodMock,
      spawnBaby: spawnBabyMock,
      getFishList: getFishListMock,
      renameFish: renameFishMock,
    };

    const unregister = aquascapeEvents.registerProvider('hero', heroProvider);

    aquascapeEvents.dropFood(120, 50);
    expect(dropFoodMock).toHaveBeenCalledWith(120, 50);

    aquascapeEvents.spawnBaby();
    expect(spawnBabyMock).toHaveBeenCalledTimes(1);

    const result = aquascapeEvents.getFishList();
    expect(result).toEqual(fishList);

    aquascapeEvents.renameFish(1, 'NeonFlash');
    expect(renameFishMock).toHaveBeenCalledWith(1, 'NeonFlash');

    unregister();
  });

  it('should switch active provider to Zen canvas when mounted, and gracefully restore Hero canvas when unmounted', () => {
    const heroDropFood = vi.fn();
    const heroProvider: AquascapeCanvasProvider = {
      dropFood: heroDropFood,
    };

    const zenDropFood = vi.fn();
    const zenProvider: AquascapeCanvasProvider = {
      dropFood: zenDropFood,
    };

    // 1. Hero canvas mounts
    const unregisterHero = aquascapeEvents.registerProvider('hero', heroProvider);

    aquascapeEvents.dropFood();
    expect(heroDropFood).toHaveBeenCalledTimes(1);
    expect(zenDropFood).not.toHaveBeenCalled();

    // 2. Zen Modal opens and mounts Zen canvas
    const unregisterZen = aquascapeEvents.registerProvider('zen', zenProvider);

    aquascapeEvents.dropFood();
    expect(zenDropFood).toHaveBeenCalledTimes(1);
    expect(heroDropFood).toHaveBeenCalledTimes(1); // not incremented

    // 3. Zen Modal closes and unmounts Zen canvas
    unregisterZen();

    // 4. Hero canvas MUST remain active! (Fix for Bug 1)
    aquascapeEvents.dropFood();
    expect(heroDropFood).toHaveBeenCalledTimes(2);

    unregisterHero();
    // When all are unmounted, calling dropFood does not throw error
    expect(() => aquascapeEvents.dropFood()).not.toThrow();
  });

  it('should synchronize safely with global methods without deleting them on unregister', () => {
    const heroDropFood = vi.fn();
    const heroProvider: AquascapeCanvasProvider = {
      dropFood: heroDropFood,
    };

    aquascapeEvents.syncToWindow();

    const unregisterHero = aquascapeEvents.registerProvider('hero', heroProvider);
    expect(typeof globalWin.__aquascapeDropFood).toBe('function');

    globalWin.__aquascapeDropFood?.(200, 30);
    expect(heroDropFood).toHaveBeenCalledWith(200, 30);

    // Unregister Hero
    unregisterHero();

    // globalWin.__aquascapeDropFood should still be a safe callable function (noop), not deleted / causing TypeError
    expect(typeof globalWin.__aquascapeDropFood).toBe('function');
    expect(() => globalWin.__aquascapeDropFood?.(100, 20)).not.toThrow();
  });
});
