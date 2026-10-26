import type { InteractionEventBus } from './InteractionEventBus';

export type MenuView = 'closed' | 'menu' | 'map';

export type MenuViewListener = (view: MenuView) => void;

export class MenuSystem {
  private currentView: MenuView = 'closed';
  private readonly listeners = new Set<MenuViewListener>();

  constructor(private readonly events: InteractionEventBus) {}

  open(): boolean {
    if (this.currentView === 'menu') {
      return false;
    }
    this.setView('menu');
    this.events.emit({ type: 'menuOpened' });
    return true;
  }

  openMap(): boolean {
    if (this.currentView !== 'menu') {
      return false;
    }
    this.setView('map');
    this.events.emit({ type: 'mapOpened' });
    return true;
  }

  close(): boolean {
    if (this.currentView === 'closed') {
      return false;
    }
    this.setView('closed');
    this.events.emit({ type: 'menuClosed' });
    return true;
  }

  get view(): MenuView {
    return this.currentView;
  }

  get isOpen(): boolean {
    return this.currentView !== 'closed';
  }

  subscribe(listener: MenuViewListener): () => void {
    this.listeners.add(listener);
    listener(this.currentView);
    return () => this.listeners.delete(listener);
  }

  private setView(view: MenuView): void {
    this.currentView = view;
    this.listeners.forEach((listener) => listener(view));
  }
}
