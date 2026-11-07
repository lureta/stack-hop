import { test, expect } from "@playwright/test";
import { openJourney } from "./helpers";

test("world displays connect Lily's experience to the existing projects", async ({ page }) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 960, height: 700 });
  await openJourney(page);
  await expect(page.getByText("Preparing physics & scenery…")).toHaveCount(0, { timeout: 60000 });
  const stages = [
    { name: "Frontend", chapter: 1, text: "Coding With Kids" },
    { name: "Backend", chapter: 2, text: "Oracle" },
    { name: "Database", chapter: 3, text: "timeEntriesForStudying" },
    { name: "Cloud", chapter: 4, text: "UMIACS" },
  ];
  for (const stage of stages) {
    await page.getByRole("button", { name: `Teleport to ${stage.name}`, exact: true }).click();
    await expect(page.getByRole("button", { name: "Press E to read more", exact: true })).toBeVisible();
    await page.keyboard.press("e");
    const dialog = page.getByRole("dialog");
    const chapter = dialog.getByRole("region", { name: `My journey, chapter ${stage.chapter}` });
    await expect(chapter).toBeVisible();
    await expect(chapter).toContainText(stage.text);
    await expect(chapter.locator("li")).toHaveCount(2);
    if (stage.name === "Backend") await expect(dialog.getByRole("heading", { name: "Cram-Cam", exact: true })).toBeVisible();
    if (stage.name === "Cloud") await expect(dialog.getByRole("heading", { name: "Capital One Banking Demo", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  }
});
