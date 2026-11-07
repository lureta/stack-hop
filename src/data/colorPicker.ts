import * as THREE from "three";

export function hsvColor(hue: number, saturation: number, value: number, target = new THREE.Color()) {
  const h = ((hue % 1) + 1) % 1 * 6;
  const s = THREE.MathUtils.clamp(saturation, 0, 1);
  const v = THREE.MathUtils.clamp(value, 0, 1);
  const c = v * s, x = c * (1 - Math.abs(h % 2 - 1)), m = v - c;
  let r = 0, g = 0, b = 0;
  switch (Math.floor(h) % 6) {
    case 0: r = c; g = x; break;
    case 1: r = x; g = c; break;
    case 2: g = c; b = x; break;
    case 3: g = x; b = c; break;
    case 4: r = x; b = c; break;
    default: r = c; b = x;
  }
  return target.setRGB(r + m, g + m, b + m, THREE.SRGBColorSpace);
}
export function pickerLayout(width: number, depth: number) {
  return { wellX: -0.35, wellZ: -0.6, wellWidth: width - 1.3, wellDepth: depth - 2.6,
    hueX: width / 2 - 0.5, footerZ: depth / 2 - 0.95 };
}
export function samplePicker(layout: ReturnType<typeof pickerLayout>, x: number, z: number) {
  const vertical = (z - layout.wellZ) / layout.wellDepth + 0.5;
  if (vertical < 0 || vertical > 1) return null;
  if (Math.abs(x - layout.hueX) < 0.27) return { type: "hue" as const, hue: 1 - vertical };
  const horizontal = (x - layout.wellX) / layout.wellWidth + 0.5;
  if (horizontal < 0 || horizontal > 1) return null;
  return { type: "well" as const, saturation: horizontal, value: 1 - vertical };
}
