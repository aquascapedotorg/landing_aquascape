import { describe, it, expect, beforeEach } from 'vitest';
import {
  getLegendaryNames,
  getTodayLegendaryList,
  isLegendary,
  rollForFish,
  __resetLegendaryForTest,
  __setLegendaryForTest,
} from './legendaryService';

describe('legendaryService', () => {
  beforeEach(() => __resetLegendaryForTest());

  it('starts empty', () => {
    expect(getLegendaryNames().size).toBe(0);
    expect(getTodayLegendaryList()).toEqual([]);
    expect(isLegendary('Budi')).toBe(false);
  });

  it('exposes set winners and matches names case/space-normalized', () => {
    __setLegendaryForTest([{ name: 'Budi Santoso', species: 'shark' }]);
    expect(getLegendaryNames().has('Budi Santoso')).toBe(true);
    expect(isLegendary('Budi Santoso ')).toBe(true); // trailing space normalized
    expect(isLegendary('budi santoso')).toBe(false); // case-sensitive
  });

  it('rollForFish does not throw when uninitialised', () => {
    expect(() => rollForFish('Budi')).not.toThrow();
    expect(() => rollForFish('')).not.toThrow();
  });
});
