import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createMapDestinations } from '../src/interactions/MapLayout';
import { createGrayboxEnvironment } from '../src/scene/createGrayboxEnvironment';
import { createWristMenuPanel } from '../src/ui/createWristMenuPanel';

function rayAt(object: THREE.Object3D) {
  object.updateWorldMatrix(true, false);
  const target = object.getWorldPosition(new THREE.Vector3());
  return {
    origin: { x: target.x, y: target.y, z: target.z + 0.5 },
    direction: { x: 0, y: 0, z: -1 },
  };
}

function createPanel() {
  const environment = createGrayboxEnvironment();
  const destinations = createMapDestinations(environment);
  const panel = createWristMenuPanel(environment, destinations);
  const anchor = new THREE.Group();
  // Neutralize the tilt so straight rays hit buttons predictably.
  panel.group.rotation.set(0, 0, 0);
  return { anchor, destinations, panel };
}

describe('map layout', () => {
  it('normalizes teleport pads into map coordinates with readable labels', () => {
    const destinations = createMapDestinations(createGrayboxEnvironment());
    expect(destinations.map((destination) => destination.label))
      .toEqual(['Pad 1', 'Pad 2', 'Pad 3']);
    destinations.forEach(({ u, v }) => {
      expect(u).toBeGreaterThan(0);
      expect(u).toBeLessThan(1);
      expect(v).toBeGreaterThan(0);
      expect(v).toBeLessThan(1);
    });
  });
});

describe('wrist menu panel', () => {
  it('resolves nothing while closed or outside immersive mode', () => {
    const { anchor, panel } = createPanel();
    panel.render('menu');
    panel.update(anchor, new THREE.Vector3(), false);
    const mapButton = panel.group.getObjectByName('wrist-menu-map')!;
    expect(panel.resolve(rayAt(mapButton))).toBeNull();
  });

  it('resolves only the controls in the active view', () => {
    const { anchor, panel } = createPanel();
    panel.render('menu');
    panel.update(anchor, new THREE.Vector3(), true);
    const mapButton = panel.group.getObjectByName('wrist-menu-map')!;
    const pad = panel.group.getObjectByName('wrist-map-teleport-target-2')!;

    expect(panel.group.parent).toBe(anchor);
    expect(panel.resolve(rayAt(mapButton))).toEqual({ type: 'openMap' });
    expect(panel.resolve(rayAt(pad))).toBeNull();

    panel.render('map');
    panel.update(anchor, new THREE.Vector3(0, 0, 8), true);
    expect(panel.resolve(rayAt(pad))).toEqual({
      type: 'chooseMapDestination',
      destinationId: 'teleport-target-2',
    });
  });
});
