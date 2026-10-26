import * as THREE from 'three';

export interface GrayboxBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface GrayboxAnchors {
  spawn: THREE.Vector3;
  movementGoal: THREE.Vector3;
  turnGoal: THREE.Vector3;
  doorway: THREE.Vector3;
  teleportTargets: readonly THREE.Vector3[];
  objectPedestal: THREE.Vector3;
  /** Provisional experiment placeholder arrival point, outside the tutorial bounds. */
  experiment: THREE.Vector3;
}

export interface GrayboxEnvironment {
  root: THREE.Group;
  anchors: GrayboxAnchors;
  bounds: GrayboxBounds;
  colliders: readonly THREE.Object3D[];
  teleportTargets: readonly THREE.Mesh[];
  doorHinge: THREE.Group;
  door: THREE.Mesh;
  grabbable: THREE.Mesh;
  experimentEntrance: THREE.Mesh;
  experimentRoom: THREE.Group;
  returnToLoungeButton: THREE.Mesh;
}

const FLOOR_Y = 0;

function createBox(
  name: string,
  size: readonly [number, number, number],
  position: readonly [number, number, number],
  material: THREE.Material,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createFloorMarker(
  name: string,
  position: THREE.Vector3,
  radius: number,
  color: number,
): THREE.Mesh {
  const marker = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 0.035, 32),
    new THREE.MeshStandardMaterial({ color, roughness: 0.8 }),
  );
  marker.name = name;
  marker.position.copy(position).setY(0.02);
  marker.receiveShadow = true;
  return marker;
}

export function createGrayboxEnvironment(): GrayboxEnvironment {
  const root = new THREE.Group();
  root.name = 'graybox-environment';

  const bounds: GrayboxBounds = {
    minX: -6,
    maxX: 6,
    minZ: -12,
    maxZ: 10,
  };
  const anchors: GrayboxAnchors = {
    spawn: new THREE.Vector3(0, FLOOR_Y, 8),
    movementGoal: new THREE.Vector3(0, FLOOR_Y, 2.5),
    turnGoal: new THREE.Vector3(3, FLOOR_Y, -1.5),
    doorway: new THREE.Vector3(3, FLOOR_Y, -5),
    teleportTargets: [
      new THREE.Vector3(3, FLOOR_Y, -8),
      new THREE.Vector3(0, FLOOR_Y, -10),
      new THREE.Vector3(-3, FLOOR_Y, -8),
    ],
    objectPedestal: new THREE.Vector3(-3, FLOOR_Y, -5.5),
    experiment: new THREE.Vector3(0, FLOOR_Y, -40),
  };

  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0xb8bcc2,
    roughness: 0.95,
  });
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x727983,
    roughness: 0.9,
  });
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: 0x8f969f,
    roughness: 0.85,
  });

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ),
    floorMaterial,
  );
  ground.name = 'walkable-floor';
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, FLOOR_Y, -1);
  ground.receiveShadow = true;
  root.add(ground);

  const grid = new THREE.GridHelper(22, 22, 0x5f6670, 0x9298a1);
  grid.name = 'floor-grid';
  grid.position.set(0, 0.002, -1);
  root.add(grid);

  root.add(
    createFloorMarker('spawn-zone', anchors.spawn, 0.75, 0x66707a),
    createFloorMarker('movement-goal', anchors.movementGoal, 0.65, 0x3d8985),
    createFloorMarker('turn-goal', anchors.turnGoal, 0.65, 0x3d8985),
  );

  const teleportTargets = anchors.teleportTargets.map((position, index) => {
    const target = createFloorMarker(
      `teleport-target-${index + 1}`,
      position,
      0.72,
      0x2d7d7a,
    );
    target.userData.interaction = 'teleport-target';
    target.userData.destinationId = target.name;
    target.userData.label = `Pad ${index + 1}`;
    root.add(target);
    return target;
  });

  const colliders: THREE.Object3D[] = [];
  const addCollider = (collider: THREE.Mesh): void => {
    colliders.push(collider);
    root.add(collider);
  };

  addCollider(createBox('boundary-left', [0.25, 2.25, 22], [-6, 1.125, -1], wallMaterial));
  addCollider(createBox('boundary-right', [0.25, 2.25, 22], [6, 1.125, -1], wallMaterial));
  addCollider(createBox('boundary-back', [12, 2.25, 0.25], [0, 1.125, 10], wallMaterial));
  addCollider(createBox('boundary-front', [12, 2.25, 0.25], [0, 1.125, -12], wallMaterial));

  addCollider(createBox('turn-partition-left', [7.5, 2.25, 0.3], [-2.25, 1.125, 0], wallMaterial));
  addCollider(createBox('turn-partition-right', [1.5, 2.25, 0.3], [5.25, 1.125, 0], wallMaterial));

  addCollider(createBox('door-frame-left', [0.25, 2.5, 0.35], [1.9, 1.25, -5], accentMaterial));
  addCollider(createBox('door-frame-right', [0.25, 2.5, 0.35], [4.1, 1.25, -5], accentMaterial));
  addCollider(createBox('door-frame-top', [2.45, 0.2, 0.35], [3, 2.4, -5], accentMaterial));

  const doorHinge = new THREE.Group();
  doorHinge.name = 'tutorial-door-hinge';
  doorHinge.position.set(4, 0, -5);
  doorHinge.rotation.y = 0;
  doorHinge.userData.interaction = 'door';

  const door = createBox(
    'tutorial-door',
    [1.9, 2.25, 0.12],
    [-0.95, 1.125, 0],
    new THREE.MeshStandardMaterial({
      color: 0x9aa1a9,
      roughness: 0.8,
    }),
  );
  doorHinge.add(door);
  root.add(doorHinge);

  const pedestal = createBox(
    'object-pedestal',
    [0.8, 0.8, 0.8],
    [anchors.objectPedestal.x, 0.4, anchors.objectPedestal.z],
    accentMaterial,
  );
  root.add(pedestal);

  const grabbable = createBox(
    'grabbable-cube',
    [0.38, 0.38, 0.38],
    [anchors.objectPedestal.x, 1, anchors.objectPedestal.z],
    new THREE.MeshStandardMaterial({ color: 0xc98236, roughness: 0.7 }),
  );
  grabbable.userData.interaction = 'grabbable';
  root.add(grabbable);

  const experimentEntrance = createBox(
    'experiment-entrance',
    [1.6, 2.1, 0.08],
    [0, 1.05, -11.82],
    new THREE.MeshStandardMaterial({ color: 0x3b5b8c, roughness: 0.6 }),
  );
  experimentEntrance.userData.interaction = 'experiment-entrance';
  root.add(experimentEntrance);

  // Scoped stand-in for the experiment; it is not part of the tutorial bounds.
  const experimentRoom = new THREE.Group();
  experimentRoom.name = 'experiment-placeholder';
  const experimentFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 6),
    new THREE.MeshStandardMaterial({ color: 0x9fa9b8, roughness: 0.95 }),
  );
  experimentFloor.name = 'experiment-floor';
  experimentFloor.rotation.x = -Math.PI / 2;
  experimentFloor.position.set(anchors.experiment.x, FLOOR_Y, anchors.experiment.z - 1);
  experimentFloor.receiveShadow = true;
  experimentRoom.add(
    experimentFloor,
    createBox(
      'experiment-backdrop',
      [6, 2.5, 0.2],
      [anchors.experiment.x, 1.25, anchors.experiment.z - 4],
      wallMaterial,
    ),
  );
  const returnToLoungeButton = createBox(
    'return-to-lounge',
    [1.2, 0.6, 0.1],
    [anchors.experiment.x, 1.3, anchors.experiment.z - 3],
    new THREE.MeshStandardMaterial({ color: 0x3d8985, roughness: 0.6 }),
  );
  returnToLoungeButton.userData.interaction = 'return-to-lounge';
  experimentRoom.add(returnToLoungeButton);
  root.add(experimentRoom);

  return {
    root,
    anchors,
    bounds,
    colliders,
    teleportTargets,
    doorHinge,
    door,
    grabbable,
    experimentEntrance,
    experimentRoom,
    returnToLoungeButton,
  };
}
