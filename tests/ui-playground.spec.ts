import { test, expect } from "@playwright/test";
import * as THREE from "three";
import { frontendExtras, frontendPlatforms } from "../src/data/course";
import { buttonGeometry, letterGeometry, uiFonts } from "../src/data/uiPlaygroundGeometry";

test("typography platforms are distinct extruded glyphs with open negative space", () => {
  const letters = frontendExtras.filter((p) => p.kind === "letter");
  expect(letters).toHaveLength(3);
  expect(new Set(uiFonts.map((f) => f.data.familyName)).size).toBe(3);
  const counts = [];
  for (const p of letters) {
    const g = letterGeometry(p.glyph!, p.fontVariant!, p.width, p.depth);
    g.computeBoundingBox();
    expect(g.boundingBox!.max.y).toBeCloseTo(0);
    expect(g.boundingBox!.min.y).toBeCloseTo(-.5);
    counts.push(g.attributes.position.count);
    const mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
    mesh.updateMatrixWorld();
    const ray = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0));
    let filled = 0, total = 0;
    for (let x = -1.6; x <= 1.6; x += .2) for (let z = -1.6; z <= 1.6; z += .2) {
      ray.ray.origin.set(x, 2, z); total++; if (ray.intersectObject(mesh).length) filled++;
    }
    expect(filled / total).toBeGreaterThan(.1);
    expect(filled / total).toBeLessThan(.85);
  }
  expect(new Set(counts).size).toBe(3);
});
test("giant buttons have rounded cap geometry and the requested buttons remain", () => {
  expect(frontendPlatforms.some((p) => p.kind === "html")).toBe(false);
  expect(frontendPlatforms.some((p) => p.kind === "button" && p.motion === "press")).toBe(true);
  expect(frontendPlatforms.filter((p) => p.kind === "button" && p.motion === "press")).toHaveLength(2);
  expect(frontendExtras.some((p) => p.kind === "button")).toBe(false);
  expect(frontendExtras.some((p) => p.kind === "tag")).toBe(false);
  const geometry = buttonGeometry(5.5, 5.2);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })); mesh.updateMatrixWorld();
  const ray = new THREE.Raycaster(new THREE.Vector3(2.7, 2, 2.55), new THREE.Vector3(0, -1, 0));
  expect(ray.intersectObject(mesh)).toHaveLength(0);
  ray.ray.origin.set(0, 2, 0); expect(ray.intersectObject(mesh).length).toBeGreaterThan(0);
});
