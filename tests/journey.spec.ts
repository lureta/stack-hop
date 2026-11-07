import { openJourney } from "./helpers";
import { test, expect } from "@playwright/test";
test("portfolio is available without gameplay, with accessible dialogs", async ({
  page,
}) => {
  await openJourney(page);
  await page
    .getByRole("button", { name: /View portfolio without playing/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Good teams. Meaningful work." }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cram-Cam" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Hi, I’m Lily Ureta." }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "timeEntriesForStudying", exact: true }),
  ).toBeVisible();
  const banking = page.locator(".project-card").filter({
    has: page.getByRole("heading", { name: "Capital One Banking Demo", exact: true }),
  });
  await expect(banking).toBeVisible();
  await expect(banking.locator('a[href="https://github.com/lureta/capital-one-demo"]')).toBeVisible();
  await expect(
    page.locator('a[href="https://github.com/sidblwl/Cram-Cam"]'),
  ).toBeVisible();
  await expect(
    page.locator('a[href="https://lureta.github.io/timeEntriesForStudying/"]'),
  ).toBeVisible();
  const resume = await page.request.get("/Lily-Ureta-Resume.pdf");
  expect(resume.ok()).toBeTruthy();
  expect((await resume.body()).subarray(0, 5).toString()).toBe("%PDF-");
  await page.getByRole("button", { name: "Resume ↗", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.screenshot({ path: "test-results/portfolio.png", fullPage: true });
});
test("all stages teleport, save, show displays, and Launch begins at its checkpoint", async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await openJourney(page);
  await expect(page.getByText("Preparing physics & scenery…")).toHaveCount(0, {
    timeout: 45000,
  });
  for (let i = 0; i < 5; i++) {
    await page
      .getByRole("button", {
        name: `Teleport to ${["Frontend", "Backend", "Database", "Cloud", "Launch"][i]}`,
        exact: true,
      })
      .click();
    await expect
      .poll(() =>
        page.evaluate(() => localStorage.getItem("tech-journey-checkpoint-v1")),
      )
      .toBe(String(i));
    if (i > 0)
      await expect
        .poll(() => page.locator("canvas").getAttribute("data-checkpoint"))
        .toBe(String(i));
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.waitForTimeout(250);
    await page.screenshot({ path: `test-results/world-${i}.png` });
    if (i < 4) {
      await expect(
        page.getByRole("button", {
          name: "Press E to read more",
        }),
      ).toBeVisible({ timeout: 10000 });
      await page.keyboard.press("e");
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.keyboard.press("Escape");
    }
  }
  await page.reload();
  await page
    .getByRole("button", { name: "Enter the Stack", exact: true })
    .click();
  await expect(page.getByText("Preparing physics & scenery…")).toHaveCount(0, {
    timeout: 45000,
  });
  await expect(page.locator(".stage-title h2")).toHaveText("Ready for liftoff");
  // The new deployment route must be traversed before the rocket is in range.
  await expect(page.getByRole("button", { name: "E Deploy!" })).toHaveCount(0);
  await page.keyboard.press("e");
  await expect(page.getByRole("heading", { name: "Successfully deployed!" })).toHaveCount(0);
  await page.screenshot({ path: "test-results/launch-entry.png" });
  expect(errors).toEqual([]);
});
test("mobile opens conventional portfolio", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openJourney(page);
  await expect(
    page.getByRole("heading", { name: "Good teams. Meaningful work." }),
  ).toBeVisible();
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 390);
});
test("real physics: grounded collision, jumping, falling, saved-stage respawn, and movement pause", async ({
  page,
}) => {
  await openJourney(page);
  await expect(page.getByText("Preparing physics & scenery…")).toHaveCount(0, {
    timeout: 45000,
  });
  test.setTimeout(120000);
  const pos = () =>
    page.locator("canvas").evaluate((el) => JSON.parse(el.dataset.player!));
  await expect.poll(async () => Math.abs((await pos()).vy)).toBeLessThan(0.1);
  await expect.poll(async () => (await pos()).y).toBeLessThan(0.9);
  await expect(page.locator("canvas")).toBeFocused();
  const initial = await pos();
  await page.keyboard.down("Space");
  await page.waitForFunction(
    (height) =>
      JSON.parse(document.querySelector("canvas")!.dataset.player!).y > height,
    initial.y + 0.6,
  );
  await page.keyboard.up("Space");
  await expect
    .poll(async () => (await pos()).y, { timeout: 5000 })
    .toBeLessThan(1.2);
  await page
    .getByRole("button", { name: "Teleport to Database", exact: true })
    .click();
  await expect.poll(async () => (await pos()).z).toBeLessThan(-140);
  await page.getByRole("button", { name: "Settings" }).click();
  const paused = await pos();
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(600);
  await page.keyboard.up("KeyD");
  expect(Math.abs((await pos()).x - paused.x)).toBeLessThan(0.3);
  await page.keyboard.press("Escape");
  await page.keyboard.down("KeyD");
  await expect.poll(async () => (await pos()).x).toBeGreaterThan(8);
  await page.keyboard.up("KeyD");
  await expect(page.getByRole("status")).toContainText("little tumble", {
    timeout: 12000,
  });
  await expect.poll(async () => (await pos()).x).toBeLessThan(2);
  await expect.poll(async () => (await pos()).z).toBeLessThan(-140);
  await expect.poll(async () => (await pos()).y).toBeGreaterThan(0);
});

test("WASD and arrow keys move in all four directions after clicking the world", async ({
  page,
}) => {
  await openJourney(page);
  await expect(page.getByText("Preparing physics & scenery…")).toHaveCount(0, {
    timeout: 45000,
  });
  const canvas = page.locator("canvas");
  const position = () =>
    canvas.evaluate((el) => JSON.parse(el.dataset.player!));
  await canvas.click({ position: { x: 700, y: 300 } });
  for (const [key, axis, sign] of [
    ["w", "z", -1],
    ["s", "z", 1],
    ["a", "x", -1],
    ["d", "x", 1],
    ["ArrowUp", "z", -1],
    ["ArrowDown", "z", 1],
    ["ArrowLeft", "x", -1],
    ["ArrowRight", "x", 1],
  ] as const) {
    const before = await position();
    await page.keyboard.down(key);
    await expect
      .poll(async () => ((await position())[axis] - before[axis]) * sign)
      .toBeGreaterThan(0.5);
    await page.keyboard.up(key);
  }
});

test("canvas takes focus and movement accepts keys without physical keyboard codes", async ({
  page,
}) => {
  await openJourney(page);
  await expect(page.getByText("Preparing physics & scenery…")).toHaveCount(0, {
    timeout: 45000,
  });
  const canvas = page.locator("canvas");
  const position = () =>
    canvas.evaluate((el) => JSON.parse(el.dataset.player!));
  await canvas.click({ position: { x: 700, y: 300 } });
  await expect(canvas).toBeFocused();
  const before = await position();
  await canvas.evaluate((el) =>
    el.dispatchEvent(
      new KeyboardEvent("keydown", { key: "w", code: "", bubbles: true }),
    ),
  );
  await expect
    .poll(async () => before.z - (await position()).z)
    .toBeGreaterThan(0.5);
  await canvas.evaluate((el) =>
    el.dispatchEvent(
      new KeyboardEvent("keyup", { key: "w", code: "", bubbles: true }),
    ),
  );
  await page.getByRole("button", { name: "Settings" }).click();
  await page.keyboard.press("Escape");
  const resumed = await position();
  await page.keyboard.down("ArrowRight");
  await expect
    .poll(async () => (await position()).x - resumed.x)
    .toBeGreaterThan(0.5);
  await page.keyboard.up("ArrowRight");
});

test("checkpoints glow while the face stays happy; jump and fall expressions still work", async ({
  page,
}) => {
  await openJourney(page);
  await expect(page.getByText("Preparing physics & scenery…")).toHaveCount(0, {
    timeout: 45000,
  });
  const canvas = page.locator("canvas");
  const state = () => canvas.evaluate((el) => JSON.parse(el.dataset.player!));
  const expression = (name: string, timeout = 8000) =>
    page.waitForFunction(
      (name) =>
        JSON.parse(document.querySelector("canvas")!.dataset.player!)
          .expression === name,
      name,
      { timeout },
    );
  await expression("idle");
  await page
    .getByRole("button", { name: "Teleport to Backend", exact: true })
    .click();
  await expect
    .poll(() => canvas.getAttribute("data-checkpoint-glow"))
    .toBe("1");
  await expression("idle");
  await page.keyboard.down("Space");
  await expression("jumping");
  await page.keyboard.up("Space");
  await expression("idle");
  await page.screenshot({ path: "test-results/new-avatar-game.png" });
  await page.keyboard.down("KeyD");
  await expect.poll(async () => (await state()).x).toBeGreaterThan(8);
  await page.keyboard.up("KeyD");
  await expression("falling");
  await expect
    .poll(() => canvas.getAttribute("data-checkpoint-glow"))
    .toBe("1");
  await expect.poll(async () => (await state()).z).toBeLessThan(-70);
  await expect.poll(async () => (await state()).x).toBeLessThan(2);
  await expression("idle");
});
