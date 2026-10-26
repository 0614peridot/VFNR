import type { GrayboxEnvironment } from '../scene/createGrayboxEnvironment';

export interface MapDestination {
  destinationId: string;
  label: string;
  /** 0 = west edge, 1 = east edge. */
  u: number;
  /** 0 = far (forward) edge, 1 = near (spawn) edge. */
  v: number;
}

export function toMapCoordinates(
  environment: Pick<GrayboxEnvironment, 'bounds'>,
  x: number,
  z: number,
): { u: number; v: number } {
  const { minX, maxX, minZ, maxZ } = environment.bounds;
  return {
    u: (x - minX) / (maxX - minX),
    v: (z - minZ) / (maxZ - minZ),
  };
}

export function createMapDestinations(
  environment: Pick<GrayboxEnvironment, 'bounds' | 'teleportTargets'>,
): MapDestination[] {
  return environment.teleportTargets.map((target) => ({
    destinationId: String(target.userData.destinationId),
    label: String(target.userData.label ?? target.userData.destinationId),
    ...toMapCoordinates(environment, target.position.x, target.position.z),
  }));
}
