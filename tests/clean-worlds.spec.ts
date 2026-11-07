import { test, expect } from "@playwright/test";
import { openJourney } from "./helpers";
test("cleaned worlds load with their existing portfolio interactions", async ({ page }) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.setViewportSize({ width: 1100, height: 800 });
  await openJourney(page);
  await expect(page.getByText("Preparing physics & scenery…")).toHaveCount(0, { timeout: 60000 });
  for (const world of ["Backend", "Database", "Cloud", "Launch"]) {
    await page.getByRole("button", { name: `Teleport to ${world}`, exact: true }).click();
    await expect.poll(() => page.locator("canvas").evaluate(el => JSON.parse(el.dataset.player!).respawns)).toBe(0);
    await page.screenshot({ path: `test-results/clean-${world.toLowerCase()}.png` });
  }
  expect(errors).toEqual([]);
});
