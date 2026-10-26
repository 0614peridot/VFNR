import * as THREE from 'three';
import type { MenuCommand } from '../app/InteractionRuntime';
import type { InteractionRay } from '../input/SemanticAction';
import { toMapCoordinates, type MapDestination } from '../interactions/MapLayout';
import type { MenuView } from '../interactions/MenuSystem';
import type { GrayboxEnvironment } from '../scene/createGrayboxEnvironment';

// PROVISIONAL: neutral engineering placeholder until the Figma wrist-menu design exists.
const PANEL_WIDTH = 0.2;
const BUTTON_HEIGHT = 0.04;
const MAP_WIDTH = 0.12;
const MAP_HEIGHT = 0.22;
const PAD_RADIUS = 0.014;
const COLORS = {
  panel: 0x1d2126,
  button: 0xe6ebef,
  buttonText: '#182124',
  map: 0x4a525c,
  pad: 0x65d4cd,
  you: 0xffd166,
} as const;

export interface WristMenuPanel {
  readonly group: THREE.Group;
  render(view: MenuView): void;
  /** Keeps the panel on the left controller and refreshes the map's position marker. */
  update(
    anchor: THREE.Object3D | undefined,
    viewerPosition: THREE.Vector3,
    presenting: boolean,
  ): void;
  resolve(ray: InteractionRay): MenuCommand | null;
}

function labelMaterial(
  text: string,
  color: number,
  aspect = 4,
): THREE.MeshBasicMaterial {
  if (typeof document === 'undefined') {
    return new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
  }
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = Math.round(canvas.width / aspect);
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = COLORS.buttonText;
    context.font = `600 ${Math.round(canvas.height * 0.5)}px system-ui, sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
}

function createButton(
  label: string,
  command: MenuCommand,
  width: number,
  y: number,
): THREE.Mesh {
  const button = new THREE.Mesh(
    new THREE.PlaneGeometry(width, BUTTON_HEIGHT),
    labelMaterial(label, COLORS.button),
  );
  button.name = `wrist-menu-${label.toLowerCase().replace(/\s+/g, '-')}`;
  button.position.set(0, y, 0.002);
  button.userData.command = command;
  return button;
}

function createBackground(width: number, height: number): THREE.Mesh {
  const background = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({
      color: COLORS.panel,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
    }),
  );
  background.name = 'wrist-menu-background';
  return background;
}

export function createWristMenuPanel(
  environment: Pick<GrayboxEnvironment, 'bounds'>,
  destinations: readonly MapDestination[],
): WristMenuPanel {
  const group = new THREE.Group();
  group.name = 'wrist-menu';
  // Above the left controller, tilted back toward the viewer.
  group.position.set(0, 0.06, 0.02);
  group.rotation.x = -0.35;
  group.visible = false;

  const menuHeight = BUTTON_HEIGHT * 2 + 0.03;
  const menuView = new THREE.Group();
  menuView.name = 'wrist-menu-root-view';
  menuView.position.y = menuHeight / 2;
  menuView.add(
    createBackground(PANEL_WIDTH, menuHeight),
    createButton('Map', { type: 'openMap' }, PANEL_WIDTH - 0.02, BUTTON_HEIGHT / 2 + 0.005),
    createButton('Close', { type: 'closeMenu' }, PANEL_WIDTH - 0.02, -BUTTON_HEIGHT / 2 - 0.005),
  );

  const mapHeight = MAP_HEIGHT + BUTTON_HEIGHT + 0.03;
  const mapView = new THREE.Group();
  mapView.name = 'wrist-menu-map-view';
  mapView.position.y = mapHeight / 2;
  const mapTop = mapHeight / 2 - 0.01;
  const mapArea = new THREE.Mesh(
    new THREE.PlaneGeometry(MAP_WIDTH, MAP_HEIGHT),
    new THREE.MeshBasicMaterial({ color: COLORS.map, side: THREE.DoubleSide }),
  );
  mapArea.name = 'wrist-map-area';
  mapArea.position.set(0, mapTop - MAP_HEIGHT / 2, 0.001);
  const toLocal = (u: number, v: number): THREE.Vector2 =>
    new THREE.Vector2((u - 0.5) * MAP_WIDTH, mapTop - v * MAP_HEIGHT);

  mapView.add(
    createBackground(PANEL_WIDTH, mapHeight),
    mapArea,
    createButton('Back', { type: 'openMenu' }, PANEL_WIDTH - 0.02, -mapHeight / 2 + BUTTON_HEIGHT / 2 + 0.01),
  );
  destinations.forEach((destination, index) => {
    const pad = new THREE.Mesh(
      new THREE.CircleGeometry(PAD_RADIUS, 24),
      labelMaterial(String(index + 1), COLORS.pad, 1),
    );
    const position = toLocal(destination.u, destination.v);
    pad.name = `wrist-map-${destination.destinationId}`;
    pad.position.set(position.x, position.y, 0.003);
    pad.userData.command = {
      type: 'chooseMapDestination',
      destinationId: destination.destinationId,
    } satisfies MenuCommand;
    mapView.add(pad);
  });
  const youMarker = new THREE.Mesh(
    new THREE.CircleGeometry(PAD_RADIUS * 0.5, 16),
    new THREE.MeshBasicMaterial({ color: COLORS.you, side: THREE.DoubleSide }),
  );
  youMarker.name = 'wrist-map-you';
  mapView.add(youMarker);

  group.add(menuView, mapView);
  let currentView: MenuView = 'closed';
  const raycaster = new THREE.Raycaster();

  const activeView = (): THREE.Group | null => {
    if (!group.visible) {
      return null;
    }
    return currentView === 'map' ? mapView : currentView === 'menu' ? menuView : null;
  };

  return {
    group,
    render: (view) => {
      currentView = view;
      menuView.visible = view === 'menu';
      mapView.visible = view === 'map';
    },
    update: (anchor, viewerPosition, presenting) => {
      if (anchor && group.parent !== anchor) {
        anchor.add(group);
      }
      group.visible = Boolean(anchor) && presenting && currentView !== 'closed';
      if (currentView === 'map') {
        const { u, v } = toMapCoordinates(environment, viewerPosition.x, viewerPosition.z);
        const position = toLocal(
          THREE.MathUtils.clamp(u, 0, 1),
          THREE.MathUtils.clamp(v, 0, 1),
        );
        youMarker.position.set(position.x, position.y, 0.004);
      }
    },
    resolve: (ray) => {
      const view = activeView();
      if (!view) {
        return null;
      }
      view.updateWorldMatrix(true, true);
      raycaster.set(
        new THREE.Vector3(ray.origin.x, ray.origin.y, ray.origin.z),
        new THREE.Vector3(ray.direction.x, ray.direction.y, ray.direction.z).normalize(),
      );
      raycaster.far = 2;
      const targets = view.children.filter((child) => child.userData.command);
      const hit = raycaster.intersectObjects(targets, false)[0];
      return (hit?.object.userData.command as MenuCommand | undefined) ?? null;
    },
  };
}
