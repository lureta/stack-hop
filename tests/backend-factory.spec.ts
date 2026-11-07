import { test, expect } from "@playwright/test";
import { backendFactory as state, backendReady, resetBackendFactory, nearbyBackendPanel, backendPoint } from "../src/data/backendFactory";

test("finish remains locked until authentication, validation, endpoint selection, and all repairs succeed", () => {
  resetBackendFactory();
  state.validated = true; state.maze = true;
  for (const i of [0, 1, 2]) state.switches.add(i);
  expect(backendReady()).toBe(false);
  state.token = true;
  expect(backendReady()).toBe(true);
  state.switches.delete(1);
  expect(backendReady()).toBe(false);
  state.switches.add(0); // Repeated activation cannot substitute for the missing switch.
  expect(backendReady()).toBe(false);
  resetBackendFactory();
  expect(state.switches.size).toBe(0);
  expect(state.token || state.validated || state.maze).toBe(false);
});

test("technology dashboards are only reachable near the correct floor and position", () => {
  const p = backendPoint(1);
  expect(nearbyBackendPanel(p.x, p.y + .64, p.z)).toBe(0);
  expect(nearbyBackendPanel(p.x, p.y + 5, p.z)).toBe(-1);
  expect(nearbyBackendPanel(p.x + 10, p.y, p.z)).toBe(-1);
});
