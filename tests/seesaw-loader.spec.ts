import { test, expect } from "@playwright/test";
import * as THREE from "three";
import { frontendPlatforms } from "../src/data/course";
import { toggleGeometry, TOGGLE_MAX_TILT } from "../src/data/toggleGeometry";
import { loadingBarGeometry } from "../src/data/frontendShapes";

test("spinner requires the raised seesaw but stays within normal jump height from its exit", () => {
  const board = frontendPlatforms.find((p) => p.kind === "toggle")!;
  const spinner = frontendPlatforms.find((p) => p.kind === "spinner")!;
  const parts = toggleGeometry(board.width, board.depth);
  expect(spinner.y - board.y - parts.knobTop).toBeGreaterThan(4);
  const exitHeight = board.y + (board.depth / 2 - .7) * Math.sin(TOGGLE_MAX_TILT) + parts.rimTop * Math.cos(TOGGLE_MAX_TILT);
  expect(spinner.y - exitHeight).toBeGreaterThan(0);
  expect(spinner.y - exitHeight).toBeLessThan(1.4);
});
test("spinner segments have rounded pill ends and an appropriately shallow thickness", () => {
  const geometry = loadingBarGeometry(4.8);
  geometry.computeBoundingBox();
  expect(geometry.boundingBox!.max.y).toBeCloseTo(0);
  expect(geometry.boundingBox!.min.y).toBeCloseTo(-.28);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  mesh.updateMatrixWorld();
  const ray = new THREE.Raycaster(new THREE.Vector3(.25, 2, .5), new THREE.Vector3(0, -1, 0));
  expect(ray.intersectObject(mesh)).toHaveLength(0);
  ray.ray.origin.x = 0;
  expect(ray.intersectObject(mesh).length).toBeGreaterThan(0);
});
