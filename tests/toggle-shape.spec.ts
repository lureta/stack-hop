import { test, expect } from "@playwright/test";
import * as THREE from "three";
import { toggleGeometry, TOGGLE_MAX_TILT } from "../src/data/toggleGeometry";

test("toggle has a real recessed pill track and a raised pushable rounded thumb with end clearance", () => {
  const parts = toggleGeometry(7, 12);
  const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  const rim = new THREE.Mesh(parts.rim, material);
  const floor = new THREE.Mesh(parts.floor, material);
  rim.updateMatrixWorld(); floor.updateMatrixWorld();
  const ray = new THREE.Raycaster(new THREE.Vector3(0, 2, 0), new THREE.Vector3(0, -1, 0));
  expect(ray.intersectObject(rim)).toHaveLength(0);
  expect(ray.intersectObject(floor)[0].point.y).toBeCloseTo(parts.floorTop);
  ray.ray.origin.x = parts.sideWalkX;
  expect(ray.intersectObject(rim)[0].point.y).toBeCloseTo(parts.rimTop);
  expect(parts.rimTop - parts.floorTop).toBeGreaterThan(0.3);
  parts.knob.computeBoundingBox();
  const bounds = parts.knob.boundingBox!;
  expect(bounds.max.y - bounds.min.y).toBeGreaterThan(1);
  expect((bounds.max.y - bounds.min.y) / (2 * parts.knobRadius)).toBeLessThan(0.25);
  expect(parts.knobBottom).toBeGreaterThan(parts.floorTop);
  expect(parts.knobTop - parts.rimTop).toBeGreaterThan(0.75);
  expect(Math.sin(TOGGLE_MAX_TILT) * 6).toBeGreaterThan(3.3);
  expect(parts.travel + parts.knobRadius).toBeLessThan(parts.innerDepth / 2 - 0.15);
  expect(2 * parts.knobRadius).toBeLessThan(parts.innerWidth - 0.25);
});

 test("slider reaches both track ends while leaving clearance from the rim", () => {
  for (const depth of [12, 16]) {
    const p = toggleGeometry(7, depth);
    expect(p.innerDepth / 2 - (p.travel + p.knobRadius)).toBeCloseTo(.18);
    expect(-p.travel - p.knobRadius + p.innerDepth / 2).toBeCloseTo(.18);
  }
});
