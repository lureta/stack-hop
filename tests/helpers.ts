import { expect, type Page } from "@playwright/test";
export async function openJourney(page: Page) {
  await page.goto("/");
  if ((page.viewportSize()?.width ?? 1440) >= 760) {
    await expect(
      page.getByRole("button", { name: "Enter the Stack", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Enter the Stack", exact: true })
      .click();
  }
}
