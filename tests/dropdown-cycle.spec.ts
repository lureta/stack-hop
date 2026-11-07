import { test, expect } from "@playwright/test";
import { dropdownRide } from "../src/data/frontendMotion";

test("dropdown repeatedly drops and retracts with boarding and exit pauses", () => {
  expect(dropdownRide(0)).toBe(0);
  expect(dropdownRide(1.8)).toBe(0);
  expect(dropdownRide(5)).toBe(4.2);
  expect(dropdownRide(6.8)).toBe(4.2);
  expect(dropdownRide(10)).toBe(0);
  for (let t = 0; t <= 10; t += .05) {
    expect(dropdownRide(t + 10)).toBeCloseTo(dropdownRide(t), 9);
    expect(Math.abs(dropdownRide(t + .001) - dropdownRide(t))).toBeLessThan(.003);
  }
  expect(dropdownRide(3)).toBeLessThan(dropdownRide(4));
  expect(dropdownRide(8)).toBeGreaterThan(dropdownRide(9));
});
