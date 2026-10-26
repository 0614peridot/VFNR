import { describe, expect, it } from 'vitest';
import { initialAppState, type AppState } from '../src/app/AppState';
import { canContinueOnScreen } from '../src/ui/createEntryUI';

function state(update: Partial<AppState>): AppState {
  return { ...initialAppState, ...update };
}

describe('entry UI state', () => {
  it('does not allow screen entry when the scene failed to start', () => {
    expect(
      canContinueOnScreen(
        state({ status: 'recoverable-error', sceneReady: false }),
      ),
    ).toBe(false);
  });

  it('allows screen entry when WebXR is unavailable but the scene is ready', () => {
    expect(
      canContinueOnScreen(
        state({ status: 'vr-unavailable', sceneReady: true }),
      ),
    ).toBe(true);
  });
});
