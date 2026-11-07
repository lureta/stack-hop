import * as THREE from "three";
export const promptHalfSize = new THREE.Vector3(2, .85, 2);
/** Conservative yaw-independent clearance includes the entire sign, not just its anchor. */
export function placeJourneyPrompt(base: { x: number; y: number; z: number; width: number }, side: number, occupied: THREE.Box3[], gaps = [3.2, 5.5], heights = [2.5, 4.7]) {
  const bounds = new THREE.Box3(), point = new THREE.Vector3();
  for (const height of heights) for (const gap of gaps) for (const direction of [side, -side]) {
    point.set(base.x + direction * (base.width / 2 + gap), base.y + height, base.z);
    bounds.setFromCenterAndSize(point, promptHalfSize.clone().multiplyScalar(2));
    if (!occupied.some(box => box.intersectsBox(bounds))) return point.clone();
  }
  return null;
}
