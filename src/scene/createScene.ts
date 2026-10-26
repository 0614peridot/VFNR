import * as THREE from 'three';

export interface SceneRuntime {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  player: THREE.Group;
  dispose(): void;
}

function addGraybox(scene: THREE.Scene): void {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 16),
    new THREE.MeshStandardMaterial({ color: 0xb8bcc2, roughness: 0.95 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const grid = new THREE.GridHelper(16, 16, 0x5f6670, 0x9298a1);
  grid.position.y = 0.002;
  scene.add(grid);

  const markerMaterial = new THREE.MeshStandardMaterial({ color: 0x2d7d7a });
  const markers: ReadonlyArray<readonly [number, number]> = [
    [0, -2],
    [2, -4],
    [-2, -6],
  ];

  markers.forEach(([x, z]) => {
    const marker = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.035, 32),
      markerMaterial,
    );
    marker.position.set(x, 0.02, z);
    scene.add(marker);
  });

  const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x626871 });
  const frameParts: ReadonlyArray<readonly [number, number, number, number, number]> = [
    [-1.1, 1.25, -7, 0.25, 2.5],
    [1.1, 1.25, -7, 0.25, 2.5],
    [0, 2.4, -7, 2.45, 0.2],
  ];

  frameParts.forEach(([x, y, z, width, height]) => {
    const part = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, 0.3),
      frameMaterial,
    );
    part.position.set(x, y, z);
    scene.add(part);
  });

  const grabbable = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.35, 0.35),
    new THREE.MeshStandardMaterial({ color: 0xd08b3e }),
  );
  grabbable.position.set(-1.5, 0.3, -3.5);
  scene.add(grabbable);
}

export function createScene(canvas: HTMLCanvasElement): SceneRuntime {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xdfe3e8);
  scene.fog = new THREE.Fog(0xdfe3e8, 10, 24);

  const camera = new THREE.PerspectiveCamera(65, 1, 0.05, 50);
  camera.position.set(0, 1.65, 3);

  const player = new THREE.Group();
  player.add(camera);
  scene.add(player);

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

  addGraybox(scene);

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
    dispose: () => {
      window.removeEventListener('resize', resize);
      renderer.dispose();
    },
  };
}
