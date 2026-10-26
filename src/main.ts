import './styles.css';
import { createAppStore } from './app/AppState';
import { detectImmersiveVRSupport } from './app/XRSupport';
import { createScene, type SceneRuntime } from './scene/createScene';
import { createEntryUI } from './ui/createEntryUI';

const canvas = document.querySelector<HTMLCanvasElement>('#experience');

if (!canvas) {
  throw new Error('The Three.js canvas was not found.');
}

const store = createAppStore();
let runtime: SceneRuntime | null = null;

async function checkXRSupport(): Promise<void> {
  store.setState({
    status: 'loading',
    message: 'Checking immersive VR support…',
  });

  const capability = await detectImmersiveVRSupport();
  store.setState({
    immersiveVRSupported: capability.supported,
    status: capability.supported ? 'ready' : 'vr-unavailable',
    message: capability.supported
      ? 'Choose how to enter the tutorial prototype.'
      : (capability.reason ?? 'Continue with the desktop experience.'),
  });
}

async function enterVR(): Promise<void> {
  if (!navigator.xr || !runtime) {
    store.setState({
      status: runtime ? 'vr-unavailable' : 'recoverable-error',
      immersiveVRSupported: runtime ? false : null,
      message: runtime
        ? 'WebXR is unavailable. Continue on screen instead.'
        : 'The 3D scene is not ready. Retry the experience setup.',
    });
    return;
  }

  store.setState({ status: 'entering-vr', message: 'Starting immersive VR…' });

  try {
    const session = await navigator.xr.requestSession('immersive-vr', {
      requiredFeatures: ['local-floor'],
      optionalFeatures: ['bounded-floor'],
    });
    session.addEventListener('end', () => {
      store.setState({
        mode: 'undecided',
        status: 'ready',
        message: 'The VR session ended. Re-enter VR or continue on screen.',
      });
    });
    await runtime.renderer.xr.setSession(session);
    store.setState({
      mode: 'immersive-vr',
      status: 'running',
      message: 'Immersive VR is active.',
    });
  } catch {
    store.setState({
      mode: 'undecided',
      status: 'recoverable-error',
      message: 'The VR session could not start. Retry or continue on screen.',
    });
  }
}

const ui = createEntryUI({
  onContinueOnScreen: () => {
    store.setState({
      mode: 'screen',
      status: 'running',
      message: 'Desktop mode is active.',
    });
  },
  onEnterVR: () => void enterVR(),
  onRetry: () => bootstrap(),
});

store.subscribe(ui.render);

function bootstrap(): void {
  try {
    if (!runtime) {
      runtime = createScene(canvas);
      runtime.renderer.setAnimationLoop(() => {
        if (runtime) {
          runtime.renderer.render(runtime.scene, runtime.camera);
        }
      });
    }

    void checkXRSupport();
  } catch {
    runtime = null;
    store.setState({
      status: 'recoverable-error',
      message: 'The 3D scene could not start. Check browser graphics support and retry.',
    });
  }
}

bootstrap();
