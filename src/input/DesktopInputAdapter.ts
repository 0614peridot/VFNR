import type { ActionBus } from './ActionBus';
import type { InteractionRay } from './SemanticAction';

const MOVEMENT_CODES = new Set([
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'ArrowUp',
  'ArrowLeft',
  'ArrowDown',
  'ArrowRight',
]);

const CLICK_DRAG_THRESHOLD_PX = 4;
const DEFAULT_TURN_SENSITIVITY = 0.0025;
const MAX_POINTER_TURN_RADIANS = Math.PI / 6;

export interface MoveInput {
  x: number;
  z: number;
}

export interface DesktopInputAdapterOptions {
  element: HTMLElement;
  actionBus: ActionBus;
  getRay(clientX: number, clientY: number): InteractionRay;
  isHoldingObject(): boolean;
  isMenuOpen?(): boolean;
  keyboardTarget?: Window;
  turnSensitivity?: number;
}

export interface DesktopInputAdapter {
  setEnabled(enabled: boolean): void;
  update(): void;
  dispose(): void;
}

export function isDesktopMovementCode(code: string): boolean {
  return MOVEMENT_CODES.has(code);
}

export function normalizeDesktopMoveInput(
  pressedCodes: ReadonlySet<string>,
): MoveInput {
  const x =
    Number(pressedCodes.has('KeyD') || pressedCodes.has('ArrowRight')) -
    Number(pressedCodes.has('KeyA') || pressedCodes.has('ArrowLeft'));
  const z =
    Number(pressedCodes.has('KeyS') || pressedCodes.has('ArrowDown')) -
    Number(pressedCodes.has('KeyW') || pressedCodes.has('ArrowUp'));
  const length = Math.hypot(x, z);

  if (length <= 1) {
    return { x, z };
  }

  return { x: x / length, z: z / length };
}

export function pointerDeltaToTurnRadians(
  deltaX: number,
  sensitivity = DEFAULT_TURN_SENSITIVITY,
): number {
  if (!Number.isFinite(deltaX) || !Number.isFinite(sensitivity)) {
    return 0;
  }

  return Math.max(
    -MAX_POINTER_TURN_RADIANS,
    Math.min(MAX_POINTER_TURN_RADIANS, -deltaX * sensitivity),
  );
}

export function createDesktopInputAdapter(
  options: DesktopInputAdapterOptions,
): DesktopInputAdapter {
  const keyboardTarget = options.keyboardTarget ?? window;
  const pressedCodes = new Set<string>();
  const sensitivity = options.turnSensitivity ?? DEFAULT_TURN_SENSITIVITY;
  let enabled = false;
  let teleportActive = false;
  let activePointerId: number | null = null;
  let pointerDownX = 0;
  let pointerDownY = 0;
  const elementBounds = options.element.getBoundingClientRect();
  let lastPointerX = elementBounds.left + elementBounds.width / 2;
  let lastPointerY = elementBounds.top + elementBounds.height / 2;
  let dragged = false;

  const currentRay = (): InteractionRay =>
    options.getRay(lastPointerX, lastPointerY);

  const resetPointer = (): void => {
    activePointerId = null;
    dragged = false;
  };

  const stopActiveInput = (emitActions: boolean): void => {
    const hadMovement = pressedCodes.size > 0;
    pressedCodes.clear();
    resetPointer();

    if (emitActions && hadMovement) {
      options.actionBus.emit({
        type: 'move',
        source: 'desktop',
        x: 0,
        z: 0,
      });
    }

    if (emitActions && teleportActive) {
      options.actionBus.emit({ type: 'cancelTeleport', source: 'desktop' });
    }
    teleportActive = false;
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (!enabled) {
      return;
    }

    if (isDesktopMovementCode(event.code)) {
      event.preventDefault();
      pressedCodes.add(event.code);
      return;
    }

    if (event.repeat) {
      return;
    }

    switch (event.code) {
      case 'KeyT':
        event.preventDefault();
        if (teleportActive) {
          teleportActive = false;
          options.actionBus.emit({ type: 'cancelTeleport', source: 'desktop' });
        } else {
          teleportActive = true;
          options.actionBus.emit({
            type: 'startTeleport',
            source: 'desktop',
            ray: currentRay(),
          });
        }
        break;
      case 'Escape':
        if (teleportActive) {
          event.preventDefault();
          teleportActive = false;
          options.actionBus.emit({ type: 'cancelTeleport', source: 'desktop' });
        } else if (options.isMenuOpen?.()) {
          event.preventDefault();
          options.actionBus.emit({ type: 'closeMenu', source: 'desktop' });
        }
        break;
      case 'KeyE':
        event.preventDefault();
        if (options.isHoldingObject()) {
          options.actionBus.emit({ type: 'drop', source: 'desktop' });
        } else {
          options.actionBus.emit({
            type: 'grab',
            source: 'desktop',
            ray: currentRay(),
          });
        }
        break;
      case 'Tab':
        event.preventDefault();
        options.actionBus.emit({
          type: options.isMenuOpen?.() ? 'closeMenu' : 'openMenu',
          source: 'desktop',
        });
        break;
    }
  };

  const onKeyUp = (event: KeyboardEvent): void => {
    if (!isDesktopMovementCode(event.code)) {
      return;
    }

    pressedCodes.delete(event.code);
    if (enabled) {
      event.preventDefault();
    }
  };

  const onPointerDown = (event: PointerEvent): void => {
    if (!enabled || event.button !== 0 || activePointerId !== null) {
      return;
    }

    activePointerId = event.pointerId;
    pointerDownX = event.clientX;
    pointerDownY = event.clientY;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    dragged = false;
    options.element.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (!enabled) {
      return;
    }

    const previousX = lastPointerX;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;

    if (teleportActive) {
      options.actionBus.emit({
        type: 'updateTeleport',
        source: 'desktop',
        ray: currentRay(),
      });
    }

    if (event.pointerId !== activePointerId) {
      return;
    }

    dragged =
      dragged ||
      Math.hypot(event.clientX - pointerDownX, event.clientY - pointerDownY) >=
        CLICK_DRAG_THRESHOLD_PX;
    const radians = pointerDeltaToTurnRadians(
      event.clientX - previousX,
      sensitivity,
    );
    if (dragged && radians !== 0) {
      options.actionBus.emit({ type: 'turn', source: 'desktop', radians });
    }
  };

  const onPointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== activePointerId || event.button !== 0) {
      return;
    }

    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    const wasDragged = dragged;
    resetPointer();
    options.element.releasePointerCapture?.(event.pointerId);

    if (!enabled || wasDragged) {
      return;
    }

    if (teleportActive) {
      teleportActive = false;
      options.actionBus.emit({ type: 'completeTeleport', source: 'desktop' });
    } else {
      options.actionBus.emit({
        type: 'select',
        source: 'desktop',
        ray: currentRay(),
      });
    }
  };

  const onPointerCancel = (event: PointerEvent): void => {
    if (event.pointerId === activePointerId) {
      resetPointer();
    }
  };

  const onBlur = (): void => {
    if (enabled) {
      stopActiveInput(true);
    }
  };

  keyboardTarget.addEventListener('keydown', onKeyDown);
  keyboardTarget.addEventListener('keyup', onKeyUp);
  keyboardTarget.addEventListener('blur', onBlur);
  options.element.addEventListener('pointerdown', onPointerDown);
  options.element.addEventListener('pointermove', onPointerMove);
  options.element.addEventListener('pointerup', onPointerUp);
  options.element.addEventListener('pointercancel', onPointerCancel);

  return {
    setEnabled: (nextEnabled) => {
      if (enabled && !nextEnabled) {
        stopActiveInput(true);
      }
      enabled = nextEnabled;
    },
    update: () => {
      if (!enabled) {
        return;
      }
      const move = normalizeDesktopMoveInput(pressedCodes);
      options.actionBus.emit({
        type: 'move',
        source: 'desktop',
        x: move.x,
        z: move.z,
      });
    },
    dispose: () => {
      keyboardTarget.removeEventListener('keydown', onKeyDown);
      keyboardTarget.removeEventListener('keyup', onKeyUp);
      keyboardTarget.removeEventListener('blur', onBlur);
      options.element.removeEventListener('pointerdown', onPointerDown);
      options.element.removeEventListener('pointermove', onPointerMove);
      options.element.removeEventListener('pointerup', onPointerUp);
      options.element.removeEventListener('pointercancel', onPointerCancel);
      stopActiveInput(false);
      enabled = false;
    },
  };
}
