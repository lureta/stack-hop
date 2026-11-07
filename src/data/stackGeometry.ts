import * as THREE from "three";
const cache = new Map<string, THREE.CylinderGeometry>();
/** Visual and collision silhouettes agree for curved pipes, tapered buckets, and hexagonal shards. */
export function stackGeometry(kind: string, width: number, depth: number) {
  const key = `${kind}-${width}-${depth}`;
  if (cache.has(key)) return cache.get(key)!;
  let geometry: THREE.CylinderGeometry;
  if (kind === "apiPipe") {
    geometry = new THREE.CylinderGeometry(width / 2, width / 2, depth, 24);
    geometry.rotateX(Math.PI / 2);
    geometry.translate(0, -width / 2, 0);
  } else if (kind === "cloudBucket") {
    geometry = new THREE.CylinderGeometry(width / 2, width * .39, 3.1, 32);
    geometry.translate(0, -1.55, 0);
  } else {
    geometry = new THREE.CylinderGeometry(width / 2, width / 2, 2.2, 6);
    geometry.translate(0, -1.1, 0);
  }
  cache.set(key, geometry);
  return geometry;
}

export function stackHull(kind: string, width: number, depth: number) {
  return stackGeometry(kind, width, depth).attributes.position.array as Float32Array;
}
