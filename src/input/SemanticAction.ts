export type InputSourceId =
  | 'desktop'
  | 'left-controller'
  | 'right-controller';

export interface Vector3Value {
  x: number;
  y: number;
  z: number;
}

export interface InteractionRay {
  origin: Vector3Value;
  direction: Vector3Value;
}

interface SourceAction {
  source: InputSourceId;
}

export type SemanticAction =
  | (SourceAction & { type: 'move'; x: number; z: number })
  | (SourceAction & { type: 'turn'; radians: number })
  | (SourceAction & { type: 'select'; ray: InteractionRay })
  | (SourceAction & { type: 'startTeleport'; ray: InteractionRay })
  | (SourceAction & { type: 'updateTeleport'; ray: InteractionRay })
  | (SourceAction & { type: 'completeTeleport' })
  | (SourceAction & { type: 'cancelTeleport' })
  | (SourceAction & { type: 'grab'; ray: InteractionRay })
  | (SourceAction & { type: 'drop' })
  | (SourceAction & { type: 'openMenu' })
  | (SourceAction & { type: 'closeMenu' })
  | (SourceAction & { type: 'openMap' })
  | (SourceAction & {
      type: 'chooseMapDestination';
      destinationId: string;
    })
  | (SourceAction & { type: 'enterExperiment' })
  | (SourceAction & { type: 'returnToLounge' });

export type SemanticActionListener = (action: Readonly<SemanticAction>) => void;
