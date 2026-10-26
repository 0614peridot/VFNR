import { describe, expect, it } from 'vitest';
import { createGrayboxEnvironment } from '../src/scene/createGrayboxEnvironment';

describe('graybox environment', () => {
  it('provides stable anchors in tutorial order inside the environment bounds', () => {
    const environment = createGrayboxEnvironment();
    const orderedAnchors = [
      environment.anchors.spawn,
      environment.anchors.movementGoal,
      environment.anchors.turnGoal,
      environment.anchors.doorway,
      ...environment.anchors.teleportTargets,
      environment.anchors.objectPedestal,
    ];

    orderedAnchors.forEach((anchor) => {
      expect(anchor.x).toBeGreaterThan(environment.bounds.minX);
      expect(anchor.x).toBeLessThan(environment.bounds.maxX);
      expect(anchor.z).toBeGreaterThan(environment.bounds.minZ);
      expect(anchor.z).toBeLessThan(environment.bounds.maxZ);
    });

    expect(environment.anchors.spawn.z).toBeGreaterThan(
      environment.anchors.movementGoal.z,
    );
    expect(environment.anchors.movementGoal.z).toBeGreaterThan(
      environment.anchors.turnGoal.z,
    );
    expect(environment.anchors.turnGoal.z).toBeGreaterThan(
      environment.anchors.doorway.z,
    );
  });

  it('exposes named collision and interaction targets for later phases', () => {
    const environment = createGrayboxEnvironment();
    const colliderNames = environment.colliders.map((collider) => collider.name);

    expect(environment.root.name).toBe('graybox-environment');
    expect(colliderNames).toEqual(
      expect.arrayContaining([
        'boundary-left',
        'boundary-right',
        'turn-partition-left',
        'door-frame-left',
      ]),
    );
    expect(environment.grabbable.name).toBe('grabbable-cube');
    expect(environment.grabbable.userData.interaction).toBe('grabbable');
    expect(environment.doorHinge.name).toBe('tutorial-door-hinge');
    expect(environment.doorHinge.userData.interaction).toBe('door');
    expect(environment.door.parent).toBe(environment.doorHinge);
    expect(environment.door.position.x).toBeLessThan(0);
    expect(environment.doorHinge.rotation.y).toBe(0);
    expect(
      environment.teleportTargets.every(
        (target) => target.userData.interaction === 'teleport-target',
      ),
    ).toBe(true);
    expect(environment.anchors.teleportTargets).toHaveLength(3);
  });
});
