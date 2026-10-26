import * as THREE from 'three';
import {
  createGrayboxEnvironment,
  type GrayboxEnvironment,
} from './createGrayboxEnvironment';

export interface SceneRuntime {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  player: THREE.Group;
  environment: GrayboxEnvironment;
  /** 0 = clear, 1 = fully faded; used by scene transitions in both modes. */
  setFade(opacity: number): void;
  dispose(): void;
}

export function createScene(canvas: HTMLCanvasElement): SceneRuntime {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xdfe3e8);
  scene.fog = new THREE.Fog(0xdfe3e8, 10, 24);

  const camera = new THREE.PerspectiveCamera(65, 1, 0.05, 50);
  camera.position.set(0, 1.65, 0);

  const player = new THREE.Group();
  player.add(camera);

  // Head-locked veil: follows the viewer in desktop and immersive modes.
  const fadeMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0,
    depthTest: false,
    depthWrite: false,
  });
  const fadeVeil = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), fadeMaterial);
  fadeVeil.name = 'transition-fade-veil';
  fadeVeil.renderOrder = 1000;
  fadeVeil.visible = false;
  camera.add(fadeVeil);
  scene.add(player);

  const environment = createGrayboxEnvironment();
  player.position.copy(environment.anchors.spawn);
  scene.add(environment.root);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType('local-floor');

  scene.add(new THREE.HemisphereLight(0xffffff, 0x69717c, 2.1));
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
  keyLight.position.set(3, 6, 2);
  scene.add(keyLight);

  const resize = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };

  window.addEventListener('resize', resize);
  resize();

  return {
    scene,
    camera,
    renderer,
    player,
    environment,
    setFade: (opacity) => {
      fadeMaterial.opacity = THREE.MathUtils.clamp(opacity, 0, 1);
      fadeVeil.visible = fadeMaterial.opacity > 0;
    },
    dispose: () => {
      window.removeEventListener('resize', resize);
      renderer.dispose();
    },
  };
}
