import { test, expect } from "@playwright/test";
import * as THREE from "three";
import { loadingBars, uiIconGeometry, iconCollider } from "../src/data/frontendShapes";

test("loading indicator and settings cog have genuinely open centers", () => {
  const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  const ray = new THREE.Raycaster(new THREE.Vector3(0, 2, 0), new THREE.Vector3(0, -1, 0));
  const bars = loadingBars(4.8).map((bar) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(bar.width, bar.height, bar.depth), material);
    mesh.position.set(bar.x, -bar.height / 2, bar.z);
    mesh.rotation.y = bar.angle;
    mesh.updateMatrixWorld();
    return mesh;
  });
  expect(ray.intersectObjects(bars)).toHaveLength(0);
  ray.ray.origin.set(0, 2, 1.7);
  expect(ray.intersectObjects(bars).length).toBeGreaterThan(0);
  const gear = uiIconGeometry("gear", 4.3, 4.8);
  const mesh = new THREE.Mesh(gear, material);
  mesh.updateMatrixWorld();
  ray.ray.origin.set(0, 2, 0);
  expect(ray.intersectObject(mesh)).toHaveLength(0);
  const [vertices, triangles] = iconCollider(gear);
  expect(vertices).toBe(gear.attributes.position.array);
  expect(triangles.length).toBeGreaterThan(0);
  ray.ray.origin.set(0, 2, 1.3);
  expect(ray.intersectObject(mesh).length).toBeGreaterThan(0);
});
