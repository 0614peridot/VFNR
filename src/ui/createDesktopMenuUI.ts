import type { ActionBus } from '../input/ActionBus';
import type { MapDestination } from '../interactions/MapLayout';
import type { MenuView } from '../interactions/MenuSystem';

// PROVISIONAL: neutral engineering placeholder until the Figma menu and map designs exist.

export interface DesktopMenuUI {
  render(view: MenuView, screenModeActive: boolean): void;
}

function requireElement<T extends HTMLElement>(id: string): T {
  const element = document.querySelector<T>(`#${id}`);
  if (!element) {
    throw new Error(`Required UI element #${id} was not found.`);
  }
  return element;
}

export function createDesktopMenuUI(
  actionBus: ActionBus,
  destinations: readonly MapDestination[],
): DesktopMenuUI {
  const toggle = requireElement<HTMLButtonElement>('menu-toggle');
  const panel = requireElement<HTMLElement>('desktop-menu');
  const rootView = requireElement<HTMLElement>('desktop-menu-root');
  const mapView = requireElement<HTMLElement>('desktop-menu-map');
  const mapArea = requireElement<HTMLElement>('desktop-map-area');
  let currentView: MenuView = 'closed';

  const emit = (
    type: 'openMenu' | 'closeMenu' | 'openMap',
  ): void => actionBus.emit({ type, source: 'desktop' });

  toggle.addEventListener('click', () =>
    emit(currentView === 'closed' ? 'openMenu' : 'closeMenu'));
  requireElement<HTMLButtonElement>('desktop-menu-open-map')
    .addEventListener('click', () => emit('openMap'));
  requireElement<HTMLButtonElement>('desktop-menu-close')
    .addEventListener('click', () => emit('closeMenu'));
  requireElement<HTMLButtonElement>('desktop-map-back')
    .addEventListener('click', () => emit('openMenu'));

  destinations.forEach((destination) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'map-destination';
    button.textContent = destination.label;
    button.style.left = `${destination.u * 100}%`;
    button.style.top = `${destination.v * 100}%`;
    button.addEventListener('click', () => actionBus.emit({
      type: 'chooseMapDestination',
      destinationId: destination.destinationId,
      source: 'desktop',
    }));
    mapArea.append(button);
  });

  return {
    render: (view, screenModeActive) => {
      currentView = view;
      toggle.hidden = !screenModeActive;
      toggle.setAttribute('aria-expanded', String(view !== 'closed'));
      panel.hidden = !screenModeActive || view === 'closed';
      rootView.hidden = view !== 'menu';
      mapView.hidden = view !== 'map';
    },
  };
}
