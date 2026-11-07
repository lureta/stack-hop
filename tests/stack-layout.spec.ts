import { test, expect } from "@playwright/test";
import * as THREE from "three";
import { allPlatforms, stackPlatforms, bridgeSteps, frontendPlatforms } from "../src/data/course";
import { levels } from "../src/data/levels";
import { launchSite, stackLayouts } from "../src/data/stackJourney";
import { stackHull, stackGeometry } from "../src/data/stackGeometry";

test("expanded worlds have varied object routes with jumpable gaps and usable lift exits", () => {
  expect(new Set(allPlatforms.map((p) => p.id)).size).toBe(allPlatforms.length);
  expect(frontendPlatforms).toHaveLength(23);
  for (let stage = 1; stage < 5; stage++) {
    const route = stackPlatforms.filter((p) => p.stage === stage);
    expect(route.length).toBeGreaterThanOrEqual(11);
    expect(new Set(route.map((p) => p.kind)).size).toBeGreaterThanOrEqual(5);
    expect(Math.max(...route.map((p) => p.x)) - Math.min(...route.map((p) => p.x))).toBeGreaterThanOrEqual(6);
    const steps = [{ x: 0, y: levels[stage].y - .08, z: levels[stage].z, width: 11.7, depth: 11.7, motion: "static" },
      ...route, ...(stage < 4 ? [bridgeSteps[stage], { x: 0, y: levels[stage + 1].y - .08, z: levels[stage + 1].z, width: 11.7, depth: 11.7, motion: "static" }] : [])];
    for (let i = 1; i < steps.length; i++) {
      const a = steps[i - 1], b = steps[i];
      const dy = b.y - a.y - (a.motion === "elevator" ? 3.2 : 0);
      const discriminant = 8.2 ** 2 - 44 * dy;
      expect(discriminant, `world ${stage}, jump ${i} height`).toBeGreaterThan(0);
      const flight = (8.2 + Math.sqrt(discriminant)) / 22;
      const gapX = Math.max(0, Math.abs(b.x - a.x) - (a.width + b.width) / 2 + .65);
      const gapZ = Math.max(0, Math.abs(b.z - a.z) - (a.depth + b.depth) / 2 + .65);
      expect(Math.hypot(gapX, gapZ), `world ${stage}, jump ${i} gap`).toBeLessThan(flight * 6.7);
    }
  }
  expect(stackLayouts[1].some((s) => s[0] === "auth")).toBe(true);
  expect(stackLayouts[2].some((s) => s[0] === "dbJoin")).toBe(true);
  expect(stackLayouts[3].some((s) => s[0] === "satellite")).toBe(true);
  const pad = stackPlatforms.find((p) => p.kind === "deployPad")!;
  expect(Math.abs(pad.z - levels[4].z - launchSite.offsetZ)).toBeLessThan(pad.depth / 2 - 2);
  expect(pad.y).toBeCloseTo(levels[4].y + launchSite.height);
});

test("pipe, bucket, and shard hulls follow their curved object silhouettes", () => {
  for (const kind of ["apiPipe", "cloudBucket", "dbShard"]) {
    const vertices = stackHull(kind, 4.8, 5);
    const bounds = new THREE.Box3().setFromBufferAttribute(new THREE.BufferAttribute(vertices, 3));
    expect(bounds.max.y).toBeCloseTo(0);
    expect(bounds.min.y).toBeLessThan(-2);
    expect(bounds.max.x - bounds.min.x).toBeGreaterThan(4);
    if (kind === "apiPipe") {
      const geometry = stackGeometry(kind, 4.8, 5);
      const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
      mesh.updateMatrixWorld();
      const ray = new THREE.Raycaster(new THREE.Vector3(1.5, 2, 0), new THREE.Vector3(0, -1, 0));
      expect(ray.intersectObject(mesh)[0].point.y).toBeLessThan(-.4);
    }
  }
});
