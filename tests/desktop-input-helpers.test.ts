import { describe, expect, it } from 'vitest';
import {
  isDesktopMovementCode,
  normalizeDesktopMoveInput,
  pointerDeltaToTurnRadians,
} from '../src/input/DesktopInputAdapter';

describe('desktop input helpers', () => {
  it('recognizes only the configured movement keys', () => {
    expect(isDesktopMovementCode('KeyW')).toBe(true);
    expect(isDesktopMovementCode('ArrowLeft')).toBe(true);
    expect(isDesktopMovementCode('KeyT')).toBe(false);
  });

  it('maps WASD and arrow keys to the same movement axes', () => {
    expect(normalizeDesktopMoveInput(new Set(['KeyW', 'KeyD']))).toEqual(
      normalizeDesktopMoveInput(new Set(['ArrowUp', 'ArrowRight'])),
    );
    expect(normalizeDesktopMoveInput(new Set(['KeyS', 'KeyA']))).toEqual(
      normalizeDesktopMoveInput(new Set(['ArrowDown', 'ArrowLeft'])),
    );
  });

  it('normalizes diagonal movement and cancels opposing inputs', () => {
    const diagonal = normalizeDesktopMoveInput(new Set(['KeyW', 'KeyD']));
    expect(Math.hypot(diagonal.x, diagonal.z)).toBeCloseTo(1);
    expect(diagonal.x).toBeGreaterThan(0);
    expect(diagonal.z).toBeLessThan(0);

    expect(
      normalizeDesktopMoveInput(new Set(['KeyW', 'KeyS', 'KeyA', 'KeyD'])),
    ).toEqual({ x: 0, z: 0 });
  });

  it('maps pointer movement to bounded yaw in the expected direction', () => {
    expect(pointerDeltaToTurnRadians(20, 0.01)).toBeCloseTo(-0.2);
    expect(pointerDeltaToTurnRadians(-20, 0.01)).toBeCloseTo(0.2);
    expect(pointerDeltaToTurnRadians(10_000, 1)).toBe(-Math.PI / 6);
    expect(pointerDeltaToTurnRadians(Number.NaN)).toBe(0);
  });
});
