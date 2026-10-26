export type AppMode = 'undecided' | 'screen' | 'immersive-vr';

export type AppStatus =
  | 'loading'
  | 'ready'
  | 'entering-vr'
  | 'running'
  | 'vr-unavailable'
  | 'recoverable-error';

export interface AppState {
  mode: AppMode;
  status: AppStatus;
  sceneReady: boolean;
  immersiveVRSupported: boolean | null;
  message: string;
}

export type StateListener = (state: Readonly<AppState>) => void;

export interface AppStore {
  getState(): Readonly<AppState>;
  setState(update: Partial<AppState>): void;
  subscribe(listener: StateListener): () => void;
}

export const initialAppState: AppState = {
  mode: 'undecided',
  status: 'loading',
  sceneReady: false,
  immersiveVRSupported: null,
  message: 'Preparing the shared 3D experience…',
};

export function createAppStore(seed: AppState = initialAppState): AppStore {
  let state: AppState = { ...seed };
  const listeners = new Set<StateListener>();

  return {
    getState: () => state,
    setState: (update) => {
      state = { ...state, ...update };
      listeners.forEach((listener) => listener(state));
    },
    subscribe: (listener) => {
      listeners.add(listener);
      listener(state);
      return () => listeners.delete(listener);
    },
  };
}
