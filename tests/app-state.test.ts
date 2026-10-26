import { describe, expect, it, vi } from 'vitest';
import { createAppStore, initialAppState } from '../src/app/AppState';

describe('application state store', () => {
  it('starts from the shared initial state', () => {
    const store = createAppStore();
    expect(store.getState()).toEqual(initialAppState);
  });

  it('merges updates and notifies subscribers', () => {
    const store = createAppStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.setState({ mode: 'screen', status: 'running' });

    expect(store.getState()).toMatchObject({ mode: 'screen', status: 'running' });
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
  });
});
