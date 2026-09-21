import { describe, it, expect, vi } from 'vitest';
import { generateKuaciBatch, updateKuaciParticle, drawKuaciParticle } from './kuaciHelper';
import { FoodParticle } from '../types';

describe('Kuaci Particle System (TDD)', () => {
  it('should generate a batch of kuaci particles with required properties', () => {
    const dropX = 200;
    const dropY = 20;
    const batch = generateKuaciBatch(dropX, dropY);

    expect(batch.length).toBeGreaterThanOrEqual(4);
    expect(batch.length).toBeLessThanOrEqual(7);

    batch.forEach((particle) => {
      expect(particle.id).toBeDefined();
      expect(typeof particle.x).toBe('number');
      expect(typeof particle.y).toBe('number');
      expect(particle.x).toBeGreaterThanOrEqual(dropX - 35);
      expect(particle.x).toBeLessThanOrEqual(dropX + 35);
      expect(typeof particle.vy).toBe('number');
      expect(particle.vy).toBeGreaterThan(0);
      expect(typeof particle.angle).toBe('number');
      expect(typeof particle.vRot).toBe('number');
      expect(['striped', 'black', 'kernel']).toContain(particle.seedType);
      expect(particle.eaten).toBe(false);

      if (particle.seedType === 'kernel') {
        expect(particle.color).toBe('#fef08a');
      } else if (particle.seedType === 'striped') {
        expect(particle.color).toBe('#18202c');
      } else {
        expect(particle.color).toBe('#0b0f17');
      }
    });
  });

  it('should update kuaci position, sway, and rotation with dt', () => {
    const particle: FoodParticle = {
      id: 1,
      x: 100,
      y: 50,
      vx: 0.1,
      vy: 0.5,
      size: 6,
      angle: 0,
      vRot: 1.5,
      seedType: 'striped',
      color: '#18202c',
      eaten: false,
    };

    const initialY = particle.y;
    const initialAngle = particle.angle;
    const dt = 0.016; // ~60fps
    const timeSec = 1.0;

    updateKuaciParticle(particle, dt, timeSec);

    expect(particle.y).toBeGreaterThan(initialY);
    expect(particle.angle).not.toBe(initialAngle);
  });

  it('should render kuaci on canvas context with appropriate shapes for striped seeds', () => {
    const mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      bezierCurveTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      ellipse: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      lineCap: 'butt',
    } as unknown as CanvasRenderingContext2D;

    const stripedParticle: FoodParticle = {
      id: 1,
      x: 150,
      y: 80,
      vx: 0,
      vy: 0.5,
      size: 6,
      angle: 0.5,
      vRot: 0.2,
      seedType: 'striped',
      color: '#18202c',
      eaten: false,
    };

    drawKuaciParticle(mockCtx, stripedParticle);

    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.translate).toHaveBeenCalledWith(150, 80);
    expect(mockCtx.rotate).toHaveBeenCalledWith(0.5);
    expect(mockCtx.bezierCurveTo).toHaveBeenCalled();
    expect(mockCtx.fill).toHaveBeenCalled();
    expect(mockCtx.stroke).toHaveBeenCalled();
    expect(mockCtx.restore).toHaveBeenCalled();
  });

  it('should render golden roasted kernel shape for kernel seedType', () => {
    const mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      bezierCurveTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      ellipse: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      lineCap: 'butt',
    } as unknown as CanvasRenderingContext2D;

    const kernelParticle: FoodParticle = {
      id: 2,
      x: 200,
      y: 100,
      vx: 0,
      vy: 0.5,
      size: 6,
      angle: 0,
      vRot: 0,
      seedType: 'kernel',
      color: '#fef08a',
      eaten: false,
    };

    drawKuaciParticle(mockCtx, kernelParticle);

    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.translate).toHaveBeenCalledWith(200, 100);
    expect(mockCtx.ellipse).toHaveBeenCalled();
    expect(mockCtx.restore).toHaveBeenCalled();
  });
});
