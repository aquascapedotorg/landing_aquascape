import { describe, it, expect } from 'vitest';
import { createGhostKoi, updateGhostKoi } from './ghostKoi';

describe('createGhostKoi', () => {
  it('places the koi inside the canvas bounds', () => {
    const g = createGhostKoi(800, 500);
    expect(g.x).toBeGreaterThan(0);
    expect(g.x).toBeLessThan(800);
    expect(g.y).toBeGreaterThan(0);
    expect(g.y).toBeLessThan(500);
  });

  it('gives the koi a non-zero velocity so it swims', () => {
    const g = createGhostKoi(800, 500);
    expect(Math.hypot(g.vx, g.vy)).toBeGreaterThan(0);
  });
});

describe('updateGhostKoi', () => {
  it('moves the koi according to its velocity', () => {
    const g = { x: 400, y: 250, vx: 1, vy: 0, tailPhase: 0, size: 40 };
    updateGhostKoi(g, 0.1, 800, 500);
    expect(g.x).toBeGreaterThan(400);
  });

  it('advances the tail phase each update', () => {
    const g = { x: 400, y: 250, vx: 1, vy: 0, tailPhase: 0, size: 40 };
    updateGhostKoi(g, 0.1, 800, 500);
    expect(g.tailPhase).toBeGreaterThan(0);
  });

  it('bounces off the right edge (vx becomes negative)', () => {
    const g = { x: 799, y: 250, vx: 3, vy: 0, tailPhase: 0, size: 40 };
    updateGhostKoi(g, 0.1, 800, 500);
    expect(g.vx).toBeLessThan(0);
  });

  it('bounces off the left edge (vx becomes positive)', () => {
    const g = { x: 1, y: 250, vx: -3, vy: 0, tailPhase: 0, size: 40 };
    updateGhostKoi(g, 0.1, 800, 500);
    expect(g.vx).toBeGreaterThan(0);
  });

  it('keeps the koi within the canvas bounds after moving', () => {
    const g = { x: 795, y: 495, vx: 10, vy: 10, tailPhase: 0, size: 40 };
    updateGhostKoi(g, 0.5, 800, 500);
    expect(g.x).toBeLessThanOrEqual(800);
    expect(g.y).toBeLessThanOrEqual(500);
    expect(g.x).toBeGreaterThanOrEqual(0);
    expect(g.y).toBeGreaterThanOrEqual(0);
  });
});
