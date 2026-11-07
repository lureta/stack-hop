import { openJourney } from "./helpers";
import { test, expect } from "@playwright/test";

test("Frontend has solid app objects, narrow tabs, and an elevated route", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 960, height: 700 });
  await page.clock.install();
  await openJourney(page);
  await expect(page.getByText("Preparing physics & scenery…")).toHaveCount(0, {
    timeout: 45000,
  });
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 2000));
  const canvas = page.locator("canvas");
  const read = () => canvas.evaluate((el) => JSON.parse(el.dataset.player!));
  const platforms = await canvas.evaluate((el) =>
    JSON.parse(el.dataset.course!).filter((p: any) => p.stage === 0 && !p.optional),
  );
  expect(platforms).toHaveLength(24);
  expect(platforms.filter((p: any) => p.kind === "checkbox")).toHaveLength(2);
  expect(platforms.filter((p: any) => p.kind === "folder")).toHaveLength(6);
  for (const removed of ["paper", "music", "palette", "save", "publish"])
    expect(platforms.some((p: any) => p.kind === removed)).toBe(false);
  expect(new Set(platforms.map((p: any) => p.width)).size).toBeGreaterThan(7);
  expect(Math.max(...platforms.map((p: any) => p.y))).toBeGreaterThanOrEqual(7);
  expect(platforms.filter((p: any) => p.kind === "tab")).toHaveLength(3);
  expect(
    platforms
      .filter((p: any) => p.kind === "tab")
      .every((p: any) => p.depth <= 2),
  ).toBeTruthy();
  for (const kind of [
    "trash",
    "gear",
    "folder",
    "dropdown",
    "button",
    "cursor",
    "toggle",
    "spinner",
    "clock",
    "popup",
    "ramp",
    "colorpicker",
  ])
    expect(platforms.some((p: any) => p.kind === kind)).toBeTruthy();
  await page.keyboard.down("KeyW");
  for (let i = 0; i < 30 && (await read()).z > -4.5; i++)
    await page.clock.fastForward(50);
  await page.keyboard.down("Space");
  for (let i = 0; i < 30 && (await read()).z > -7.5; i++)
    await page.clock.fastForward(50);
  await page.keyboard.up("Space");
  await page.keyboard.up("KeyW");
  for (let i = 0; i < 12; i++) await page.clock.fastForward(50);
  const progress = await canvas.evaluate((el) =>
    JSON.parse(el.dataset.frontend!),
  );
  expect(progress.steps).toBeGreaterThan(0);
  await page.screenshot({ path: "test-results/frontend-objects.png" });
});
