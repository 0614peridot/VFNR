import * as THREE from 'three';
import type { InteractionRay } from '../input/SemanticAction';
import type { GrayboxEnvironment } from '../scene/createGrayboxEnvironment';
import type { InteractionEventBus } from './InteractionEventBus';

const OPEN_ANGLE = -Math.PI / 2;
const OPEN_SPEED = Math.PI * 2.5;
const MAX_SELECT_DISTANCE = 3;

function toRay(ray: InteractionRay): THREE.Raycaster {
  return new THREE.Raycaster(
    new THREE.Vector3(ray.origin.x, ray.origin.y, ray.origin.z),
    new THREE.Vector3(ray.direction.x, ray.direction.y, ray.direction.z).normalize(),
    0,
    MAX_SELECT_DISTANCE,
  );
}

export class DoorSystem {
  private opening = false;
  private completed = false;

  constructor(
    private readonly environment: GrayboxEnvironment,
    private readonly events: InteractionEventBus,
  ) {}

  select(ray: InteractionRay): boolean {
    if (this.completed || this.opening) {
      return false;
    }
    this.environment.root.updateWorldMatrix(true, true);
    const hit = toRay(ray).intersectObject(this.environment.door, false)[0];
    if (!hit) {
      return false;
    }
    this.opening = true;
    return true;
  }

  update(deltaSeconds: number): void {
    if (!this.opening) {
      return;
    }
    const next = this.environment.doorHinge.rotation.y - OPEN_SPEED * deltaSeconds;
    this.environment.doorHinge.rotation.y = Math.max(OPEN_ANGLE, next);
    if (this.environment.doorHinge.rotation.y <= OPEN_ANGLE) {
      this.environment.doorHinge.rotation.y = OPEN_ANGLE;
      this.opening = false;
      this.completed = true;
      this.events.emit({ type: 'doorOpened' });
    }
  }

  get isOpen(): boolean {
    return this.completed;
  }
}
