import { test, expect } from "@playwright/test";
import { popupOffset, isNearDropdown } from "../src/data/frontendMotion";

test("popup reverses smoothly and never teleports across its loop boundary", () => {
  expect(popupOffset(4)).toBe(5);
  expect(popupOffset(5)).toBe(0);
  expect(popupOffset(7)).toBe(0);
  expect(popupOffset(8)).toBe(5);
  for (let t = 4.01; t < 5; t += 0.01)
    expect(popupOffset(t)).toBeLessThan(popupOffset(t - 0.01));
  for (let t = 7.01; t < 8; t += 0.01)
    expect(popupOffset(t)).toBeGreaterThan(popupOffset(t - 0.01));
  let previous = popupOffset(0);
  for (let frame = 1; frame <= 1200; frame++) {
    const current = popupOffset(frame / 60);
    expect(current).toBeGreaterThanOrEqual(0);
    expect(current).toBeLessThanOrEqual(5);
    expect(Math.abs(current - previous)).toBeLessThan(0.13);
    previous = current;
  }
  expect(popupOffset(10 - 0.0001)).toBeCloseTo(popupOffset(10 + 0.0001));
});

test("dropdown opens on approach before contact and stays closed on distant floors", () => {
  const menu = { x: -6, y: 18.9, z: -117 };
  expect(isNearDropdown({ x: -5, y: 18.44, z: -112 }, menu)).toBe(true);
  expect(isNearDropdown({ x: -6, y: 23.74, z: -117 }, menu)).toBe(true);
  expect(isNearDropdown({ x: -6, y: 18.9, z: -101 }, menu)).toBe(false);
  expect(isNearDropdown({ x: -6, y: 1, z: -117 }, menu)).toBe(false);
});
