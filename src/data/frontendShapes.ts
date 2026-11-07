import * as THREE from "three";

/** The same bars define the loading indicator's visible mesh and its collision surfaces. */
export function loadingBars(width: number) {
  const scale = width / 4.8;
  return Array.from({ length: 12 }, (_, i) => {
    const angle = i * Math.PI / 6;
    return {
      x: Math.sin(angle) * 1.7 * scale,
      z: Math.cos(angle) * 1.7 * scale,
      angle,
      width: 0.52 * scale,
      depth: 1.08 * scale,
      height: 0.28,
      color: new THREE.Color("#dff5e5").lerp(new THREE.Color("#4b9d78"), (i / 11) ** 1.4).getStyle(),
    };
  });
}

const loaderShapes = new Map<number, THREE.ExtrudeGeometry>();
export function loadingBarGeometry(width: number) {
  const cached = loaderShapes.get(width);
  if (cached) return cached;
  const bar = loadingBars(width)[0], r = bar.width / 2, straight = (bar.depth - bar.width) / 2;
  const shape = new THREE.Shape();
  shape.moveTo(r, -straight); shape.lineTo(r, straight);
  shape.absarc(0, straight, r, 0, Math.PI, false);
  shape.lineTo(-r, -straight); shape.absarc(0, -straight, r, Math.PI, Math.PI * 2, false);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: bar.height, bevelEnabled: false, curveSegments: 8 });
  geometry.rotateX(-Math.PI / 2); geometry.translate(0, -bar.height, 0);
  loaderShapes.set(width, geometry);
  return geometry;
}

const shapes = new Map<string, THREE.ExtrudeGeometry>();
export function uiIconGeometry(kind: "gear" | "camera", width: number, depth: number) {
  const key = `${kind}-${width}-${depth}`;
  let geometry = shapes.get(key);
  if (geometry) return geometry;
  const shape = new THREE.Shape();
  const height = kind === "gear" ? 0.45 : 0.55;
  if (kind === "gear") {
    const scale = width / 3.64;
    const rootRadius = 1.45;
    const shoulder = Math.asin(0.42 / rootRadius);
    const root = Math.sqrt(rootRadius ** 2 - 0.42 ** 2);
    const point = (angle: number, radial: number, tangent: number) => new THREE.Vector2(
      (Math.cos(angle) * radial - Math.sin(angle) * tangent) * scale,
      (Math.sin(angle) * radial + Math.cos(angle) * tangent) * scale,
    );
    // Rounded rectangular teeth on a circular hub: the familiar settings-icon silhouette.
    for (let tooth = 0; tooth < 8; tooth++) {
      const angle = tooth * Math.PI / 4;
      const start = point(angle, root, -0.42);
      if (tooth === 0) shape.moveTo(start.x, start.y);
      const curve = (r1: number, t1: number, r2: number, t2: number) => {
        const control = point(angle, r1, t1), end = point(angle, r2, t2);
        shape.quadraticCurveTo(control.x, control.y, end.x, end.y);
      };
      curve(1.45, -0.31, 1.55, -0.31);
      const edge = point(angle, 1.73, -0.31);
      shape.lineTo(edge.x, edge.y);
      curve(1.82, -0.31, 1.82, -0.21);
      const tip = point(angle, 1.82, 0.21);
      shape.lineTo(tip.x, tip.y);
      curve(1.82, 0.31, 1.73, 0.31);
      const inner = point(angle, 1.55, 0.31);
      shape.lineTo(inner.x, inner.y);
      curve(1.45, 0.31, root, 0.42);
      shape.absarc(0, 0, rootRadius * scale, angle + shoulder,
        angle + Math.PI / 4 - shoulder, false);
    }
    shape.closePath();
    const hole = new THREE.Path();
    hole.absarc(0, 0, 0.65 * scale, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  } else {
    const w = width / 2, d = depth / 2;
    shape.moveTo(-w + 0.2, -d);
    shape.lineTo(w - 0.2, -d);
    shape.quadraticCurveTo(w, -d, w, -d + 0.2);
    shape.lineTo(w, d - 0.8);
    shape.quadraticCurveTo(w, d - 0.6, w - 0.2, d - 0.6);
    shape.lineTo(w * 0.42, d - 0.6);
    shape.lineTo(w * 0.32, d);
    shape.lineTo(-w * 0.32, d);
    shape.lineTo(-w * 0.42, d - 0.6);
    shape.lineTo(-w + 0.2, d - 0.6);
    shape.quadraticCurveTo(-w, d - 0.6, -w, d - 0.8);
    shape.lineTo(-w, -d + 0.2);
    shape.quadraticCurveTo(-w, -d, -w + 0.2, -d);
    shape.closePath();
  }
  geometry = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, curveSegments: kind === "gear" ? 12 : 8, steps: 1 });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, -height, 0);
  shapes.set(key, geometry);
  return geometry;
}

const meshes = new WeakMap<THREE.BufferGeometry, [Float32Array, Uint32Array]>();
export function iconCollider(geometry: THREE.BufferGeometry): [Float32Array, Uint32Array] {
  let result = meshes.get(geometry);
  if (!result) {
    const positions = geometry.attributes.position.array as Float32Array;
    const indices = geometry.index
      ? new Uint32Array(geometry.index.array)
      : Uint32Array.from({ length: positions.length / 3 }, (_, i) => i);
    result = [positions, indices];
    meshes.set(geometry, result);
  }
  return result;
}
