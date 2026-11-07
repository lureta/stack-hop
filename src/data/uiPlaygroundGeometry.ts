import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import typefaces from "./uiTypefaces.json" with { type: "json" };
export const uiFonts = typefaces.map((data) => new FontLoader().parse(data));
const letters = new Map<string, TextGeometry>();
export function letterGeometry(glyph: string, font: number, width: number, depth: number) {
  const key = `${glyph}-${font}-${width}-${depth}`;
  if (letters.has(key)) return letters.get(key)!;
  const g = new TextGeometry(glyph, { font: uiFonts[font], size: 1, depth: .5, bevelEnabled: false, curveSegments: 5 });
  g.computeBoundingBox();
  const b = g.boundingBox!, scale = Math.min(width / (b.max.x - b.min.x), depth / (b.max.y - b.min.y));
  g.translate(-(b.max.x + b.min.x) / 2, -(b.max.y + b.min.y) / 2, 0);
  g.scale(scale, scale, 1); g.rotateX(-Math.PI / 2); g.translate(0, -.5, 0);
  letters.set(key, g);
  return g;
}
export const typographySelection = { current: 0 };

const buttons = new Map<string, THREE.ExtrudeGeometry>();
export function buttonGeometry(width: number, depth: number) {
  const key = `${width}-${depth}`;
  if (buttons.has(key)) return buttons.get(key)!;
  const x = width / 2, z = depth / 2, r = .65, shape = new THREE.Shape();
  shape.moveTo(-x + r, -z); shape.lineTo(x - r, -z); shape.quadraticCurveTo(x, -z, x, -z + r);
  shape.lineTo(x, z - r); shape.quadraticCurveTo(x, z, x - r, z);
  shape.lineTo(-x + r, z); shape.quadraticCurveTo(-x, z, -x, z - r);
  shape.lineTo(-x, -z + r); shape.quadraticCurveTo(-x, -z, -x + r, -z); shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth: .4, bevelEnabled: false, curveSegments: 8 });
  g.rotateX(-Math.PI / 2); g.translate(0, -.4, 0);
  buttons.set(key, g); return g;
}
