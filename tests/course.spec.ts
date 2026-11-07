import * as THREE from "three";
import { letterGeometry } from "../src/data/uiPlaygroundGeometry";
import { pickerLayout } from "../src/data/colorPicker";
import { allPlatforms } from "../src/data/course";
import { launchSite } from "../src/data/stackJourney";
import { toggleGeometry } from "../src/data/toggleGeometry";
import { levels } from "../src/data/levels";
import { openJourney } from "./helpers";
import { test, expect } from "@playwright/test";
interface P {
  id: string;
  stage: number;
  index: number;
  x: number;
  y: number;
  z: number;
  width: number;
  depth: number;
  checked?: boolean;
  color?: string;
  hue?: number;
  solid: boolean;
  warning: boolean;
  motion: string;
  kind: string;
  round: boolean;
  optional?: boolean;
  glyph?: string;
  fontVariant?: number;
  press?: number;
  cycle?: number;
  open?: number;
  tilt?: number;
  pitch?: number;
}
interface State {
  player: {
    x: number;
    y: number;
    z: number;
    vy: number;
    vx: number;
    vz: number;
    dt: number;
    expression?: string;
  };
  platforms: P[];
}

test("play the continuous course from Frontend to Production using movement and jumps", async ({
  page,
}) => {
  test.setTimeout(720000);
  await page.setViewportSize({ width: 960, height: 700 });
  await page.clock.install();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  if ((process.env.STACK_ONLY || process.env.BACKEND_ONLY)) await page.addInitScript(() => localStorage.setItem("tech-journey-checkpoint-v1", "1"));
  await openJourney(page);
  await expect(page.getByText("Preparing physics & scenery…")).toHaveCount(0, {
    timeout: 90000,
  });
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 2000));
  const read = () =>
    page.locator("canvas").evaluate((el) => ({
      player: JSON.parse(el.dataset.player!),
      platforms: JSON.parse(el.dataset.platforms || "[]"),
    })) as Promise<State>;
  const held = new Set<string>();
  async function keys(next: string[]) {
    for (const key of [...held])
      if (!next.includes(key)) {
        await page.keyboard.up(key);
        held.delete(key);
      }
    for (const key of next)
      if (!held.has(key)) {
        await page.keyboard.down(key);
        held.add(key);
      }
  }
  async function stop() {
    await keys([]);
  }
  async function move(
    target: (s: State) => { x: number; z: number; y?: number },
    jump = false,
    ground = false,
  ) {
    const start = Date.now();
    let jumped = false;
    while (Date.now() - start < 45000) {
      const s = await read(),
        p = s.player,
        t = target(s),
        lead = Math.min(0.18, p.dt || 0.1),
        heldX = Number(held.has("KeyD")) - Number(held.has("KeyA")),
        heldZ = Number(held.has("KeyS")) - Number(held.has("KeyW")),
        norm = Math.hypot(heldX, heldZ) || 1,
        dx = t.x - (p.x + (heldX / norm) * 6.7 * lead),
        dz = t.z - (p.z + (heldZ / norm) * 6.7 * lead);
      if (p.y < (t.y ?? 0) - 4) {
        await stop();
        throw new Error(
          `Fell at ${JSON.stringify(p)}, target ${JSON.stringify(t)}`,
        );
      }
      if (
        Math.abs(t.x - p.x) < 0.32 &&
        Math.abs(t.z - p.z) < 0.32 &&
        heldX === 0 &&
        heldZ === 0 &&
        (!ground ||
          ((Math.abs(p.vy) < 0.6 || p.expression === "idle") &&
            p.y < (t.y ?? 0) + 0.9 &&
            p.y > (t.y ?? 0) + 0.38))
      ) {
        await stop();
        return;
      }
      const next: string[] = [];
      if (dx > 0.25) next.push("KeyD");
      else if (dx < -0.25) next.push("KeyA");
      if (dz > 0.25) next.push("KeyS");
      else if (dz < -0.25) next.push("KeyW");
      if (jump && !jumped) {
        next.push("Space");
        jumped = true;
      } else if (jump && Date.now() - start < 160) next.push("Space");
      await keys(next);
      await page.clock.fastForward(50);
    }
    const s = await read();
    await stop();
    throw new Error(
      `Movement timed out: ${JSON.stringify(s.player)}, target ${JSON.stringify(target(s))}`,
    );
  }
  const platform = (s: State, id: string) => {
    const p = s.platforms.find((p) => p.id === id);
    if (!p) throw new Error(`Missing platform ${id}`);
    return p;
  };
  async function jumpTo(id: string) {
    await expect
      .poll(
        async () => {
          await page.clock.fastForward(100);
          const p = platform(await read(), id);
          return (
            p.solid &&
            !p.warning &&
            (p.motion !== "packet" || (p.cycle ?? 2) < 4.4) &&
            (p.motion !== "cursor" || (p.cycle ?? 0) < 0.2) &&
            (p.motion !== "folderStep" || (p.open ?? 0) > 0.95) &&
            (p.kind !== "popup" || (p.cycle ?? 0) < 1.8 || (p.cycle ?? 0) > 8.3)
          );
        },
        { timeout: 20000, intervals: [20] },
      )
      .toBe(true);
    let initial = await read();
    const initialPlatform = platform(initial, id);
    if (initialPlatform.kind === "popup") {
      // Waiting for the popup can rotate the rider away from the exit. Walk around
      // the ring instead of cutting across its open center before taking off.
      const spinner = initial.platforms.find((p) => p.kind === "spinner")!;
      const start = Math.atan2(initial.player.z - spinner.z, initial.player.x - spinner.x);
      let delta = -Math.PI / 2 - start;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      const steps = Math.max(1, Math.ceil(Math.abs(delta) / .3));
      for (let i = 1; i <= steps; i++) {
        const angle = start + delta * i / steps;
        await move(() => ({ x: spinner.x + Math.cos(angle) * 1.7, z: spinner.z + Math.sin(angle) * 1.7, y: spinner.y }));
      }
      initial = await read();
    }
    const landingSide = initialPlatform.kind === "cursor"
      ? 1
      : Math.sign(initial.player.z - initialPlatform.z) || 1;
    const landingX = initialPlatform.stage === 1 && initialPlatform.index === 8 ? -1.6 :
      Math.abs(initial.player.x - initialPlatform.x) > 2.5
        ? Math.sign(initial.player.x - initialPlatform.x) *
          Math.min(0.65, initialPlatform.width / 4)
        : 0;
    await move(
      (s) => {
        const p = platform(s, id);
        const x = p.x + landingX;
        const z = p.z + landingSide *
          Math.min(p.depth / 2 - 0.35, p.kind === "toggle" ? p.depth / 2 - .5 : p.kind === "popup" ? p.depth / 2 - .5 : p.kind === "cursor" ? 1 : p.kind === "spinner" ? 1.85 : p.round && p.width < 4 ? 0.9 : 1.4);
        let y = p.y + (p.kind === "toggle" ? toggleGeometry(p.width, p.depth).rimTop : 0)
          - (z - p.z) * Math.sin(p.kind === "toggle" ? (p.tilt ?? 0) : (p.pitch ?? 0));
        // Account for the actual flap surface when targeting a folder landing.
        for (const folder of s.platforms.filter((v) => v.kind === "folder")) {
          const forward = folder.z - folder.depth / 2 - z;
          if (Math.abs(x - folder.x) < folder.width / 2 && forward >= 0 &&
              forward < folder.depth * -Math.cos(2.8)) {
            y = Math.max(y, folder.y + 0.16 + forward * Math.tan(Math.PI - 2.8) + 0.075);
          }
        }
        return { x, z, y };
      },
      true,
      true,
    );
  }
  await expect
    .poll(async () => {
      await page.clock.fastForward(100);
      return (await read()).player.y;
    })
    .toBeLessThan((process.env.STACK_ONLY || process.env.BACKEND_ONLY) ? levels[1].y + .9 : .9);
  for (let stage = process.env.STACK_ONLY || process.env.BACKEND_ONLY ? 1 : 0; stage < (process.env.FRONTEND_ONLY ? 1 : process.env.BACKEND_ONLY ? 2 : 5); stage++) {
    const ids = (await read()).platforms
      .filter((p) => p.stage === stage && !p.optional)
      .sort((a, b) => a.index - b.index)
      .map((p) => p.id).slice(0, process.env.OPENING_ONLY ? 3 : undefined);
    expect(ids.length).toBeGreaterThanOrEqual(process.env.OPENING_ONLY ? 3 : 9);
    await page.screenshot({ path: `test-results/stack-world-${stage}-entry.png` });
    const z = levels[stage].z;
    await move((s) => ({ x: platform(s, ids[0]).x, z: z - 4.9 }));
    for (let i = 0; i < ids.length; i++) {
      await test.step(`world ${stage + 1}, platform ${i + 1}`, async () => {
        const beforeLanding = platform(await read(), ids[i]);
        if (beforeLanding.kind === "checkbox") expect(beforeLanding.checked).toBe(false);
        if (beforeLanding.kind === "dropdown") {
          await expect.poll(async () => {
            await page.clock.fastForward(100);
            return platform(await read(), ids[i]).open ?? 0;
          }, { timeout: 30000, intervals: [20] }).toBeGreaterThan(0.95);
          await page.screenshot({ path: "test-results/dropdown-expanded.png" });
        }
        await jumpTo(ids[i]);
        if (beforeLanding.kind === "checkbox") {
          await expect.poll(async () => {
            await page.clock.fastForward(50);
            return platform(await read(), ids[i]).checked;
          }).toBe(true);
          for (let tick = 0; tick < 5; tick++) await page.clock.fastForward(100);
          await page.screenshot({ path: `test-results/checkbox-${i}-checked.png` });
        }
        const landed = platform(await read(), ids[i]);
        if (landed.kind === "button") {
          await expect.poll(async () => {
            await page.clock.fastForward(50);
            return platform(await read(), ids[i]).press ?? 0;
          }).toBeGreaterThan(.15);
          await page.screenshot({ path: "test-results/frontend-giant-button.png" });
          if (landed.z > -120) {
          const letters = (await read()).platforms.filter((p) => p.kind === "letter").sort((a, b) => a.index - b.index);
          for (const letter of letters) {
            const geometry = letterGeometry(letter.glyph!, letter.fontVariant!, letter.width, letter.depth);
            const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
            mesh.updateMatrixWorld();
            const player = (await read()).player;
            const candidates: { x: number; z: number }[] = [];
            const ray = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0));
            for (let x = -1.5; x <= 1.5; x += .15) for (let z = -1.5; z <= 1.5; z += .15) {
              const supported = [[0, 0], [.12, 0], [-.12, 0], [0, .12], [0, -.12]].every(([dx, dz]) => {
                ray.ray.origin.set(x + dx, 2, z + dz); return ray.intersectObject(mesh).length > 0;
              });
              if (supported) candidates.push({ x: letter.x + x, z: letter.z + z });
            }
            candidates.sort((a, b) => Math.hypot(a.x - player.x, a.z - player.z) - Math.hypot(b.x - player.x, b.z - player.z));
            expect(candidates.length).toBeGreaterThan(0);
            const target = candidates[0];
            // Font specimens now stand upright off-route and select on click.
            const cameraState = await page.locator("canvas").evaluate(el => JSON.parse(el.dataset.player!));
            const box = (await page.locator("canvas").boundingBox())!;
            const camera = new THREE.PerspectiveCamera(48, box.width / box.height, .1, 480);
            camera.position.fromArray(cameraState.camera); camera.quaternion.fromArray(cameraState.cameraQuaternion); camera.updateMatrixWorld();
            const point = new THREE.Vector3(target.x, letter.y - (target.z - letter.z), letter.z + .01).project(camera);
            await page.mouse.click(box.x + (point.x + 1) * box.width / 2, box.y + (1 - point.y) * box.height / 2);
            await expect.poll(async () => {
              await page.clock.fastForward(50);
              return page.locator("canvas").getAttribute("data-typography");
            }).toBe(String(letter.fontVariant));
          }
          await page.screenshot({ path: "test-results/frontend-typography.png" });
          }

        }

        if (stage === 1) {
          const factory = () => page.locator("canvas").evaluate((el) => JSON.parse(el.dataset.backend!));
          if (i === 3) {
            await move((s) => { const p = platform(s, ids[i]); return { x: p.x, z: p.z }; });
            await expect.poll(async () => (await factory()).token).toBe(true);
          }
          if ([1, 6, 8, 12].includes(i)) {
            await page.keyboard.press("e");
            await expect(page.getByRole("dialog")).toBeVisible();
            await expect(page.getByRole("dialog")).toContainText("BACKEND ENGINEERING");
            await page.keyboard.press("Escape");
          }
          if (i === 8) {
            await expect.poll(async () => (await factory()).wrongDoor).toBe(-1);
            expect((await factory()).maze).toBe(false);
            await move((s) => { const p = platform(s, ids[i]); return { x: p.x - 1.6, z: p.z + .4 }; });
            await move((s) => { const p = platform(s, ids[i]); return { x: p.x, z: p.z + .4 }; });
            await expect.poll(async () => (await factory()).maze).toBe(true);
          }
          if (i === 11) {
            for (const offset of [-1.5, 0, 1.5]) await move((s) => { const p = platform(s, ids[i]); return { x: p.x + offset, z: p.z + .4 }; });
            await expect.poll(async () => (await factory()).switches).toBe(3);
          }
          if (i === 14) await expect.poll(async () => (await factory()).ready).toBe(true);
        }

        if (landed.kind === "colorpicker") {
          const layout = pickerLayout(landed.width, landed.depth);
          const initial = landed.color;
          await move((s) => {
            const p = platform(s, ids[i]);
            return { x: p.x + layout.wellX - layout.wellWidth * 0.25,
              z: p.z + layout.wellZ - layout.wellDepth * 0.2, y: p.y };
          });
          await expect.poll(async () => {
            await page.clock.fastForward(50);
            return platform(await read(), ids[i]).color;
          }).not.toBe(initial);
          await move((s) => {
            const p = platform(s, ids[i]);
            return { x: p.x + layout.hueX, z: p.z + layout.wellZ + layout.wellDepth * 0.25, y: p.y };
          });
          for (let tick = 0; tick < 4; tick++) await page.clock.fastForward(100);
          const picked = platform(await read(), ids[i]);
          expect(picked.hue).toBeGreaterThan(0.1);
          expect(picked.hue).toBeLessThan(0.4);
          expect(picked.color).toMatch(/^#[0-9A-F]{6}$/);
          await page.screenshot({ path: "test-results/color-picker-selected.png" });
        }
        if (landed.kind === "spinner" || landed.kind === "gear") {
          const radius = landed.width * (landed.kind === "spinner" ? 1.7 / 4.8 : 1.15 / 3.6);
          // These are actual hollow symbols: take the rim around their open centers.
          for (const angle of [Math.PI / 3, 2 * Math.PI / 3, Math.PI]) {
            await move((s) => {
              const p = platform(s, ids[i]);
              return { x: p.x + Math.sin(angle) * radius, z: p.z + Math.cos(angle) * radius, y: p.y };
            });
          }
          await page.screenshot({ path: `test-results/hollow-${landed.kind}-${i}.png` });
        }
        if (landed.motion === "seesaw") {
          const next = platform(await read(), ids[i + 1]);
          const parts = toggleGeometry(landed.width, landed.depth);
          // The raised exit still requires tipping the switch, despite its taller housing.
          expect(next.y - landed.y - parts.rimTop).toBeGreaterThan(1.53);
          const switchPoint = (localZ: number, height: number) => (s: State) => {
            const p = platform(s, ids[i]), angle = p.tilt ?? 0;
            return { x: p.x, z: p.z + localZ * Math.cos(angle) + height * Math.sin(angle),
              y: p.y - localZ * Math.sin(angle) + height * Math.cos(angle) };
          };
          // Push until ON, then jump onto the raised thumb and climb its sloping top.
          await keys(["KeyW"]);
          for (let tick = 0; tick < 160 && (platform(await read(), ids[i]).tilt ?? 0) < .64; tick++)
            await page.clock.fastForward(50);
          await stop();
          await expect.poll(async () => {
            await page.clock.fastForward(100);
            return platform(await read(), ids[i]).tilt ?? 0;
          }, { timeout: 15000, intervals: [20] }).toBeGreaterThan(0.64);
          await move(switchPoint(-parts.travel + parts.knobRadius * .5, parts.knobTop), true);
          await move(switchPoint(-parts.travel - parts.knobRadius * .75, parts.knobTop), false, true);
          expect((await read()).player.y).toBeGreaterThan(landed.y + 3);
          await page.screenshot({ path: "test-results/giant-seesaw-raised.png" });
        }
        if (landed.motion === "elevator") {
          const base = JSON.parse(
            (await page.locator("canvas").getAttribute("data-course"))!,
          ).find((p: any) => p.id === ids[i]).y;
          await expect
            .poll(
              async () => {
                await page.clock.fastForward(100);
                return platform(await read(), ids[i]).y;
              },
              { timeout: 20000, intervals: [20] },
            )
            .toBeGreaterThan(base + (stage === 0 ? 4.1 : 3.1));
          await page.screenshot({ path: "test-results/dropdown-lift.png" });
        }
        if (landed.motion === "cursor") {
          const startZ = (await read()).player.z;
          const cursorBase = JSON.parse((await page.locator("canvas").getAttribute("data-course"))!)
            .find((p: any) => p.id === ids[i]).z;
          await expect
            .poll(
              async () => {
                await page.clock.fastForward(100);
                return platform(await read(), ids[i]).z;
              },
              { timeout: 20000, intervals: [20] },
            )
            .toBeLessThan(cursorBase - 3.9);
          expect((await read()).player.z).toBeLessThan(startZ - 2);
        }
        if (stage > 0 && [3, 7, ids.length - 1].includes(i))
          await page.screenshot({ path: `test-results/stack-world-${stage}-step-${i}.png` });
        if (stage === 0)
          console.log(`Frontend ${i + 1}/${ids.length}: ${landed.kind}`);
        if (stage === 0 && [0, 7, 10, 12].includes(i))
          await page.screenshot({
            path: `test-results/frontend-scene-${i}.png`,
          });
        if (i < ids.length - 1 && landed.kind !== "toggle") {
          await move((s) => {
            const p = platform(s, ids[i]),
              n = platform(s, ids[i + 1]);
            return {
              x:
                p.kind === "gear" ? p.x : p.kind === "toggle" ? p.x : p.kind === "cursor"
                  ? p.x
                  : p.kind === "html"
                    ? p.x + 0.25
                    : p.x +
                      Math.sign(n.x - p.x) *
                        Math.min(stage === 0 ? 0.8 : 0.25, p.width / 2 - 0.55),
              z: stage === 0 && p.index === 0 ? Math.max(p.z - p.depth / 2 + .4, n.z + n.depth / 2 + .5) : p.kind === "gear" ? p.z - p.width * 0.48 : p.kind === "toggle" ? p.z - (p.depth / 2 - .7) * Math.cos(p.tilt ?? 0) : p.kind === "folder"
                ? p.z - p.depth / 2 - (n.kind === "cursor" || n.kind === "ramp" || n.kind === "trash" || n.kind === "folder" ? 2.6 : 1.3)
                : p.z - Math.min(stage === 0 ? ["colorpicker", "popup", "button"].includes(p.kind) ? p.depth / 2 - .4 : 1.9 : 1.35, p.depth / 2 - 0.4),
              y: p.y,
            };
          });
        }
      });
    }
    if (process.env.OPENING_ONLY) { expect(errors).toEqual([]); return; }
    if (stage === 0) {
      const progress = await page
        .locator("canvas")
        .evaluate((el) => JSON.parse(el.dataset.frontend!));
      expect(progress.steps).toBeGreaterThanOrEqual(22);
      await page.screenshot({ path: "test-results/frontend-completed.png" });
    }
    if (stage < 4) {
      await move(
        () => ({
          x: 0,
          z: levels[stage + 1].z + 2.5,
          y: levels[stage + 1].y - 0.08,
        }),
        true,
        true,
      );
      await move(() => ({ x: 0, z: levels[stage + 1].z }));
      await expect
        .poll(() =>
          page.evaluate(() =>
            localStorage.getItem("tech-journey-checkpoint-v1"),
          ),
        )
        .toBe(String(stage + 1));
      console.log(`Reached checkpoint ${stage + 2} by walking and jumping.`);
    }
  }

  if (process.env.FRONTEND_ONLY) {
    await expect.poll(() => page.evaluate(() => localStorage.getItem("tech-journey-checkpoint-v1"))).toBe("1");
    expect(errors).toEqual([]);
    return;
  }
  if (process.env.BACKEND_ONLY) {
    await expect.poll(() => page.evaluate(() => localStorage.getItem("tech-journey-checkpoint-v1"))).toBe("2");
    expect(errors).toEqual([]);
    return;
  }
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem("tech-journey-checkpoint-v1")),
    )
    .toBe("4");
  await move(() => ({ x: 0, z: levels[4].z + launchSite.offsetZ, y: levels[4].y + launchSite.height }));
  await expect(page.getByRole("button", { name: "E Deploy!" })).toBeVisible();
  await page.keyboard.press("e");
  for (let i = 0; i < 76; i++) await page.clock.fastForward(100);
  await expect(
    page.getByRole("heading", { name: "Successfully deployed!" }),
  ).toBeVisible({ timeout: 18000 });
  await page.getByRole("button", { name: "Restart journey ↻" }).click();
  await expect.poll(async () => {
    await page.clock.fastForward(100);
    const boxes = (await read()).platforms.filter((p) => p.kind === "checkbox");
    return boxes.length === 2 && boxes.every((p) => p.checked === false);
  }).toBe(true);
  expect(errors).toEqual([]);
});

test("queue conveyors report their movement and sound is optional", async ({
  page,
}) => {
  await openJourney(page);
  await expect(page.getByText("Preparing physics & scenery…")).toHaveCount(0, {
    timeout: 45000,
  });
  const states = () =>
    page
      .locator("canvas")
      .evaluate((el) => JSON.parse(el.dataset.platforms || "[]")) as Promise<
      P[]
    >;
  const state = async (id: string) =>
    (await states()).find((p) => p.id === id)!;
  await expect.poll(async () => (await states()).length).toBe(allPlatforms.length);
  const moving = await state("1-2");
  await expect
    .poll(async () => Math.abs((await state("1-2")).x - moving.x), {
      timeout: 6000,
    })
    .toBeGreaterThan(0.15);
  await page.getByRole("button", { name: "Enable sound" }).click();
  await expect(
    page.getByRole("button", { name: "Mute sound" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Mute sound" }).click();
  await expect(
    page.getByRole("button", { name: "Enable sound" }),
  ).toHaveAttribute("aria-pressed", "false");
});
