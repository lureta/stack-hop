import { test, expect } from "@playwright/test";

test("title screen shows the stack logo and how to play; only the five world buttons teleport", async ({
  page,
}) => {
  await page.goto("/");
  const title = page.getByRole("region", { name: "Stack Hop title screen" });
  await expect(title).toBeVisible();
  await expect(title.getByRole("heading", { name: "My Journey Through the Tech Stack", exact: true })).toBeVisible();
  await expect(title).toContainText("Hi, I'm Lily! Welcome to my interactive portfolio inspired by Roblox obbies.");
  await expect(title.getByLabel("Arrow keys")).toBeVisible();
  await expect(title).not.toContainText("Right-drag");
  await expect(title).not.toContainText("View portfolio");

  await expect(
    title.getByRole("heading", { name: "How to play" }),
  ).toBeVisible();
  await expect(title.locator("svg")).toBeVisible();
  await page.screenshot({ path: "test-results/stack-hop-title.png" });
  await page
    .getByRole("button", { name: "Enter the Stack", exact: true })
    .click();
  await expect(page.getByText("Preparing physics & scenery…")).toHaveCount(0, {
    timeout: 45000,
  });
  await expect(title).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Open teleport menu" }),
  ).toHaveCount(0);
  await expect(page.locator(".stage-title")).not.toContainText(
    "Meet the human",
  );
  await expect(page.locator(".stage-title > span")).toHaveCount(1);
  await expect(
    page
      .getByRole("navigation", { name: "Teleport to a world" })
      .getByRole("button"),
  ).toHaveCount(5);
  await page.screenshot({ path: "test-results/round-avatar-start.png" });
  await page
    .getByRole("button", { name: "Teleport to Backend", exact: true })
    .click();
  await expect
    .poll(() =>
      page.locator("canvas").evaluate((el) => JSON.parse(el.dataset.player!).y),
    )
    .toBeGreaterThan(30);
  await page.screenshot({ path: "test-results/elevated-backend.png" });
});
