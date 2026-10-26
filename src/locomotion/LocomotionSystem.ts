import * as THREE from 'three';
import type { InteractionEventBus } from '../interactions/InteractionEventBus';
import { CollisionWorld } from './CollisionWorld';

const MOVE_SPEED_METERS_PER_SECOND = 1.7;
const MAX_DELTA_SECONDS = 0.05;

export class LocomotionSystem {
  private readonly moveAxes = new THREE.Vector2();
  private enabled = false;

  constructor(
    private readonly player: THREE.Group,
    private readonly getCamera: () => THREE.Camera,
    private readonly collisionWorld: CollisionWorld,
    private readonly events: InteractionEventBus,
  ) {}

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.moveAxes.set(0, 0);
    }
  }

  setMove(x: number, z: number): void {
    if (!this.enabled) {
      return;
    }
    this.moveAxes.set(
      THREE.MathUtils.clamp(x, -1, 1),
      THREE.MathUtils.clamp(z, -1, 1),
    );
    if (this.moveAxes.lengthSq() > 1) {
      this.moveAxes.normalize();
    }
  }

  update(deltaSeconds: number): void {
    if (!this.enabled || this.moveAxes.lengthSq() === 0) {
      return;
    }

    const forward = this.getCamera().getWorldDirection(new THREE.Vector3());
    forward.y = 0;
    if (forward.lengthSq() < 0.0001) {
      return;
    }
    forward.normalize();
    const right = new THREE.Vector3(-forward.z, 0, forward.x);
    const distance = MOVE_SPEED_METERS_PER_SECOND * Math.min(deltaSeconds, MAX_DELTA_SECONDS);
    const desired = right
      .multiplyScalar(this.moveAxes.x)
      .add(forward.multiplyScalar(-this.moveAxes.y))
      .multiplyScalar(distance);

    const viewer = this.getViewerPosition();
    const resolved = this.collisionWorld.resolveMovement(viewer, desired);
    if (resolved.lengthSq() === 0) {
      return;
    }
    this.player.position.add(resolved);
    this.events.emit({ type: 'moved', distance: resolved.length() });
  }

  turn(radians: number): void {
    if (!this.enabled || !Number.isFinite(radians) || radians === 0) {
      return;
    }
    this.rotateAroundViewer(radians);
    this.events.emit({ type: 'turned', radians });
  }

  /**
   * Moves the viewer to a scripted location and yaw without collision checks,
   * for scene transitions such as entering the experiment or returning to the lounge.
   */
  placeViewerAt(target: THREE.Vector3, yaw: number): void {
    this.moveAxes.set(0, 0);
    this.rotateAroundViewer(yaw - this.getViewerYaw());
    const viewer = this.getViewerPosition();
    this.player.position.x += target.x - viewer.x;
    this.player.position.z += target.z - viewer.z;
    this.player.updateWorldMatrix(true, true);
  }

  /** Viewer heading around +Y; 0 faces -Z. */
  getViewerYaw(): number {
    this.player.updateWorldMatrix(true, true);
    const forward = this.getCamera().getWorldDirection(new THREE.Vector3());
    return Math.atan2(-forward.x, -forward.z);
  }

  teleportViewerTo(target: THREE.Vector3): boolean {
    if (!this.enabled || !this.collisionWorld.isWalkable(target)) {
      return false;
    }
    const viewer = this.getViewerPosition();
    this.player.position.x += target.x - viewer.x;
    this.player.position.z += target.z - viewer.z;
    return true;
  }

  getViewerPosition(): THREE.Vector3 {
    this.player.updateWorldMatrix(true, true);
    return this.getCamera().getWorldPosition(new THREE.Vector3()).setY(0);
  }

  private rotateAroundViewer(radians: number): void {
    const before = this.getViewerPosition();
    this.player.rotation.y += radians;
    this.player.updateWorldMatrix(true, true);
    const after = this.getViewerPosition();
    this.player.position.x += before.x - after.x;
    this.player.position.z += before.z - after.z;
  }
}
