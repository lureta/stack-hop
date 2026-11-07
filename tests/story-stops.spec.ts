import { test, expect } from "@playwright/test";
import { storyStops, storyPlatform } from "../src/data/storyStops";
import { journeySigns } from "../src/data/journeySigns";
test("resume signs cover each world and have valid course-side anchors", () => {
  expect(Object.keys(journeySigns)).toHaveLength(18);
  for (let stage = 0; stage < 5; stage++) expect(storyStops.filter(s => s.stage === stage).length).toBeGreaterThanOrEqual(3);
  for (const stop of storyStops) {
    expect(storyPlatform(stop), stop.id).toBeDefined();
    const sign = journeySigns[stop.id];
    expect(sign.source.length).toBeGreaterThan(10);
    expect(sign.text.length).toBeGreaterThan(80);
    expect(sign.text.split("\n\n")).toHaveLength(2);
    expect(sign.text.split(/\s+/).length).toBeGreaterThan(70);
  }
});
