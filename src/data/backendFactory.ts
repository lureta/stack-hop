import { levels } from "./levels";
import { stackLayouts } from "./stackJourney";
export const backendFactory = { token: false, validated: false, maze: false, wrongDoor: 2, switches: new Set<number>(), entered: false };
export function resetBackendFactory() {
  Object.assign(backendFactory, { token: false, validated: false, maze: false, wrongDoor: 2, entered: false });
  backendFactory.switches.clear();
}
export function backendReady() { return backendFactory.token && backendFactory.validated && backendFactory.maze && backendFactory.switches.size === 3; }
export function backendPoint(index: number) {
  const [, x, y, z] = stackLayouts[1][index];
  return { x, y: levels[1].y + y, z: levels[1].z + z };
}
