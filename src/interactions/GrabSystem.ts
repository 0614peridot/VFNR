import * as THREE from 'three';
import type {
  InputSourceId,
  InteractionRay,
} from '../input/SemanticAction';
import type { GrayboxEnvironment } from '../scene/createGrayboxEnvironment';
import type { InteractionEventBus } from './InteractionEventBus';

const MAX_GRAB_DISTANCE = 2.25;

export class GrabSystem {
  private heldBy: InputSourceId | null = null;

  constructor(
    private readonly environment: GrayboxEnvironment,
    private readonly anchors: ReadonlyMap<InputSourceId, THREE.Object3D>,
    private readonly events: InteractionEventBus,
  ) {}

  grab(source: InputSourceId, ray: InteractionRay): boolean {
    if (this.heldBy) {
      if (this.heldBy === source) {
        this.drop(source);
      }
      return false;
    }
    const anchor = this.anchors.get(source);
    if (!anchor) {
      return false;
    }
    this.environment.root.updateWorldMatrix(true, true);
    const hit = new THREE.Raycaster(
      new THREE.Vector3(ray.origin.x, ray.origin.y, ray.origin.z),
      new THREE.Vector3(ray.direction.x, ray.direction.y, ray.direction.z).normalize(),
      0,
      MAX_GRAB_DISTANCE,
    ).intersectObject(this.environment.grabbable, false)[0];
    if (!hit) {
      return false;
    }
    anchor.add(this.environment.grabbable);
    this.environment.grabbable.position.set(0, 0, -0.22);
    this.environment.grabbable.rotation.set(0, 0, 0);
    this.heldBy = source;
    this.events.emit({
      type: 'objectGrabbed',
      objectId: this.environment.grabbable.name,
    });
    return true;
  }

  drop(source: InputSourceId): boolean {
    if (this.heldBy !== source) {
      return false;
    }
    this.environment.root.attach(this.environment.grabbable);
    const halfHeight = 0.19;
    this.environment.grabbable.position.y = Math.max(
      halfHeight,
      this.environment.grabbable.position.y,
    );
    this.heldBy = null;
    this.events.emit({
      type: 'objectDropped',
      objectId: this.environment.grabbable.name,
    });
    return true;
  }

  get holder(): InputSourceId | null {
    return this.heldBy;
  }
}
