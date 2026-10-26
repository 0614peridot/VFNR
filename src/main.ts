import './styles.css';
import * as THREE from 'three';
import { createAppStore } from './app/AppState';
import {
  createInteractionRuntime,
  type InteractionRuntime,
} from './app/InteractionRuntime';
import { detectImmersiveVRSupport } from './app/XRSupport';
import { createActionBus } from './input/ActionBus';
import {
  createDesktopInputAdapter,
  type DesktopInputAdapter,
} from './input/DesktopInputAdapter';
import type { InputSourceId, InteractionRay } from './input/SemanticAction';
import {
  createWebXRInputAdapter,
  type WebXRInputAdapter,
} from './input/WebXRInputAdapter';
import { transformInteractionRay } from './input/transformInteractionRay';
import { createScene, type SceneRuntime } from './scene/createScene';
import { createMapDestinations } from './interactions/MapLayout';
import { createDesktopMenuUI, type DesktopMenuUI } from './ui/createDesktopMenuUI';
import { createEntryUI } from './ui/createEntryUI';
import { createWristMenuPanel, type WristMenuPanel } from './ui/createWristMenuPanel';

const canvas = document.querySelector<HTMLCanvasElement>('#experience');

if (!canvas) {
  throw new Error('The Three.js canvas was not found.');
}

const experienceCanvas = canvas;

const store = createAppStore();
const actionBus = createActionBus();
let runtime: SceneRuntime | null = null;
let interactions: InteractionRuntime | null = null;
let desktopInput: DesktopInputAdapter | null = null;
let webXRInput: WebXRInputAdapter | null = null;
let wristMenu: WristMenuPanel | null = null;
let desktopMenu: DesktopMenuUI | null = null;
const controllerAnchors = new Map<InputSourceId, THREE.Object3D>();
let xrCheckAttempt = 0;
let previousFrameTime: number | null = null;

function createCameraRay(
  camera: THREE.Camera,
  clientX: number,
  clientY: number,
): InteractionRay {
  const bounds = experienceCanvas.getBoundingClientRect();
  const pointer = new THREE.Vector2(
    ((clientX - bounds.left) / bounds.width) * 2 - 1,
    -((clientY - bounds.top) / bounds.height) * 2 + 1,
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(pointer, camera);
  return {
    origin: raycaster.ray.origin.clone(),
    direction: raycaster.ray.direction.clone(),
  };
}

function transformRayByObject(
  ray: InteractionRay,
  object: THREE.Object3D,
): InteractionRay {
  object.updateWorldMatrix(true, false);
  return transformInteractionRay(ray, object.matrixWorld);
}

function createControllerRay(): THREE.Line {
  const ray = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -3),
    ]),
    new THREE.LineBasicMaterial({ color: 0xe6ebef, transparent: true, opacity: 0.6 }),
  );
  ray.name = 'controller-pointer-ray';
  return ray;
}

function configureControllerAnchors(
  sceneRuntime: SceneRuntime,
  anchors: Map<InputSourceId, THREE.Object3D>,
): void {
  for (let index = 0; index < 2; index += 1) {
    const controller = sceneRuntime.renderer.xr.getController(index);
    controller.name = `xr-controller-${index}`;
    controller.add(createControllerRay());
    controller.addEventListener('connected', (event) => {
      const inputSource = event.data;
      if (inputSource.handedness === 'left') {
        anchors.set('left-controller', controller);
      } else if (inputSource.handedness === 'right') {
        anchors.set('right-controller', controller);
      }
    });
    controller.addEventListener('disconnected', () => {
      if (anchors.get('left-controller') === controller) {
        anchors.delete('left-controller');
      }
      if (anchors.get('right-controller') === controller) {
        anchors.delete('right-controller');
      }
    });
    sceneRuntime.player.add(controller);
  }
}

function syncInputState(): void {
  const state = store.getState();
  const running = state.status === 'running';
  interactions?.setEnabled(running);
  desktopInput?.setEnabled(running && state.mode === 'screen');
  renderMenus();
}

function renderMenus(): void {
  const state = store.getState();
  const view = interactions?.menu.view ?? 'closed';
  wristMenu?.render(view);
  desktopMenu?.render(view, state.status === 'running' && state.mode === 'screen');
}

async function checkXRSupport(): Promise<void> {
  const attempt = ++xrCheckAttempt;
  store.setState({
    status: 'loading',
    message: 'Checking immersive VR support…',
  });

  const capability = await detectImmersiveVRSupport();
  if (attempt !== xrCheckAttempt) {
    return;
  }
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

  let session: XRSession | null = null;

  try {
    session = await navigator.xr.requestSession('immersive-vr', {
      requiredFeatures: ['local-floor'],
      optionalFeatures: ['bounded-floor'],
    });
    session.addEventListener('end', () => {
      webXRInput = null;
      store.setState({
        mode: 'undecided',
        status: 'ready',
        message: 'The VR session ended. Re-enter VR or continue on screen.',
      });
    });
    await runtime.renderer.xr.setSession(session);
    webXRInput = createWebXRInputAdapter(session, actionBus, {
      transformRay: (ray) => runtime
        ? transformRayByObject(ray, runtime.player)
        : ray,
      isMenuOpen: () => interactions?.menu.isOpen ?? false,
    });
    store.setState({
      mode: 'immersive-vr',
      status: 'running',
      message: 'Immersive VR is active.',
    });
  } catch {
    if (session) {
      try {
        await session.end();
      } catch {
        // The original setup error remains the useful recovery signal.
      }
    }
    store.setState({
      mode: 'undecided',
      status: 'recoverable-error',
      message: 'The VR session could not start. Retry or continue on screen.',
    });
  }
}

const ui = createEntryUI({
  onContinueOnScreen: () => {
    if (!runtime) {
      store.setState({
        sceneReady: false,
        status: 'recoverable-error',
        message: 'The 3D scene is not ready. Retry the experience setup.',
      });
      return;
    }
    store.setState({
      mode: 'screen',
      status: 'running',
      message: 'Desktop mode is active.',
    });
  },
  onEnterVR: () => void enterVR(),
  onRetry: () => bootstrap(),
});

store.subscribe((state) => {
  ui.render(state);
  syncInputState();
});

function bootstrap(): void {
  try {
    if (!runtime) {
      runtime = createScene(experienceCanvas);
      const desktopAnchor = new THREE.Group();
      desktopAnchor.name = 'desktop-grab-anchor';
      runtime.camera.add(desktopAnchor);
      controllerAnchors.set('desktop', desktopAnchor);
      configureControllerAnchors(runtime, controllerAnchors);

      const destinations = createMapDestinations(runtime.environment);
      const panel = createWristMenuPanel(runtime.environment, destinations);
      wristMenu = panel;
      desktopMenu ??= createDesktopMenuUI(actionBus, destinations);

      interactions = createInteractionRuntime({
        actionBus,
        player: runtime.player,
        camera: runtime.camera,
        getViewerCamera: () => runtime && runtime.renderer.xr.isPresenting
          ? runtime.renderer.xr.getCamera()
          : runtime?.camera ?? new THREE.PerspectiveCamera(),
        environment: runtime.environment,
        grabAnchors: controllerAnchors,
        resolveMenuCommand: (ray) => panel.resolve(ray),
        setFade: runtime.setFade,
      });
      interactions.menu.subscribe(renderMenus);
      desktopInput = createDesktopInputAdapter({
        element: experienceCanvas,
        actionBus,
        getRay: (clientX, clientY) => {
          if (!runtime) {
            return {
              origin: { x: 0, y: 0, z: 0 },
              direction: { x: 0, y: 0, z: -1 },
            };
          }
          return createCameraRay(runtime.camera, clientX, clientY);
        },
        isHoldingObject: () => interactions?.grab.holder === 'desktop',
        isMenuOpen: () => interactions?.menu.isOpen ?? false,
      });

      store.setState({ sceneReady: true });
      runtime.renderer.setAnimationLoop((time, frame) => {
        if (runtime) {
          const deltaSeconds = previousFrameTime === null
            ? 0
            : Math.min((time - previousFrameTime) / 1000, 0.05);
          previousFrameTime = time;
          desktopInput?.update();
          const referenceSpace = runtime.renderer.xr.getReferenceSpace();
          if (frame && referenceSpace && webXRInput) {
            webXRInput.update(frame, referenceSpace);
          }
          interactions?.update(deltaSeconds);
          if (interactions) {
            wristMenu?.update(
              controllerAnchors.get('left-controller'),
              interactions.locomotion.getViewerPosition(),
              runtime.renderer.xr.isPresenting,
            );
          }
          runtime.renderer.render(runtime.scene, runtime.camera);
        }
      });
      syncInputState();
    }

    void checkXRSupport();
  } catch {
    xrCheckAttempt += 1;
    desktopInput?.dispose();
    desktopInput = null;
    webXRInput?.dispose();
    webXRInput = null;
    interactions?.dispose();
    interactions = null;
    wristMenu = null;
    controllerAnchors.clear();
    previousFrameTime = null;
    runtime = null;
    store.setState({
      sceneReady: false,
      status: 'recoverable-error',
      message: 'The 3D scene could not start. Check browser graphics support and retry.',
    });
  }
}

bootstrap();
