import * as THREE from 'three';
import type { GrayboxEnvironment } from '../scene/createGrayboxEnvironment';

export const PLAYER_RADIUS = 0.28;

function circleIntersectsBox(
  position: THREE.Vector3,
  radius: number,
  box: THREE.Box3,
): boolean {
  const closestX = THREE.MathUtils.clamp(position.x, box.min.x, box.max.x);
  const closestZ = THREE.MathUtils.clamp(position.z, box.min.z, box.max.z);
  const dx = position.x - closestX;
  const dz = position.z - closestZ;
  return dx * dx + dz * dz < radius * radius;
}

export class CollisionWorld {
  constructor(private readonly environment: GrayboxEnvironment) {}

  isWalkable(position: THREE.Vector3, radius = PLAYER_RADIUS): boolean {
    const { bounds } = this.environment;
    if (
      position.x - radius < bounds.minX ||
      position.x + radius > bounds.maxX ||
      position.z - radius < bounds.minZ ||
      position.z + radius > bounds.maxZ
    ) {
      return false;
    }

    this.environment.root.updateWorldMatrix(true, true);
    const obstacles = [...this.environment.colliders];
    const doorIsClosed = this.environment.doorHinge.rotation.y > -Math.PI / 3;
    if (doorIsClosed) {
      obstacles.push(this.environment.door);
    }

    return !obstacles.some((object) =>
      circleIntersectsBox(position, radius, new THREE.Box3().setFromObject(object)),
    );
  }

  resolveMovement(
    viewerPosition: THREE.Vector3,
    desiredDelta: THREE.Vector3,
    radius = PLAYER_RADIUS,
  ): THREE.Vector3 {
    const resolved = new THREE.Vector3();
    const xCandidate = viewerPosition.clone().add(
      new THREE.Vector3(desiredDelta.x, 0, 0),
    );
    if (this.isWalkable(xCandidate, radius)) {
      resolved.x = desiredDelta.x;
    }

    const zCandidate = viewerPosition.clone().add(resolved).add(
      new THREE.Vector3(0, 0, desiredDelta.z),
    );
    if (this.isWalkable(zCandidate, radius)) {
      resolved.z = desiredDelta.z;
    }
    return resolved;
  }
}
