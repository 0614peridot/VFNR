import { describe, expect, it, vi } from 'vitest';
import { createActionBus } from '../src/input/ActionBus';
import type { SemanticAction } from '../src/input/SemanticAction';

describe('semantic action bus', () => {
  it('delivers normalized actions without platform-specific inputs', () => {
    const bus = createActionBus();
    const listener = vi.fn();
    bus.subscribe(listener);

    const action: SemanticAction = {
      type: 'move',
      x: 0.5,
      z: -1,
      source: 'left-controller',
    };
    bus.emit(action);

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith(action);
  });

  it('supports teleport updates and unsubscribing', () => {
    const bus = createActionBus();
    const listener = vi.fn();
    const unsubscribe = bus.subscribe(listener);

    bus.emit({
      type: 'updateTeleport',
      source: 'desktop',
      ray: {
        origin: { x: 0, y: 1.65, z: 2 },
        direction: { x: 0, y: -0.25, z: -1 },
      },
    });
    unsubscribe();
    bus.emit({ type: 'cancelTeleport', source: 'desktop' });

    expect(listener).toHaveBeenCalledOnce();
  });
});
