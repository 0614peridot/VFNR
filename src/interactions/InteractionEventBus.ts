export type InteractionEvent =
  | { type: 'moved'; distance: number }
  | { type: 'turned'; radians: number }
  | { type: 'teleportStarted' }
  | { type: 'teleportCompleted'; destinationId: string }
  | { type: 'teleportInvalid' }
  | { type: 'teleportCancelled' }
  | { type: 'doorOpened' }
  | { type: 'objectGrabbed'; objectId: string }
  | { type: 'objectDropped'; objectId: string }
  | { type: 'menuOpened' }
  | { type: 'mapOpened' }
  | { type: 'menuClosed' }
  | { type: 'transitionStarted'; destination: 'experiment' | 'lounge' }
  | { type: 'experimentEntered' }
  | { type: 'loungeReturned' };

export type InteractionEventListener = (
  event: Readonly<InteractionEvent>,
) => void;

export interface InteractionEventBus {
  emit(event: InteractionEvent): void;
  subscribe(listener: InteractionEventListener): () => void;
}

export function createInteractionEventBus(): InteractionEventBus {
  const listeners = new Set<InteractionEventListener>();

  return {
    emit: (event) => {
      listeners.forEach((listener) => listener(event));
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
