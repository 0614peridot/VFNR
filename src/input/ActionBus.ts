import type {
  SemanticAction,
  SemanticActionListener,
} from './SemanticAction';

export interface ActionBus {
  emit(action: SemanticAction): void;
  subscribe(listener: SemanticActionListener): () => void;
}

export function createActionBus(): ActionBus {
  const listeners = new Set<SemanticActionListener>();

  return {
    emit: (action) => {
      listeners.forEach((listener) => listener(action));
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
