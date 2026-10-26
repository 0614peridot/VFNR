import { describe, expect, it, vi } from 'vitest';
import { createInteractionEventBus } from '../src/interactions/InteractionEventBus';

describe('interaction event bus', () => {
  it('exposes completed interaction outcomes for tutorial consumers', () => {
    const bus = createInteractionEventBus();
    const listener = vi.fn();
    bus.subscribe(listener);

    bus.emit({ type: 'doorOpened' });
    bus.emit({ type: 'objectGrabbed', objectId: 'grabbable-cube' });
    bus.emit({ type: 'teleportCompleted', destinationId: 'teleport-target-1' });

    expect(listener.mock.calls.map(([event]) => event.type)).toEqual([
      'doorOpened',
      'objectGrabbed',
      'teleportCompleted',
    ]);
  });

  it('stops delivering events after unsubscribe', () => {
    const bus = createInteractionEventBus();
    const listener = vi.fn();
    const unsubscribe = bus.subscribe(listener);

    bus.emit({ type: 'teleportInvalid' });
    unsubscribe();
    bus.emit({ type: 'teleportCancelled' });

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith({ type: 'teleportInvalid' });
  });
});
