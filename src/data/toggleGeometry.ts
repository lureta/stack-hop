import * as THREE from "three";

export const TOGGLE_MAX_TILT = 0.65;

function pill(width: number, depth: number) {
  const radius = width / 2;
  const straight = (depth - width) / 2;
  const shape = new THREE.Shape();
  shape.moveTo(radius, -straight);
  shape.lineTo(radius, straight);
  shape.absarc(0, straight, radius, 0, Math.PI, false);
  shape.lineTo(-radius, -straight);
  shape.absarc(0, -straight, radius, Math.PI, Math.PI * 2, false);
  shape.closePath();
  return shape;
}
function extrude(shape: THREE.Shape, height: number, top: number) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height, bevelEnabled: false, curveSegments: 12, steps: 1,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, top - height, 0);
  return geometry;
}
function createToggle(width: number, depth: number) {
  const innerWidth = width * 0.78;
  const innerDepth = depth - 1.2;
  const floorTop = -0.22;
  const rimTop = 0.12;
  const knobRadius = innerWidth / 2 - 0.2;
  // Stop just inside the rounded track ends, with a small clearance from the rim.
  const travel = Math.max(0, innerDepth / 2 - knobRadius - 0.18);
  const rimShape = pill(width, depth);
  rimShape.holes.push(new THREE.Path(pill(innerWidth, innerDepth).getPoints(12).reverse()));
  const knobBottom = -0.205;
  const knobTop = 0.95;
  const knob = new THREE.LatheGeometry([
    [0, knobBottom], [knobRadius - 0.15, knobBottom],
    [knobRadius - 0.06, -0.185], [knobRadius - 0.015, -0.08],
    [knobRadius, 0.12], [knobRadius, 0.62],
    [knobRadius - 0.07, 0.82], [knobRadius - 0.22, 0.92],
    [knobRadius * 0.6, knobTop], [0, knobTop],
  ].map(([x, y]) => new THREE.Vector2(x, y)), 48);
  return {
    housing: extrude(pill(width, depth), 0.72, -0.28),
    rim: extrude(rimShape, 0.4, rimTop),
    floor: extrude(pill(innerWidth - 0.04, innerDepth - 0.04), 0.06, floorTop),
    knob, knobRadius, knobBottom, knobTop, floorTop, rimTop, innerWidth, innerDepth, travel,
    sideWalkX: (width / 2 + innerWidth / 2) / 2,
  };
}
const toggles = new Map<string, ReturnType<typeof createToggle>>();
/** One set of surfaces for both rendering and physics; the track is a real cavity. */
export function toggleGeometry(width: number, depth: number) {
  const key = `${width}-${depth}`;
  let result = toggles.get(key);
  if (!result) {
    result = createToggle(width, depth);
    toggles.set(key, result);
  }
  return result;
}
