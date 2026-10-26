import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { createInteractionRuntime } from '../src/app/InteractionRuntime';
import { createActionBus } from '../src/input/ActionBus';
import type { InputSourceId } from '../src/input/SemanticAction';
import { createGrayboxEnvironment } from '../src/scene/createGrayboxEnvironment';

function createHarness() {
  const environment = createGrayboxEnvironment();
  const scene = new THREE.Scene();
  scene.add(environment.root);
  const player = new THREE.Group();
  player.position.copy(environment.anchors.spawn);
  const camera = new THREE.PerspectiveCamera();
  camera.position.set(0, 1.65, 0);
  player.add(camera);
  scene.add(player);
  const desktopAnchor = new THREE.Group();
  camera.add(desktopAnchor);
  const anchors = new Map<InputSourceId, THREE.Object3D>([
    ['desktop', desktopAnchor],
  ]);
  const actionBus = createActionBus();
  const runtime = createInteractionRuntime({
    actionBus,
    player,
    camera,
    environment,
    grabAnchors: anchors,
  });
  runtime.setEnabled(true);
  scene.updateMatrixWorld(true);
  return { actionBus, camera, environment, player, runtime, scene };
}

describe('interaction runtime', () => {
  it('moves from a semantic action and clamps long frame deltas', () => {
    const { actionBus, player, runtime } = createHarness();
    const moved = vi.fn();
    runtime.events.subscribe((event) => {
      if (event.type === 'moved') moved(event);
    });

    actionBus.emit({ type: 'move', x: 0, z: -1, source: 'desktop' });
    runtime.update(1);

    expect(player.position.z).toBeCloseTo(7.915, 3);
    expect(moved).toHaveBeenCalledOnce();
  });

  it('rotates around the current viewer position', () => {
    const { actionBus, camera, scene } = createHarness();
    camera.position.x = 1;
    scene.updateMatrixWorld(true);
    const before = camera.getWorldPosition(new THREE.Vector3());

    actionBus.emit({
      type: 'turn',
      radians: Math.PI / 6,
      source: 'right-controller',
    });
    scene.updateMatrixWorld(true);
    const after = camera.getWorldPosition(new THREE.Vector3());

    expect(after.x).toBeCloseTo(before.x, 5);
    expect(after.z).toBeCloseTo(before.z, 5);
  });

  it('opens the door once after a valid select ray', () => {
    const { actionBus, environment, runtime } = createHarness();
    const opened = vi.fn();
    runtime.events.subscribe((event) => {
      if (event.type === 'doorOpened') opened();
    });

    actionBus.emit({
      type: 'select',
      source: 'desktop',
      ray: {
        origin: { x: 3, y: 1.2, z: -2 },
        direction: { x: 0, y: 0, z: -1 },
      },
    });
    for (let index = 0; index < 20; index += 1) runtime.update(0.05);

    expect(environment.doorHinge.rotation.y).toBeCloseTo(-Math.PI / 2, 5);
    expect(opened).toHaveBeenCalledOnce();
  });

  it('teleports to a named map destination only through the open map', () => {
    const { actionBus, camera, runtime, scene } = createHarness();
    const completed = vi.fn();
    runtime.events.subscribe((event) => {
      if (event.type === 'teleportCompleted') completed(event);
    });

    actionBus.emit({
      type: 'chooseMapDestination',
      destinationId: 'teleport-target-1',
      source: 'desktop',
    });
    expect(completed).not.toHaveBeenCalled();

    actionBus.emit({ type: 'openMenu', source: 'desktop' });
    actionBus.emit({ type: 'openMap', source: 'desktop' });
    actionBus.emit({
      type: 'chooseMapDestination',
      destinationId: 'teleport-target-1',
      source: 'desktop',
    });
    scene.updateMatrixWorld(true);
    const viewer = camera.getWorldPosition(new THREE.Vector3());

    expect(viewer.x).toBeCloseTo(3, 5);
    expect(viewer.z).toBeCloseTo(-8, 5);
    expect(completed).toHaveBeenCalledOnce();
    expect(runtime.menu.view).toBe('closed');
  });

  it('grabs and drops the cube through semantic actions', () => {
    const { actionBus, environment, runtime } = createHarness();
    actionBus.emit({
      type: 'grab',
      source: 'desktop',
      ray: {
        origin: { x: -3, y: 1, z: -3.5 },
        direction: { x: 0, y: 0, z: -1 },
      },
    });

    expect(runtime.grab.holder).toBe('desktop');
    actionBus.emit({ type: 'drop', source: 'desktop' });
    expect(runtime.grab.holder).toBeNull();
    expect(environment.grabbable.parent).toBe(environment.root);
  });

  it('ignores actions while disabled', () => {
    const { actionBus, player, runtime } = createHarness();
    runtime.setEnabled(false);
    const before = player.position.clone();
    actionBus.emit({ type: 'move', x: 0, z: -1, source: 'desktop' });
    actionBus.emit({ type: 'turn', radians: Math.PI / 6, source: 'desktop' });
    runtime.update(0.05);

    expect(player.position).toEqual(before);
    expect(player.rotation.y).toBe(0);
  });
});

describe('menu, map, and experiment interactions', () => {
  it('opens the menu, then the map, and closes from either view', () => {
    const { actionBus, runtime } = createHarness();
    const events: string[] = [];
    runtime.events.subscribe((event) => events.push(event.type));

    actionBus.emit({ type: 'openMap', source: 'desktop' });
    expect(runtime.menu.view).toBe('closed');

    actionBus.emit({ type: 'openMenu', source: 'left-controller' });
    actionBus.emit({ type: 'openMap', source: 'right-controller' });
    expect(runtime.menu.view).toBe('map');
    actionBus.emit({ type: 'openMenu', source: 'right-controller' });
    expect(runtime.menu.view).toBe('menu');
    actionBus.emit({ type: 'closeMenu', source: 'left-controller' });

    expect(runtime.menu.view).toBe('closed');
    expect(events).toEqual(['menuOpened', 'mapOpened', 'menuOpened', 'menuClosed']);
  });

  it('routes a select ray to a resolved menu command before world targets', () => {
    const environment = createGrayboxEnvironment();
    const player = new THREE.Group();
    const camera = new THREE.PerspectiveCamera();
    player.add(camera);
    const actionBus = createActionBus();
    const runtime = createInteractionRuntime({
      actionBus,
      player,
      camera,
      environment,
      grabAnchors: new Map(),
      resolveMenuCommand: () => ({ type: 'openMap' }),
    });
    runtime.setEnabled(true);
    const ray = { origin: { x: 0, y: 1, z: 0 }, direction: { x: 0, y: 0, z: -1 } };

    actionBus.emit({ type: 'select', source: 'right-controller', ray });
    expect(runtime.menu.view).toBe('closed');

    actionBus.emit({ type: 'openMenu', source: 'left-controller' });
    actionBus.emit({ type: 'select', source: 'right-controller', ray });
    expect(runtime.menu.view).toBe('map');
  });

  it('enters the experiment from the entrance and returns to the lounge facing forward', () => {
    const { actionBus, camera, environment, player, runtime, scene } = createHarness();
    const events: string[] = [];
    runtime.events.subscribe((event) => events.push(event.type));
    const fadeFrames = () => {
      for (let index = 0; index < 20; index += 1) runtime.update(0.05);
      scene.updateMatrixWorld(true);
    };

    actionBus.emit({
      type: 'select',
      source: 'desktop',
      ray: { origin: { x: 0, y: 1.2, z: -9.5 }, direction: { x: 0, y: 0, z: -1 } },
    });
    expect(runtime.experiment.phase).toBe('entering');

    // Inputs are blocked mid-transition.
    actionBus.emit({ type: 'turn', radians: Math.PI / 6, source: 'desktop' });
    fadeFrames();

    expect(runtime.experiment.phase).toBe('experiment');
    const inExperiment = camera.getWorldPosition(new THREE.Vector3());
    expect(inExperiment.x).toBeCloseTo(environment.anchors.experiment.x, 5);
    expect(inExperiment.z).toBeCloseTo(environment.anchors.experiment.z, 5);

    // Tutorial interactions are unavailable inside the experiment placeholder.
    actionBus.emit({ type: 'move', x: 0, z: -1, source: 'desktop' });
    actionBus.emit({ type: 'openMenu', source: 'desktop' });
    runtime.update(0.05);
    expect(runtime.menu.view).toBe('closed');
    expect(camera.getWorldPosition(new THREE.Vector3()).z)
      .toBeCloseTo(environment.anchors.experiment.z, 5);

    actionBus.emit({ type: 'turn', radians: Math.PI / 6, source: 'desktop' });
    actionBus.emit({
      type: 'select',
      source: 'desktop',
      ray: { origin: { x: 0, y: 1.3, z: -40 }, direction: { x: 0, y: 0, z: -1 } },
    });
    expect(runtime.experiment.phase).toBe('returning');
    fadeFrames();

    const lounge = camera.getWorldPosition(new THREE.Vector3());
    const forward = camera.getWorldDirection(new THREE.Vector3());
    expect(runtime.experiment.phase).toBe('tutorial');
    expect(lounge.x).toBeCloseTo(environment.anchors.spawn.x, 5);
    expect(lounge.z).toBeCloseTo(environment.anchors.spawn.z, 5);
    expect(forward.x).toBeCloseTo(0, 5);
    expect(forward.z).toBeCloseTo(-1, 5);
    expect(player.rotation.y).toBeCloseTo(0, 5);
    expect(events).toEqual([
      'transitionStarted',
      'experimentEntered',
      'turned',
      'transitionStarted',
      'loungeReturned',
    ]);
  });

  it('drops a held object and settles a transition when interactions are suspended', () => {
    const { actionBus, environment, runtime } = createHarness();
    actionBus.emit({
      type: 'grab',
      source: 'desktop',
      ray: { origin: { x: -3, y: 1, z: -3.5 }, direction: { x: 0, y: 0, z: -1 } },
    });
    actionBus.emit({ type: 'enterExperiment', source: 'desktop' });

    expect(runtime.grab.holder).toBeNull();
    expect(environment.grabbable.parent).toBe(environment.root);

    runtime.setEnabled(false);
    expect(runtime.experiment.phase).toBe('experiment');
  });
});
