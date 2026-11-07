import { test, expect } from "@playwright/test";
import { frontendPlatforms } from "../src/data/course";

test("folder covers have clearance throughout their swing, including the cursor ride", () => {
  const folders = frontendPlatforms.filter((p) => p.kind === "folder");
  for (const folder of folders) {
    // Includes the protruding tab and thickness at every hinge angle, not just fully open.
    const reach = folder.depth / 2 + Math.hypot(folder.depth + 0.1, 0.17);
    const minZ = folder.z - reach;
    const maxZ = folder.z + folder.depth / 2 + 0.11;
    for (const other of frontendPlatforms.filter((p) => p.id !== folder.id)) {
      const cursor = other.kind === "cursor";
      const halfX = cursor ? 1.5 : other.width / 2;
      const minX = other.x - halfX;
      const maxX = other.x + halfX + (cursor ? 1.6 : 0);
      const otherMinZ = other.z - (cursor ? 5.8 : other.depth / 2);
      const otherMaxZ = other.z + (cursor ? 2.2 : other.depth / 2);
      const separation = Math.max(
        minX - (folder.x + folder.width / 2),
        folder.x - folder.width / 2 - maxX,
        otherMinZ - maxZ,
        minZ - otherMaxZ,
      );
      expect(separation, `${folder.id} lid swing versus ${other.id} ${other.kind}`)
        .toBeGreaterThan(0.25);
    }
  }
});


test("trash and settings are app-shaped objects in the final Frontend section", () => {
  for (const kind of ["trash", "gear"]) {
    const apps = frontendPlatforms.filter((p) => p.kind === kind);
    expect(apps).toHaveLength(1);
    expect(apps[0].index).toBeGreaterThanOrEqual(19);
    expect(apps[0].round).toBe(false);
  }
});
