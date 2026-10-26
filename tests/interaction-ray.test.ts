import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { transformInteractionRay } from '../src/input/transformInteractionRay';

describe('interaction ray transforms', () => {
  it('moves and rotates an XR reference-space ray into the player world', () => {
    const matrix = new THREE.Matrix4().compose(
      new THREE.Vector3(3, 0, 8),
      new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        Math.PI / 2,
      ),
      new THREE.Vector3(1, 1, 1),
    );
    const transformed = transformInteractionRay(
      {
        origin: { x: 1, y: 1.5, z: 0 },
        direction: { x: 0, y: 0, z: -1 },
      },
      matrix,
    );

    expect(transformed.origin.x).toBeCloseTo(3);
    expect(transformed.origin.y).toBeCloseTo(1.5);
    expect(transformed.origin.z).toBeCloseTo(7);
    expect(transformed.direction.x).toBeCloseTo(-1);
    expect(transformed.direction.z).toBeCloseTo(0);
  });
});
