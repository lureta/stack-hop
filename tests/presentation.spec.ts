import { levels } from "../src/data/levels";
import { openJourney } from "./helpers";
import { test, expect } from "@playwright/test";
test("Stack Hop opens with a full-size game, front-facing character, clear reading prompt, and no initial checkpoint", async ({
  page,
}) => {
  await openJourney(page);
  await expect(page.locator(".startup-screen")).toBeVisible();
  await expect(page.locator(".startup-screen")).toHaveCSS(
    "background-color",
    "rgb(230, 223, 239)",
  );
  await expect(page).toHaveTitle(/Stack Hop/);
  await expect(page.getByRole("link", { name: /Stack Hop/ })).toBeVisible();
  await expect(
    page.getByText("MY INTERACTIVE PORTFOLIO JOURNEY"),
  ).toBeVisible();
  await expect(
    page.getByText(
      /LIVE FROM THE CLOUDS|Built with curiosity|Made to be explored|A LITTLE PLAY/,
    ),
  ).toHaveCount(0);
  await expect(page.locator(".game-footer,.intro")).toHaveCount(0);
  await expect(page.getByText("Preparing physics & scenery…")).toHaveCount(0, {
    timeout: 45000,
  });
  const box = await page.locator(".game-window").boundingBox();
  expect(box).toMatchObject({ x: 0, y: 0, width: 1440, height: 1000 });
  await expect(page.locator(".game-window")).toHaveCSS("border-radius", "0px");
  await expect(page.locator(".header")).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );
  await expect(page.locator(".progress")).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );
  const canvas = page.locator("canvas");
  await expect(canvas).not.toHaveAttribute("data-checkpoint", /.+/);
  const state = await canvas.evaluate((el) => JSON.parse(el.dataset.player!));
  expect(Math.abs(state.x)).toBeLessThan(0.01);
  expect(Math.abs(state.z)).toBeLessThan(0.01);
  expect(Math.abs(state.camera[0] - state.x)).toBeLessThan(0.25);
  expect(state.camera[2] - state.z).toBeGreaterThan(10);
  expect(Math.abs(state.heading)).toBeLessThan(0.01);
  for (const world of ["Frontend", "Backend", "Database", "Cloud", "Launch"])
    await expect(
      page.getByRole("button", { name: `Teleport to ${world}`, exact: true }),
    ).toBeVisible();
  const read = page.getByRole("button", {
    name: "Press E to read more",
    exact: true,
  });
  await expect(read).toBeVisible();
  await expect(read).toContainText("E");
  await expect(read).toHaveCSS("animation-name", "none");
  await expect(read).toHaveCSS("box-shadow", "none");
  await expect(read.locator("kbd")).toHaveCSS("animation-name", "none");
  await page.keyboard.press("e");
  await expect(page.getByRole("dialog", { name: "About me" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.screenshot({ path: "test-results/stack-hop-opening.png" });
});
test("repeated deaths return to the saved stage with a stable camera and zero residual movement", async ({
  page,
}) => {
  test.setTimeout(90000);
  await openJourney(page);
  await expect(page.getByText("Preparing physics & scenery…")).toHaveCount(0, {
    timeout: 45000,
  });
  await page
    .getByRole("button", { name: "Teleport to Backend", exact: true })
    .click();
  const state = () =>
    page.locator("canvas").evaluate((el) => JSON.parse(el.dataset.player!));
  await expect.poll(async () => (await state()).z).toBeLessThan(-70);
  await expect.poll(async () => Math.abs((await state()).vy)).toBeLessThan(0.1);
  expect(Math.abs((await state()).x)).toBeLessThan(0.01);
  expect(Math.abs((await state()).z - levels[1].z)).toBeLessThan(0.01);
  await page.screenshot({
    path: "test-results/centered-square-checkpoint.png",
  });
  for (let death = 0; death < 3; death++) {
    await expect
      .poll(async () => Math.abs((await state()).vy))
      .toBeLessThan(0.3);
    const before = (await state()).respawns;
    await page.keyboard.down("KeyD");
    await expect.poll(async () => (await state()).x).toBeGreaterThan(8);
    await page.keyboard.up("KeyD");
    await expect
      .poll(async () => (await state()).respawns, {
        timeout: 12000,
        intervals: [50, 100],
      })
      .toBe(before + 1);
    const samples = await page.evaluate(async () => {
      const samples: any[] = [];
      const start = performance.now();
      await new Promise<void>((resolve) => {
        const sample = () => {
          samples.push(
            JSON.parse(document.querySelector("canvas")!.dataset.player!),
          );
          if (performance.now() - start > 500) resolve();
          else requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      });
      return samples;
    });
    for (const p of samples) {
      expect(p.z).toBeLessThan(-70);
      expect(Math.abs(p.vx)).toBeLessThan(0.2);
      expect(Math.abs(p.vz)).toBeLessThan(0.2);
      expect(Math.abs(p.camera[0] - p.x)).toBeLessThan(0.5);
      expect(p.camera[2] - p.z).toBeGreaterThan(5);
      const [x, y, z, w] = p.cameraQuaternion;
      expect(Math.abs(2 * (x * y + z * w))).toBeLessThan(0.08);
    }
    for (let i = 1; i < samples.length; i++) {
      const a = samples[i - 1].cameraQuaternion,
        b = samples[i].cameraQuaternion,
        dot = Math.abs(
          a.reduce((n: number, x: number, j: number) => n + x * b[j], 0),
        );
      expect(dot).toBeGreaterThan(0.99);
    }
    await expect
      .poll(() =>
        page.evaluate(() => localStorage.getItem("tech-journey-checkpoint-v1")),
      )
      .toBe("1");
  }
});
