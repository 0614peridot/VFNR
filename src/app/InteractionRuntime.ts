import * as THREE from 'three';
import type { ActionBus } from '../input/ActionBus';
import type {
  InputSourceId,
  InteractionRay,
  SemanticAction,
} from '../input/SemanticAction';
import { CollisionWorld } from '../locomotion/CollisionWorld';
import { LocomotionSystem } from '../locomotion/LocomotionSystem';
import { TeleportSystem } from '../locomotion/TeleportSystem';
import { DoorSystem } from '../interactions/DoorSystem';
import { ExperimentSystem } from '../interactions/ExperimentSystem';
import { GrabSystem } from '../interactions/GrabSystem';
import { MenuSystem } from '../interactions/MenuSystem';
import {
  createInteractionEventBus,
  type InteractionEventBus,
} from '../interactions/InteractionEventBus';
import type { GrayboxEnvironment } from '../scene/createGrayboxEnvironment';

/** A menu or map control resolved from a pointer ray by the active menu presentation. */
export type MenuCommand =
  | { type: 'openMenu' }
  | { type: 'closeMenu' }
  | { type: 'openMap' }
  | { type: 'chooseMapDestination'; destinationId: string };

export interface InteractionRuntimeOptions {
  actionBus: ActionBus;
  player: THREE.Group;
  camera: THREE.Camera;
  getViewerCamera?: () => THREE.Camera;
  environment: GrayboxEnvironment;
  grabAnchors: ReadonlyMap<InputSourceId, THREE.Object3D>;
  events?: InteractionEventBus;
  /** Hit-tests in-scene menu controls (VR wrist menu); screen menus emit actions directly. */
  resolveMenuCommand?: (ray: InteractionRay) => MenuCommand | null;
  setFade?: (opacity: number) => void;
}

export interface InteractionRuntime {
  readonly events: InteractionEventBus;
  readonly locomotion: LocomotionSystem;
  readonly teleport: TeleportSystem;
  readonly door: DoorSystem;
  readonly grab: GrabSystem;
  readonly menu: MenuSystem;
  readonly experiment: ExperimentSystem;
  handle(action: Readonly<SemanticAction>): void;
  update(deltaSeconds: number): void;
  setEnabled(enabled: boolean): void;
  dispose(): void;
}

export function createInteractionRuntime(
  options: InteractionRuntimeOptions,
): InteractionRuntime {
  const events = options.events ?? createInteractionEventBus();
  const locomotion = new LocomotionSystem(
    options.player,
    options.getViewerCamera ?? (() => options.camera),
    new CollisionWorld(options.environment),
    events,
  );
  const teleport = new TeleportSystem(options.environment, locomotion, events);
  const door = new DoorSystem(options.environment, events);
  const grab = new GrabSystem(options.environment, options.grabAnchors, events);
  const menu = new MenuSystem(events);
  const experiment = new ExperimentSystem(
    options.environment,
    locomotion,
    events,
    options.setFade,
  );
  let enabled = false;

  const leaveTutorialSpace = (): void => {
    locomotion.setMove(0, 0);
    teleport.cancel();
    menu.close();
    if (grab.holder) {
      grab.drop(grab.holder);
    }
  };

  const select = (source: InputSourceId, ray: InteractionRay): void => {
    if (menu.isOpen) {
      const command = options.resolveMenuCommand?.(ray);
      if (command) {
        handle({ ...command, source });
        return;
      }
    }
    if (experiment.phase === 'experiment') {
      experiment.selectReturn(ray);
      return;
    }
    if (experiment.selectEntrance(ray)) {
      leaveTutorialSpace();
      return;
    }
    door.select(ray);
  };

  const handle = (action: Readonly<SemanticAction>): void => {
    if (!enabled || experiment.isTransitioning) {
      return;
    }
    if (
      experiment.phase === 'experiment' &&
      !['turn', 'select', 'returnToLounge'].includes(action.type)
    ) {
      return;
    }
    switch (action.type) {
      case 'move':
        locomotion.setMove(action.x, action.z);
        break;
      case 'turn':
        locomotion.turn(action.radians);
        break;
      case 'select':
        select(action.source, action.ray);
        break;
      case 'startTeleport':
        teleport.start(action.ray);
        break;
      case 'updateTeleport':
        teleport.updateAim(action.ray);
        break;
      case 'completeTeleport':
        teleport.complete();
        break;
      case 'cancelTeleport':
        teleport.cancel();
        break;
      case 'grab':
        grab.grab(action.source, action.ray);
        break;
      case 'drop':
        grab.drop(action.source);
        break;
      case 'openMenu':
        menu.open();
        break;
      case 'closeMenu':
        menu.close();
        break;
      case 'openMap':
        menu.openMap();
        break;
      case 'chooseMapDestination':
        if (menu.view === 'map' && teleport.chooseDestination(action.destinationId)) {
          menu.close();
        }
        break;
      case 'enterExperiment':
        if (experiment.enter()) {
          leaveTutorialSpace();
        }
        break;
      case 'returnToLounge':
        experiment.returnToLounge();
        break;
    }
  };

  const unsubscribe = options.actionBus.subscribe(handle);

  return {
    events,
    locomotion,
    teleport,
    door,
    grab,
    menu,
    experiment,
    handle,
    update: (deltaSeconds) => {
      if (!enabled) {
        return;
      }
      locomotion.update(deltaSeconds);
      door.update(Math.min(deltaSeconds, 0.05));
      experiment.update(Math.min(deltaSeconds, 0.05));
    },
    setEnabled: (nextEnabled) => {
      if (!nextEnabled) {
        experiment.settle();
      }
      enabled = nextEnabled;
      locomotion.setEnabled(nextEnabled);
      teleport.setEnabled(nextEnabled);
    },
    dispose: () => {
      unsubscribe();
      locomotion.setEnabled(false);
      teleport.setEnabled(false);
      options.environment.root.remove(teleport.marker);
    },
  };
}
