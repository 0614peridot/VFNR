import * as THREE from 'three';
import type { InteractionRay } from '../input/SemanticAction';
import type { LocomotionSystem } from '../locomotion/LocomotionSystem';
import type { GrayboxEnvironment } from '../scene/createGrayboxEnvironment';
import type { InteractionEventBus } from './InteractionEventBus';

export type ExperimentPhase = 'tutorial' | 'entering' | 'experiment' | 'returning';

/** Seconds for each half of the fade-out / fade-in transition placeholder. */
export const TRANSITION_HALF_SECONDS = 0.35;
const MAX_SELECT_DISTANCE = 4;
/** Facing toward -Z, the direction of the tutorial course from the lounge. */
const STABLE_YAW = 0;

function hits(ray: InteractionRay, object: THREE.Object3D): boolean {
  object.updateWorldMatrix(true, false);
  return new THREE.Raycaster(
    new THREE.Vector3(ray.origin.x, ray.origin.y, ray.origin.z),
    new THREE.Vector3(ray.direction.x, ray.direction.y, ray.direction.z).normalize(),
    0,
    MAX_SELECT_DISTANCE,
  ).intersectObject(object, false).length > 0;
}

export class ExperimentSystem {
  private currentPhase: ExperimentPhase = 'tutorial';
  private elapsed = 0;
  private swapped = false;

  constructor(
    private readonly environment: GrayboxEnvironment,
    private readonly locomotion: LocomotionSystem,
    private readonly events: InteractionEventBus,
    private readonly setFade: (opacity: number) => void = () => {},
  ) {}

  selectEntrance(ray: InteractionRay): boolean {
    return this.currentPhase === 'tutorial' &&
      hits(ray, this.environment.experimentEntrance) &&
      this.enter();
  }

  selectReturn(ray: InteractionRay): boolean {
    return this.currentPhase === 'experiment' &&
      hits(ray, this.environment.returnToLoungeButton) &&
      this.returnToLounge();
  }

  enter(): boolean {
    if (this.currentPhase !== 'tutorial') {
      return false;
    }
    this.begin('entering');
    this.events.emit({ type: 'transitionStarted', destination: 'experiment' });
    return true;
  }

  returnToLounge(): boolean {
    if (this.currentPhase !== 'experiment') {
      return false;
    }
    this.begin('returning');
    this.events.emit({ type: 'transitionStarted', destination: 'lounge' });
    return true;
  }

  update(deltaSeconds: number): void {
    if (!this.isTransitioning) {
      return;
    }
    this.elapsed += deltaSeconds;
    if (this.elapsed < TRANSITION_HALF_SECONDS) {
      this.setFade(this.elapsed / TRANSITION_HALF_SECONDS);
      return;
    }
    if (!this.swapped) {
      this.swap();
    }
    const fadeIn = (this.elapsed - TRANSITION_HALF_SECONDS) / TRANSITION_HALF_SECONDS;
    if (fadeIn < 1) {
      this.setFade(1 - fadeIn);
      return;
    }
    this.finish();
  }

  /** Completes an in-flight transition immediately, e.g. when input is suspended. */
  settle(): void {
    if (!this.isTransitioning) {
      return;
    }
    if (!this.swapped) {
      this.swap();
    }
    this.finish();
  }

  get phase(): ExperimentPhase {
    return this.currentPhase;
  }

  get isTransitioning(): boolean {
    return this.currentPhase === 'entering' || this.currentPhase === 'returning';
  }

  private begin(phase: 'entering' | 'returning'): void {
    this.currentPhase = phase;
    this.elapsed = 0;
    this.swapped = false;
  }

  private swap(): void {
    const target = this.currentPhase === 'entering'
      ? this.environment.anchors.experiment
      : this.environment.anchors.spawn;
    this.locomotion.placeViewerAt(target, STABLE_YAW);
    this.swapped = true;
  }

  private finish(): void {
    const entered = this.currentPhase === 'entering';
    this.currentPhase = entered ? 'experiment' : 'tutorial';
    this.setFade(0);
    this.events.emit({ type: entered ? 'experimentEntered' : 'loungeReturned' });
  }
}
