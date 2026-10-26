import type { AppState } from '../app/AppState';

export interface EntryUICallbacks {
  onContinueOnScreen(): void;
  onEnterVR(): void;
  onRetry(): void;
}

export interface EntryUI {
  render(state: Readonly<AppState>): void;
}

function requireElement<T extends HTMLElement>(id: string): T {
  const element = document.querySelector<T>(`#${id}`);
  if (!element) {
    throw new Error(`Required UI element #${id} was not found.`);
  }
  return element;
}

export function createEntryUI(callbacks: EntryUICallbacks): EntryUI {
  const panel = requireElement<HTMLElement>('entry-panel');
  const message = requireElement<HTMLParagraphElement>('entry-message');
  const supportNote = requireElement<HTMLParagraphElement>('support-note');
  const enterVR = requireElement<HTMLButtonElement>('enter-vr');
  const continueScreen = requireElement<HTMLButtonElement>('continue-screen');
  const retry = requireElement<HTMLButtonElement>('retry');
  const modeStatus = requireElement<HTMLElement>('mode-status');

  enterVR.addEventListener('click', callbacks.onEnterVR);
  continueScreen.addEventListener('click', callbacks.onContinueOnScreen);
  retry.addEventListener('click', callbacks.onRetry);

  return {
    render: (state) => {
      const running = state.status === 'running';
      panel.hidden = running;
      modeStatus.hidden = !running;
      message.textContent = state.message;
      enterVR.hidden = state.immersiveVRSupported !== true;
      enterVR.disabled = state.status !== 'ready';
      continueScreen.disabled = ![
        'ready',
        'vr-unavailable',
        'recoverable-error',
      ].includes(state.status);
      retry.hidden = state.status !== 'recoverable-error';
      supportNote.textContent =
        state.immersiveVRSupported === false
          ? 'Immersive VR is unavailable. The same tutorial remains available on screen.'
          : '';
      modeStatus.textContent =
        state.mode === 'immersive-vr'
          ? 'Immersive VR · Phase 0 graybox'
          : 'Desktop · Phase 0 graybox';
    },
  };
}
