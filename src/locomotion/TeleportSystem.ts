import * as THREE from 'three';
import type { InteractionRay } from '../input/SemanticAction';
import type { InteractionEventBus } from '../interactions/InteractionEventBus';
import type { GrayboxEnvironment } from '../scene/createGrayboxEnvironment';
import type { LocomotionSystem } from './LocomotionSystem';

function createMarker(): THREE.Mesh {
  const marker = new THREE.Mesh(
    new THREE.RingGeometry(0.42, 0.54, 32),
    new THREE.MeshBasicMaterial({
      color: 0xffd166,
      side: THREE.DoubleSide,
      depthTest: false,
    }),
  );
  marker.name = 'teleport-aim-marker';
  marker.rotation.x = -Math.PI / 2;
  marker.position.y = 0.04;
  marker.visible = false;
  marker.renderOrder = 10;
  return marker;
}

export class TeleportSystem {
  private active = false;
  private candidate: THREE.Mesh | null = null;
  private enabled = false;
  readonly marker = createMarker();

  constructor(
    private readonly environment: GrayboxEnvironment,
    private readonly locomotion: LocomotionSystem,
    private readonly events: InteractionEventBus,
  ) {
    environment.root.add(this.marker);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.reset();
    }
  }

  start(ray: InteractionRay): void {
    if (!this.enabled) {
      return;
    }
    if (!this.active) {
      this.active = true;
      this.events.emit({ type: 'teleportStarted' });
    }
    this.updateAim(ray);
  }

  updateAim(ray: InteractionRay): void {
    if (!this.enabled || !this.active) {
      return;
    }
    this.environment.root.updateWorldMatrix(true, true);
    const raycaster = new THREE.Raycaster(
      new THREE.Vector3(ray.origin.x, ray.origin.y, ray.origin.z),
      new THREE.Vector3(ray.direction.x, ray.direction.y, ray.direction.z).normalize(),
      0,
      30,
    );
    const hit = raycaster.intersectObjects(
      [...this.environment.teleportTargets],
      false,
    )[0];
    this.candidate = hit?.object instanceof THREE.Mesh ? hit.object : null;
    this.marker.visible = this.candidate !== null;
    if (this.candidate) {
      this.marker.position.set(
        this.candidate.position.x,
        0.04,
        this.candidate.position.z,
      );
    }
  }

  complete(): boolean {
    if (!this.enabled || !this.active || !this.candidate) {
      if (this.active) {
        this.events.emit({ type: 'teleportInvalid' });
      }
      this.reset();
      return false;
    }
    const destinationId = String(this.candidate.userData.destinationId);
    const target = this.candidate.position.clone().setY(0);
    const completed = this.locomotion.teleportViewerTo(target);
    this.events.emit(
      completed
        ? { type: 'teleportCompleted', destinationId }
        : { type: 'teleportInvalid' },
    );
    this.reset();
    return completed;
  }

  chooseDestination(destinationId: string): boolean {
    if (!this.enabled) {
      return false;
    }
    const destination = this.environment.teleportTargets.find(
      (target) => target.userData.destinationId === destinationId,
    );
    if (!destination) {
      this.events.emit({ type: 'teleportInvalid' });
      return false;
    }
    const completed = this.locomotion.teleportViewerTo(destination.position.clone().setY(0));
    this.events.emit(
      completed
        ? { type: 'teleportCompleted', destinationId }
        : { type: 'teleportInvalid' },
    );
    return completed;
  }

  cancel(emitEvent = true): void {
    if (this.active && emitEvent) {
      this.events.emit({ type: 'teleportCancelled' });
    }
    this.reset();
  }

  get isActive(): boolean {
    return this.active;
  }

  private reset(): void {
    this.active = false;
    this.candidate = null;
    this.marker.visible = false;
  }
}
