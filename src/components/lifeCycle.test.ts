import { describe, it, expect } from 'vitest';
import {
  getFishStageScale,
  feedFishKuaci,
  spawnBabyFish,
  getHungerStatus,
  updateFishLifeCycle,
} from './lifeCycleHelper';
import { FishParticle } from '../types';

describe('Fish Life Cycle & Regeneration System (TDD)', () => {
  it('should return appropriate scale multiplier for each growth stage', () => {
    expect(getFishStageScale('baby')).toBeCloseTo(0.45);
    expect(getFishStageScale('juvenile')).toBeCloseTo(0.75);
    expect(getFishStageScale('adult')).toBeCloseTo(1.05);
    expect(getFishStageScale('elderly')).toBeCloseTo(1.0);
    expect(getFishStageScale('fading')).toBeLessThanOrEqual(1.0);
  });

  it('should evolve fish from baby to juvenile to adult when eating kuaci', () => {
    const babyFish: FishParticle = {
      id: 101,
      name: 'Piki',
      x: 200,
      y: 200,
      vx: 1,
      vy: 0,
      size: 10,
      baseSize: 20,
      type: 'neonTetra',
      color: '#00f7ff',
      angle: 0,
      tailPhase: 0,
      tailSpeed: 0.2,
      hunger: 60,
      eatenCount: 0,
      stage: 'baby',
      growthPoints: 0,
      ageSec: 10,
    };

    // Feed 1 kuaci: still baby
    const feed1 = feedFishKuaci(babyFish);
    expect(babyFish.eatenCount).toBe(1);
    expect(babyFish.hunger).toBeLessThan(60);
    expect(babyFish.stage).toBe('baby');
    expect(feed1.grew).toBe(false);

    // Feed 2nd kuaci: evolves to juvenile
    const feed2 = feedFishKuaci(babyFish);
    expect(babyFish.eatenCount).toBe(2);
    expect(babyFish.stage).toBe('juvenile');
    expect(feed2.grew).toBe(true);

    // Feed until adult
    feedFishKuaci(babyFish);
    feedFishKuaci(babyFish);
    const feedFinal = feedFishKuaci(babyFish);
    expect(babyFish.stage).toBe('adult');
    expect(feedFinal.grew).toBe(true);
  });

  it('should spawn a baby fish with baby stage, small size, and valid name', () => {
    const usedNames = new Set<string>();
    const baby = spawnBabyFish(800, 500, 'neonTetra', usedNames);

    expect(baby.stage).toBe('baby');
    expect(baby.ageSec).toBe(0);
    expect(baby.eatenCount).toBe(0);
    expect(baby.name).toBeTruthy();
    expect(baby.size).toBeLessThanOrEqual(baby.baseSize * 0.6);

    const babyOrca = spawnBabyFish(800, 500, 'orca', usedNames);
    expect(babyOrca.type).toBe('orca');
    expect(babyOrca.stage).toBe('baby');
    expect(babyOrca.baseSize).toBe(78);

    const babyTurtle = spawnBabyFish(800, 500, 'turtle', usedNames);
    expect(babyTurtle.type).toBe('turtle');
    expect(babyTurtle.stage).toBe('baby');
    expect(babyTurtle.baseSize).toBe(44);
  });

  it('should return clean hunger status text without any emojis', () => {
    const full = getHungerStatus(10);
    expect(full.label).toBe('Kenyang');
    expect(full.label).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u);

    const normal = getHungerStatus(40);
    expect(normal.label).toBe('Normal');

    const hungry = getHungerStatus(75);
    expect(hungry.label).toBe('Lapar');

    const starving = getHungerStatus(95);
    expect(starving.label).toBe('Sangat Lapar');
  });

  it('should handle aging and flag rebornNeeded when fading finishes', () => {
    const elderFish: FishParticle = {
      id: 202,
      name: 'Oldie',
      x: 300,
      y: 300,
      vx: 0.5,
      vy: 0,
      size: 20,
      baseSize: 20,
      type: 'rasbora',
      color: '#f97316',
      angle: 0,
      tailPhase: 0,
      tailSpeed: 0.2,
      hunger: 30,
      eatenCount: 15,
      stage: 'fading',
      growthPoints: 20,
      ageSec: 600,
      fadeOpacity: 0.05,
    };

    const result = updateFishLifeCycle(elderFish, 0.2, { enableLifeCycle: true });
    expect(result.rebornNeeded).toBe(true);
  });

  it('should naturally mature baby fish to juvenile and adult over time without kuaci', () => {
    const babyFish: FishParticle = {
      id: 301,
      name: 'NaturalBaby',
      x: 200,
      y: 200,
      vx: 1,
      vy: 0,
      size: 9,
      baseSize: 20,
      type: 'neonTetra',
      color: '#00f7ff',
      angle: 0,
      tailPhase: 0,
      tailSpeed: 0.2,
      hunger: 10,
      eatenCount: 0,
      stage: 'baby',
      growthPoints: 0,
      ageSec: 89,
    };

    // At 89 seconds: still baby
    updateFishLifeCycle(babyFish, 1, { enableLifeCycle: true });
    expect(babyFish.stage).toBe('baby');

    // At 91 seconds: matures to juvenile
    updateFishLifeCycle(babyFish, 1, { enableLifeCycle: true });
    expect(babyFish.stage).toBe('juvenile');

    // Fast-forward to 201 seconds: matures to adult
    babyFish.ageSec = 200;
    updateFishLifeCycle(babyFish, 1, { enableLifeCycle: true });
    expect(babyFish.stage).toBe('adult');
  });

  it('should keep mascot immortal without aging or fading', () => {
    const mascotFish: FishParticle = {
      id: 1,
      name: 'Aquascape',
      x: 200,
      y: 200,
      vx: 1,
      vy: 0,
      size: 48,
      baseSize: 48,
      type: 'mascot',
      color: '#0e385e',
      angle: 0,
      tailPhase: 0,
      tailSpeed: 0.16,
      hunger: 10,
      eatenCount: 0,
      stage: 'adult',
      growthPoints: 6,
      ageSec: 2000,
    };

    const result = updateFishLifeCycle(mascotFish, 10, { enableLifeCycle: true });
    expect(mascotFish.stage).toBe('adult');
    expect(result.rebornNeeded).toBe(false);
  });
});

