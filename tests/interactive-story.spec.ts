import { test, expect } from "@playwright/test";
import * as THREE from "three";
import { openJourney } from "./helpers";

test("background toys stay clickable and compact journey prompts open named resume examples", async ({ page }) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 1100, height: 800 });
  await page.clock.install();
  await openJourney(page);
  await expect(page.getByText("Preparing physics & scenery…")).toHaveCount(0, { timeout: 60000 });
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 2000));
  const canvas = page.locator("canvas"), read = () => canvas.evaluate((el) => JSON.parse(el.dataset.player!));
  async function clickWorld(point: THREE.Vector3) {
    const p = await read(), box = (await canvas.boundingBox())!;
    const camera = new THREE.PerspectiveCamera(48, box.width / box.height, .1, 480);
    camera.position.fromArray(p.camera); camera.quaternion.fromArray(p.cameraQuaternion); camera.updateMatrixWorld();
    point.project(camera);
    const x = box.x + (point.x + 1) * box.width / 2, y = box.y + (1 - point.y) * box.height / 2;
    expect(x).toBeGreaterThan(0); expect(x).toBeLessThan(box.width);
    await page.mouse.click(x, y);
    await page.clock.fastForward(1000);
  }
  const key = new THREE.Vector3(-2.5, 1.2, -1.875).applyEuler(new THREE.Euler(.1, -.3, -.08)).add(new THREE.Vector3(-15, 1, -24));
  await clickWorld(key);
  await expect.poll(() => canvas.evaluate((el) => JSON.parse(el.dataset.toys || "{}").keyboard)).toBe("1");
  const search = new THREE.Vector3(-1.5, 0, .22).applyEuler(new THREE.Euler(0, -.2, 0)).add(new THREE.Vector3(14, 3, -13));
  await clickWorld(search);
  for (let i = 0; i < 15; i++) await page.clock.fastForward(80);
  await expect.poll(() => canvas.evaluate((el) => JSON.parse(el.dataset.toys || "{}").search)).toBe("Hello, Lily!");
  await expect(page.getByRole("button", { name: "Press E to read more" })).not.toContainText("Making the interface your own");
  await page.mouse.move(550, 650);
  await page.keyboard.down("KeyW");
  for (let i = 0; i < 30 && (await read()).z > -4.5; i++) await page.clock.fastForward(50);
  await page.keyboard.down("Space");
  for (let i = 0; i < 25 && (await read()).z > -8; i++) await page.clock.fastForward(50);
  await page.keyboard.up("Space"); await page.keyboard.up("KeyW");
  for (let i = 0; i < 14; i++) await page.clock.fastForward(50);
  await expect(page.getByRole("button", { name: "Press E: Explore UI design" })).toContainText("BROWSER → REACT");
  await page.screenshot({ path: "test-results/journey-prompt-front.png" });
  await page.keyboard.press("e");
  const dialog = page.getByRole("dialog", { name: "OMAL SOLUTIONS" });
  await expect(dialog.getByRole("heading", { name: "OMAL SOLUTIONS", exact: true })).toBeVisible();
  await expect(dialog).toContainText("15+ high-fidelity Figma prototypes");
  await expect(dialog).not.toContainText("This browser is where a design becomes an interface");
  await expect(dialog).toContainText("my journey through frontend");
  await expect(dialog.locator(".story-example p")).toHaveCount(2);
  expect(await dialog.evaluate(el => {
    const heading = el.querySelector("h2")!, description = el.querySelector(".story-example p")!;
    return !!(heading.compareDocumentPosition(description) & Node.DOCUMENT_POSITION_FOLLOWING);
  })).toBe(true);
  await page.screenshot({ path: "test-results/journey-example-popup.png" });
  await page.keyboard.press("Escape");
  for (let i = 0; i < 8; i++) await page.clock.fastForward(50);
  await expect(dialog).toHaveCount(0);
});
