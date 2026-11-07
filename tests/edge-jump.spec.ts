import { openJourney } from "./helpers";
import { test, expect } from "@playwright/test";

test("can jump with the center beyond a platform edge, without a midair second jump", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1000, height: 750 });
  await page.clock.install();
  await openJourney(page);
  await expect(page.getByText("Preparing physics & scenery…")).toHaveCount(0, {
    timeout: 45000,
  });
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 2000));
  const state = () =>
    page.locator("canvas").evaluate((el) => JSON.parse(el.dataset.player!));
  await page.keyboard.down("KeyD");
  for (let i = 0; i < 70 && (await state()).x < 5.85; i++)
    await page.clock.fastForward(16);
  await page.keyboard.up("KeyD");
  await page.clock.fastForward(16);
  const edge = await state();
  expect(edge.x).toBeGreaterThan(5.85);
  expect(edge.x).toBeLessThan(6.18);
  await page.keyboard.down("Space");
  await page.clock.fastForward(50);
  await page.keyboard.up("Space");
  await page.clock.fastForward(100);
  const jumped = await state();
  expect(jumped.y).toBeGreaterThan(edge.y + 0.5);
  expect(jumped.vy).toBeGreaterThan(0);
  await page.keyboard.down("Space");
  await page.clock.fastForward(50);
  const midair = await state();
  expect(midair.vy).toBeLessThan(jumped.vy);
  await page.keyboard.up("Space");
});

test("a fresh jump recovers a reachable side ledge without unlimited wall jumps", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.clock.install();
  await openJourney(page);
  await expect(page.getByText("Preparing physics & scenery…")).toHaveCount(0, {
    timeout: 45000,
  });
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 2000));
  const state = () =>
    page.locator("canvas").evaluate((el) => JSON.parse(el.dataset.player!));
  await page.keyboard.down("KeyD");
  for (let i = 0; i < 70 && (await state()).x < 6.05; i++)
    await page.clock.fastForward(16);
  await page.keyboard.up("KeyD");
  await page.clock.fastForward(16);
  // Let ground grace expire while still within reach of the side of the island.
  for (let i = 0; i < 4; i++) await page.clock.fastForward(50);
  const hanging = await state();
  expect(hanging.x).toBeGreaterThan(6.1);
  expect(hanging.x).toBeLessThan(6.45);
  expect(hanging.vy).toBeLessThan(-1);
  await page.keyboard.down("Space");
  await page.clock.fastForward(50);
  await page.keyboard.up("Space");
  for (let i = 0; i < 5; i++) await page.clock.fastForward(50);
  const climbing = await state();
  expect(climbing.y).toBeGreaterThan(hanging.y + 0.6);
  expect(climbing.x).toBeLessThan(hanging.x - 0.1);
  await page.keyboard.down("Space");
  await page.clock.fastForward(50);
  expect((await state()).vy).toBeLessThan(climbing.vy);
  await page.keyboard.up("Space");
  for (let i = 0; i < 20; i++) await page.clock.fastForward(50);
  const landed = await state();
  expect(landed.x).toBeLessThan(5.85);
  expect(landed.y).toBeGreaterThan(0.45);
  expect(Math.abs(landed.vy)).toBeLessThan(0.1);
});

test("Jump recovers onto the trash bin when its lid is near head height", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 1100, height: 800 });
  await page.clock.install();
  await openJourney(page);
  await expect(page.getByText("Preparing physics & scenery…")).toHaveCount(0, {
    timeout: 45000,
  });
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 2000));
  const read = () =>
    page.locator("canvas").evaluate((el) => JSON.parse(el.dataset.player!));
  const step = async (n: number) => {
    for (let i = 0; i < n; i++) await page.clock.fastForward(50);
  };
  const walk = async (key: string, done: (p: any) => boolean) => {
    await page.keyboard.down(key);
    for (let i = 0; i < 100 && !done(await read()); i++)
      await page.clock.fastForward(20);
    await page.keyboard.up(key);
    await page.clock.fastForward(16);
    expect(done(await read())).toBeTruthy();
  };
  await walk("KeyW", (p) => p.z < -4.5);
  await page.keyboard.down("Space");
  await walk("KeyW", (p) => p.z < -7.6);
  await page.keyboard.up("Space");
  await step(12);
  const bin = await page
    .locator("canvas")
    .evaluate((el) =>
      JSON.parse(el.dataset.course!).find((p: any) => p.kind === "trash"),
    );
  await walk("KeyD", (p) => p.x > bin.x - 0.1);
  await walk("KeyW", (p) => p.z < -10.8);
  await page.keyboard.down("Space");
  await walk("KeyW", (p) => p.z < bin.z + 0.6);
  await page.keyboard.up("Space");
  await step(12);
  expect((await read()).y).toBeGreaterThan(bin.y + 0.5);
  await walk("KeyD", (p) => p.x > bin.x + bin.width / 2 + 0.2);
  for (let i = 0; i < 40 && (await read()).y > bin.y - 1.25; i++)
    await page.clock.fastForward(20);
  const hanging = await read();
  expect(hanging.x).toBeLessThan(bin.x + bin.width / 2 + 0.7);
  expect(bin.y - hanging.y).toBeGreaterThan(1);
  expect(bin.y - hanging.y).toBeLessThan(1.8);

  await page.keyboard.down("Space");
  await step(1);
  await page.keyboard.up("Space");
  await step(26);
  const recovered = await read();
  expect(recovered.respawns).toBe(hanging.respawns);
  expect(
    await page.locator("canvas").getAttribute("data-ledge-assist"),
  ).toBeTruthy();
  expect(recovered.x).toBeLessThan(bin.x + bin.width / 2);
  expect(recovered.x).toBeGreaterThan(bin.x - bin.width / 2);
  expect(recovered.y).toBeGreaterThan(bin.y + 0.5);
  expect(Math.abs(recovered.vy)).toBeLessThan(0.15);
  await page.screenshot({ path: "test-results/bin-side-recovered.png" });
});

test("Space jumps while continuing to run up the browser ramp", async ({
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
  await page.keyboard.down("KeyW");
  for (let i = 0; i < 70 && (await read()).z > -8.2; i++)
    await page.clock.fastForward(20);
  const before = await read();
  expect(before.z).toBeLessThan(-8);
  await page.keyboard.down("Space");
  for (let i = 0; i < 4; i++) await page.clock.fastForward(50);
  const jumped = await read();
  expect(jumped.y).toBeGreaterThan(before.y + 0.5);
  expect(jumped.vy).toBeGreaterThan(2);
  await page.keyboard.up("Space");
  await page.keyboard.up("KeyW");
});
