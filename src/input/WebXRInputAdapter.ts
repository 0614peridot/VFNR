import type { ActionBus } from './ActionBus';
import type {
  InputSourceId,
  InteractionRay,
  SemanticAction,
} from './SemanticAction';

export interface AxisVector {
  x: number;
  y: number;
}

export interface SnapTurnState {
  latched: boolean;
}

export type TeleportPhase = 'idle' | 'aiming' | 'pending-complete';

export interface TeleportStickState {
  phase: TeleportPhase;
  neutralSince: number | null;
}

export type TeleportStickEvent = 'start' | 'update' | 'complete' | 'cancel';

export interface TeleportStickResult {
  state: TeleportStickState;
  events: readonly TeleportStickEvent[];
}

export interface WebXRInputAdapterOptions {
  moveDeadzone?: number;
  snapEnterThreshold?: number;
  snapExitThreshold?: number;
  teleportStartThreshold?: number;
  teleportReleaseThreshold?: number;
  teleportCancelThreshold?: number;
  teleportCompletionDelayMs?: number;
  transformRay?(ray: InteractionRay): InteractionRay;
  isMenuOpen?(): boolean;
}

export interface WebXRInputAdapter {
  update(frame: XRFrame, referenceSpace: XRReferenceSpace): void;
  dispose(): void;
}

const QUEST_TOUCH_PROFILE_PREFIXES = [
  'meta-quest-touch',
  'oculus-touch',
] as const;

const DEFAULT_OPTIONS: Required<
  Omit<WebXRInputAdapterOptions, 'transformRay' | 'isMenuOpen'>
> = {
  moveDeadzone: 0.22,
  snapEnterThreshold: 0.65,
  snapExitThreshold: 0.35,
  teleportStartThreshold: -0.65,
  teleportReleaseThreshold: -0.35,
  teleportCancelThreshold: 0.55,
  teleportCompletionDelayMs: 120,
};

const IDLE_TELEPORT_STATE: TeleportStickState = {
  phase: 'idle',
  neutralSince: null,
};

export function applyRadialDeadzone(
  x: number,
  y: number,
  deadzone = DEFAULT_OPTIONS.moveDeadzone,
): AxisVector {
  const magnitude = Math.hypot(x, y);
  if (!Number.isFinite(magnitude) || magnitude <= deadzone) {
    return { x: 0, y: 0 };
  }

  const clampedMagnitude = Math.min(magnitude, 1);
  const scaledMagnitude = (clampedMagnitude - deadzone) / (1 - deadzone);
  const scale = scaledMagnitude / magnitude;
  return { x: x * scale, y: y * scale };
}

export function readXRStandardThumbstick(gamepad: Gamepad): AxisVector | null {
  if (gamepad.mapping !== 'xr-standard' || gamepad.axes.length < 4) {
    return null;
  }

  const x = gamepad.axes[2];
  const y = gamepad.axes[3];
  if (x === undefined || y === undefined || !Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }
  return { x, y };
}

export function isQuestTouchProfile(profiles: readonly string[]): boolean {
  return profiles.some((profile) =>
    QUEST_TOUCH_PROFILE_PREFIXES.some((prefix) => profile.startsWith(prefix)),
  );
}

export function updateSnapTurnState(
  x: number,
  state: SnapTurnState,
  enterThreshold = DEFAULT_OPTIONS.snapEnterThreshold,
  exitThreshold = DEFAULT_OPTIONS.snapExitThreshold,
): { state: SnapTurnState; radians: number | null } {
  if (state.latched) {
    return {
      state: { latched: Math.abs(x) >= exitThreshold },
      radians: null,
    };
  }

  if (Math.abs(x) < enterThreshold) {
    return { state, radians: null };
  }

  return {
    state: { latched: true },
    radians: -Math.sign(x) * (Math.PI / 6),
  };
}

export function updateTeleportStickState(
  y: number,
  nowMs: number,
  state: TeleportStickState,
  options: Pick<
    Required<WebXRInputAdapterOptions>,
    | 'teleportStartThreshold'
    | 'teleportReleaseThreshold'
    | 'teleportCancelThreshold'
    | 'teleportCompletionDelayMs'
  > = DEFAULT_OPTIONS,
): TeleportStickResult {
  if (state.phase === 'idle') {
    return y <= options.teleportStartThreshold
      ? {
          state: { phase: 'aiming', neutralSince: null },
          events: ['start'],
        }
      : { state, events: [] };
  }

  if (y >= options.teleportCancelThreshold) {
    return { state: IDLE_TELEPORT_STATE, events: ['cancel'] };
  }

  if (state.phase === 'aiming') {
    if (y > options.teleportReleaseThreshold) {
      return {
        state: { phase: 'pending-complete', neutralSince: nowMs },
        events: ['update'],
      };
    }
    return { state, events: ['update'] };
  }

  if (y <= options.teleportReleaseThreshold) {
    return {
      state: { phase: 'aiming', neutralSince: null },
      events: ['update'],
    };
  }

  const neutralSince = state.neutralSince ?? nowMs;
  if (nowMs - neutralSince >= options.teleportCompletionDelayMs) {
    return {
      state: IDLE_TELEPORT_STATE,
      events: ['update', 'complete'],
    };
  }

  return {
    state: { phase: 'pending-complete', neutralSince },
    events: ['update'],
  };
}

export function createInteractionRay(pose: XRPose): InteractionRay {
  const { position, orientation } = pose.transform;
  const { x, y, z, w } = orientation;
  const direction = {
    x: -2 * (x * z + w * y),
    y: 2 * (w * x - y * z),
    z: 2 * (x * x + y * y) - 1,
  };
  const length = Math.hypot(direction.x, direction.y, direction.z) || 1;

  return {
    origin: { x: position.x, y: position.y, z: position.z },
    direction: {
      x: direction.x / length,
      y: direction.y / length,
      z: direction.z / length,
    },
  };
}

function semanticSource(inputSource: XRInputSource): InputSourceId | null {
  if (inputSource.handedness === 'left') {
    return 'left-controller';
  }
  if (inputSource.handedness === 'right') {
    return 'right-controller';
  }
  return null;
}

function trackedRay(
  frame: XRFrame,
  referenceSpace: XRReferenceSpace | null,
  inputSource: XRInputSource,
): InteractionRay | null {
  if (inputSource.targetRayMode !== 'tracked-pointer' || !referenceSpace) {
    return null;
  }
  const pose = frame.getPose(inputSource.targetRaySpace, referenceSpace);
  return pose ? createInteractionRay(pose) : null;
}

export function createWebXRInputAdapter(
  session: XRSession,
  actionBus: ActionBus,
  requestedOptions: WebXRInputAdapterOptions = {},
): WebXRInputAdapter {
  const {
    transformRay = (ray: InteractionRay) => ray,
    isMenuOpen = () => false,
    ...requestedThresholds
  } = requestedOptions;
  const options = { ...DEFAULT_OPTIONS, ...requestedThresholds };
  let referenceSpace: XRReferenceSpace | null = null;
  let disposed = false;
  let snapTurnState: SnapTurnState = { latched: false };
  let teleportState: TeleportStickState = IDLE_TELEPORT_STATE;
  let menuPressed = false;

  const emitRayAction = (
    event: XRInputSourceEvent,
    type: 'select' | 'grab',
  ): void => {
    if (disposed) {
      return;
    }
    const source = semanticSource(event.inputSource);
    const rawRay = trackedRay(event.frame, referenceSpace, event.inputSource);
    const ray = rawRay ? transformRay(rawRay) : null;
    if (source && ray) {
      actionBus.emit({ type, source, ray });
    }
  };

  const onSelectStart = (event: XRInputSourceEvent): void => {
    emitRayAction(event, 'select');
  };
  const onSqueezeStart = (event: XRInputSourceEvent): void => {
    emitRayAction(event, 'grab');
  };
  const onSqueezeEnd = (event: XRInputSourceEvent): void => {
    if (disposed) {
      return;
    }
    const source = semanticSource(event.inputSource);
    if (source) {
      actionBus.emit({ type: 'drop', source });
    }
  };

  const onInputSourcesChange = (event: XRInputSourcesChangeEvent): void => {
    event.removed.forEach((inputSource) => {
      if (inputSource.handedness === 'left') {
        menuPressed = false;
        actionBus.emit({
          type: 'move',
          source: 'left-controller',
          x: 0,
          z: 0,
        });
      } else if (inputSource.handedness === 'right') {
        snapTurnState = { latched: false };
        if (teleportState.phase !== 'idle') {
          actionBus.emit({
            type: 'cancelTeleport',
            source: 'right-controller',
          });
          teleportState = IDLE_TELEPORT_STATE;
        }
      }
    });
  };

  const dispose = (): void => {
    if (disposed) {
      return;
    }
    disposed = true;
    session.removeEventListener('selectstart', onSelectStart);
    session.removeEventListener('squeezestart', onSqueezeStart);
    session.removeEventListener('squeezeend', onSqueezeEnd);
    session.removeEventListener('inputsourceschange', onInputSourcesChange);
    session.removeEventListener('end', onSessionEnd);
    if (teleportState.phase !== 'idle') {
      actionBus.emit({
        type: 'cancelTeleport',
        source: 'right-controller',
      });
      teleportState = IDLE_TELEPORT_STATE;
    }
    referenceSpace = null;
  };
  const onSessionEnd = (): void => {
    dispose();
  };

  session.addEventListener('selectstart', onSelectStart);
  session.addEventListener('squeezestart', onSqueezeStart);
  session.addEventListener('squeezeend', onSqueezeEnd);
  session.addEventListener('inputsourceschange', onInputSourcesChange);
  session.addEventListener('end', onSessionEnd);

  const emitTeleportEvents = (
    events: readonly TeleportStickEvent[],
    ray: InteractionRay,
  ): void => {
    events.forEach((event) => {
      let action: SemanticAction;
      if (event === 'start') {
        action = { type: 'startTeleport', source: 'right-controller', ray };
      } else if (event === 'update') {
        action = { type: 'updateTeleport', source: 'right-controller', ray };
      } else if (event === 'complete') {
        action = { type: 'completeTeleport', source: 'right-controller' };
      } else {
        action = { type: 'cancelTeleport', source: 'right-controller' };
      }
      actionBus.emit(action);
    });
  };

  return {
    update: (frame, nextReferenceSpace) => {
      if (disposed) {
        return;
      }
      referenceSpace = nextReferenceSpace;

      let leftSource: XRInputSource | null = null;
      let rightSource: XRInputSource | null = null;
      for (const inputSource of session.inputSources) {
        if (inputSource.targetRayMode !== 'tracked-pointer') {
          continue;
        }
        if (inputSource.handedness === 'left') {
          leftSource = inputSource;
        } else if (inputSource.handedness === 'right') {
          rightSource = inputSource;
        }
      }

      const leftRawRay = leftSource
        ? trackedRay(frame, nextReferenceSpace, leftSource)
        : null;
      const leftRay = leftRawRay ? transformRay(leftRawRay) : null;
      const leftStick = leftSource?.gamepad
        ? readXRStandardThumbstick(leftSource.gamepad)
        : null;
      const move = leftRay && leftStick
        ? applyRadialDeadzone(leftStick.x, leftStick.y, options.moveDeadzone)
        : { x: 0, y: 0 };
      actionBus.emit({
        type: 'move',
        source: 'left-controller',
        x: move.x,
        z: move.y,
      });

      const xButton = leftSource?.gamepad?.buttons[4];
      const nextMenuPressed = Boolean(
        leftRay &&
        leftSource &&
        isQuestTouchProfile(leftSource.profiles) &&
        xButton?.pressed,
      );
      if (nextMenuPressed && !menuPressed) {
        actionBus.emit({
          type: isMenuOpen() ? 'closeMenu' : 'openMenu',
          source: 'left-controller',
        });
      }
      menuPressed = nextMenuPressed;

      const rightRawRay = rightSource
        ? trackedRay(frame, nextReferenceSpace, rightSource)
        : null;
      const rightRay = rightRawRay ? transformRay(rightRawRay) : null;
      const rightStick = rightSource?.gamepad
        ? readXRStandardThumbstick(rightSource.gamepad)
        : null;

      if (!rightRay || !rightStick) {
        snapTurnState = { latched: false };
        if (teleportState.phase !== 'idle') {
          actionBus.emit({
            type: 'cancelTeleport',
            source: 'right-controller',
          });
          teleportState = IDLE_TELEPORT_STATE;
        }
        return;
      }

      const nowMs = frame.predictedDisplayTime;
      const teleportResult = updateTeleportStickState(
        rightStick.y,
        nowMs,
        teleportState,
        options,
      );
      teleportState = teleportResult.state;
      emitTeleportEvents(teleportResult.events, rightRay);

      if (teleportState.phase === 'idle' && teleportResult.events.length === 0) {
        const snapResult = updateSnapTurnState(
          rightStick.x,
          snapTurnState,
          options.snapEnterThreshold,
          options.snapExitThreshold,
        );
        snapTurnState = snapResult.state;
        if (snapResult.radians !== null) {
          actionBus.emit({
            type: 'turn',
            source: 'right-controller',
            radians: snapResult.radians,
          });
        }
      }
    },
    dispose,
  };
}
