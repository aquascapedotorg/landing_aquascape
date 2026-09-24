import { describe, it, expect } from 'vitest';
import { lightingForHour, resolveLighting } from './lightingUtils';

const at = (hour: number) => new Date(2026, 0, 1, hour, 0, 0);

describe('lightingForHour', () => {
  it('is daylight from 06:00 to 14:59', () => {
    expect(lightingForHour(6)).toBe('daylight');
    expect(lightingForHour(12)).toBe('daylight');
    expect(lightingForHour(14)).toBe('daylight');
  });

  it('is golden from 15:00 to 17:59', () => {
    expect(lightingForHour(15)).toBe('golden');
    expect(lightingForHour(17)).toBe('golden');
  });

  it('is moonlight from 18:00 to 05:59', () => {
    expect(lightingForHour(18)).toBe('moonlight');
    expect(lightingForHour(23)).toBe('moonlight');
    expect(lightingForHour(0)).toBe('moonlight');
    expect(lightingForHour(5)).toBe('moonlight');
  });
});

describe('resolveLighting', () => {
  it('follows local time when auto', () => {
    expect(resolveLighting('auto', at(10))).toBe('daylight');
    expect(resolveLighting('auto', at(16))).toBe('golden');
    expect(resolveLighting('auto', at(21))).toBe('moonlight');
  });

  it('passes explicit modes through unchanged', () => {
    expect(resolveLighting('daylight', at(21))).toBe('daylight');
    expect(resolveLighting('golden', at(3))).toBe('golden');
    expect(resolveLighting('moonlight', at(12))).toBe('moonlight');
  });
});
