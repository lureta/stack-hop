import { openJourney } from "./helpers";
import { test, expect } from "@playwright/test";

test("dragging rotates the camera, keeps the player still, follows movement, and resets on teleport", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.clock.install();
  await openJourney(page);
  await expect(page.getByText("Preparing physics & scenery…")).toHaveCount(0, {
    timeout: 45000,
  });
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 2000));
  const read = () =>
    page.locator("canvas").evaluate((el) => JSON.parse(el.dataset.player!));
  const step = async (n = 12) => {
    for (let i = 0; i < n; i++) await page.clock.fastForward(50);
  };
  const initial = await read();
  await page.mouse.move(1050, 550);
  await page.mouse.down({ button: "right" });
  await page.mouse.move(1250, 650, { steps: 10 });
  await page.mouse.up({ button: "right" });
  await step();
  const rotated = await read();
  expect(Math.abs(rotated.camera[0] - initial.camera[0])).toBeGreaterThan(3);
  expect(rotated.camera[1]).toBeGreaterThan(initial.camera[1]);
  expect(Math.abs(rotated.x - initial.x)).toBeLessThan(0.1);
  expect(Math.abs(rotated.z - initial.z)).toBeLessThan(0.1);
  // Mouse movement after release does not keep rotating the view.
  await step();
  const released = await read();
  await page.mouse.move(950, 500);
  await step();
  expect(Math.abs((await read()).camera[0] - released.camera[0])).toBeLessThan(
    0.15,
  );
  const distance = (s: any) =>
    Math.hypot(s.camera[0] - s.x, s.camera[1] - (s.y + 1.4), s.camera[2] - s.z);
  await page.mouse.wheel(0, -200);
  await step();
  const zoomed = await read();
  expect(distance(zoomed)).toBeLessThan(distance(rotated) - 1);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await page.keyboard.down("KeyW");
  await step(6);
  await page.keyboard.up("KeyW");
  await step();
  const moved = await read();
  expect(Math.hypot(moved.x - initial.x, moved.z - initial.z)).toBeGreaterThan(
    1,
  );
  expect(moved.x).toBeGreaterThan(initial.x + 0.5);
  expect(
    Math.abs(moved.camera[0] - moved.x - (zoomed.camera[0] - zoomed.x)),
  ).toBeLessThan(0.4);
  await page
    .getByRole("button", { name: "Teleport to Backend", exact: true })
    .click();
  await step();
  const reset = await read();
  expect(reset.z).toBeLessThan(-70);
  expect(Math.abs(reset.camera[0] - reset.x)).toBeLessThan(0.2);
  expect(reset.camera[2] - reset.z).toBeGreaterThan(10);
});

test("returning to the game covers startup and the playing camera stays farther back", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.clock.install();
  await openJourney(page);
  const waitReady = () =>
    expect(page.getByText("Preparing physics & scenery…")).toHaveCount(0, {
      timeout: 45000,
    });
  await waitReady();
  await page.getByRole("button", { name: "Projects", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Ideas, brought to life." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await expect(page.locator(".startup-screen")).toBeVisible();
  await waitReady();
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  await page.keyboard.down("KeyW");
  for (let i = 0; i < 6; i++) await page.clock.fastForward(50);
  await page.keyboard.up("KeyW");
  for (let i = 0; i < 24; i++) await page.clock.fastForward(50);
  const state = await page
    .locator("canvas")
    .evaluate((el) => JSON.parse(el.dataset.player!));
  expect(state.camera[2] - state.z).toBeGreaterThan(11.5);
  await page.screenshot({ path: "test-results/wider-gameplay-camera.png" });
});
