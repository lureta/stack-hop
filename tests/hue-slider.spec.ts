import { test, expect } from "@playwright/test";
import * as THREE from "three";
import { frontendPlatforms } from "../src/data/course";
import { pickerLayout } from "../src/data/colorPicker";
import { openJourney } from "./helpers";
test("hue strip drags without orbiting the camera", async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1100, height: 800 });
  await page.clock.install();
  await openJourney(page);
  await expect(page.getByText("Preparing physics & scenery…")).toHaveCount(0, { timeout: 60000 });
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 2000));
  const canvas = page.locator("canvas"), box = (await canvas.boundingBox())!;
  const read = () => canvas.evaluate(el => JSON.parse(el.dataset.player!));
  const before = await read();
  const camera = new THREE.PerspectiveCamera(48, box.width / box.height, .1, 480);
  camera.position.fromArray(before.camera); camera.quaternion.fromArray(before.cameraQuaternion); camera.updateMatrixWorld();
  const picker = frontendPlatforms.find(p => p.kind === "colorpicker")!;
  const layout = pickerLayout(picker.width, picker.depth);
  function project(z: number) {
    const v = new THREE.Vector3(picker.x + layout.hueX, picker.y + .12, picker.z + layout.wellZ + z).project(camera);
    return { x: box.x + (v.x + 1) * box.width / 2, y: box.y + (1 - v.y) * box.height / 2 };
  }
  const start = project(2), end = project(-2);
  await page.mouse.move(start.x, start.y); await page.mouse.down();
  await expect(canvas).toHaveAttribute("data-widget-drag", "hue");
  await page.mouse.move(end.x, end.y, { steps: 12 });
  await page.clock.fastForward(100);
  const during = await read();
  expect(during.cameraQuaternion).toEqual(before.cameraQuaternion);
  await page.mouse.up();
  await expect(canvas).not.toHaveAttribute("data-widget-drag");
});
