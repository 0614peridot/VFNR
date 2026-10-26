import { describe, expect, it } from 'vitest';
import {
  applyRadialDeadzone,
  isQuestTouchProfile,
  readXRStandardThumbstick,
  updateSnapTurnState,
  updateTeleportStickState,
  type TeleportStickState,
} from '../src/input/WebXRInputAdapter';

describe('WebXR input helpers', () => {
  it('applies and rescales a radial movement deadzone', () => {
    expect(applyRadialDeadzone(0.1, -0.1)).toEqual({ x: 0, y: 0 });
    const forward = applyRadialDeadzone(0, -0.61, 0.22);
    expect(forward.x).toBe(0);
    expect(forward.y).toBeCloseTo(-0.5);
  });

  it('reads only the xr-standard thumbstick slots', () => {
    const standard = {
      mapping: 'xr-standard',
      axes: [0, 0, 0.4, -0.7],
    } as unknown as Gamepad;
    const unknown = {
      mapping: '',
      axes: [0.4, -0.7],
    } as unknown as Gamepad;

    expect(readXRStandardThumbstick(standard)).toEqual({ x: 0.4, y: -0.7 });
    expect(readXRStandardThumbstick(unknown)).toBeNull();
  });

  it('gates the X button to known Meta and Oculus Touch profiles', () => {
    expect(isQuestTouchProfile(['meta-quest-touch-plus', 'generic-trigger'])).toBe(true);
    expect(isQuestTouchProfile(['oculus-touch-v3'])).toBe(true);
    expect(isQuestTouchProfile(['generic-trigger-squeeze-thumbstick'])).toBe(false);
  });

  it('emits one 30-degree snap until the stick returns through hysteresis', () => {
    const first = updateSnapTurnState(0.8, { latched: false });
    expect(first.radians).toBeCloseTo(-Math.PI / 6);
    expect(updateSnapTurnState(0.9, first.state).radians).toBeNull();

    const released = updateSnapTurnState(0.2, first.state);
    expect(released.state.latched).toBe(false);
    expect(updateSnapTurnState(-0.8, released.state).radians).toBeCloseTo(Math.PI / 6);
  });

  it('delays teleport completion so a pull-back gesture can cancel', () => {
    const idle: TeleportStickState = { phase: 'idle', neutralSince: null };
    const started = updateTeleportStickState(-0.8, 0, idle);
    expect(started.events).toEqual(['start']);

    const neutral = updateTeleportStickState(0, 20, started.state);
    expect(neutral.state.phase).toBe('pending-complete');
    expect(neutral.events).toEqual(['update']);

    const cancelled = updateTeleportStickState(0.8, 80, neutral.state);
    expect(cancelled.events).toEqual(['cancel']);
    expect(cancelled.state.phase).toBe('idle');

    const restarted = updateTeleportStickState(-0.8, 200, cancelled.state);
    const released = updateTeleportStickState(0, 220, restarted.state);
    const completed = updateTeleportStickState(0, 341, released.state);
    expect(completed.events).toEqual(['update', 'complete']);
    expect(completed.state.phase).toBe('idle');
  });
});
