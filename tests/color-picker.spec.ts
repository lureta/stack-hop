import { test, expect } from "@playwright/test";
import { hsvColor, pickerLayout, samplePicker } from "../src/data/colorPicker";

test("color picker uses standard HSV colors and maps its controls correctly", () => {
  expect(hsvColor(0, 1, 1).getHexString()).toBe("ff0000");
  expect(hsvColor(1 / 3, 1, 1).getHexString()).toBe("00ff00");
  expect(hsvColor(2 / 3, 1, 1).getHexString()).toBe("0000ff");
  expect(hsvColor(0.76, 0, 1).getHexString()).toBe("ffffff");
  expect(hsvColor(0.76, 1, 0).getHexString()).toBe("000000");
  const layout = pickerLayout(6, 4);
  const topLeft = samplePicker(layout, layout.wellX - layout.wellWidth / 2, layout.wellZ - layout.wellDepth / 2);
  expect(topLeft?.type).toBe("well");
  if (topLeft?.type === "well") {
    expect(topLeft.saturation).toBeCloseTo(0);
    expect(topLeft.value).toBeCloseTo(1);
  }
  const bar = samplePicker(layout, layout.hueX, layout.wellZ);
  expect(bar?.type).toBe("hue");
  if (bar?.type === "hue") expect(bar.hue).toBeCloseTo(0.5);
  expect(samplePicker(layout, 50, 50)).toBeNull();
});
