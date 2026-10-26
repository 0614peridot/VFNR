import * as THREE from 'three';
import type { InteractionRay } from './SemanticAction';

export function transformInteractionRay(
  ray: InteractionRay,
  matrix: THREE.Matrix4,
): InteractionRay {
  const origin = new THREE.Vector3(
    ray.origin.x,
    ray.origin.y,
    ray.origin.z,
  ).applyMatrix4(matrix);
  const direction = new THREE.Vector3(
    ray.direction.x,
    ray.direction.y,
    ray.direction.z,
  ).transformDirection(matrix);
  return { origin, direction };
}
