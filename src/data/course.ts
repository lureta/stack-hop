import { stackLayouts, type StackKind } from "./stackJourney";
import { levels } from "./levels";
export type PlatformKind = StackKind
  | "letter"
  | "tag"
  | "colorpicker"
  | "checkbox"
  | "ramp"
  | "cursor"
  | "toggle"
  | "spinner"
  | "html"
  | "popup"
  | "clock"
  | "tab"
  | "trash"
  | "gear"
  | "mail"
  | "folder"
  | "paper"
  | "dropdown"
  | "camera"
  | "key"
  | "button"
  | "browser"
  | "slider"
  | "progress"
  | "menu"
  | "server"
  | "node"
  | "connector"
  | "packet"
  | "tunnel"
  | "cylinder"
  | "cube"
  | "disk"
  | "bridge"
  | "conveyor"
  | "cloud"
  | "datacenter"
  | "launch";
export type PlatformMotion =
  | "press"
  | "static"
  | "slide"
  | "float"
  | "rotate"
  | "disappear"
  | "packet"
  | "elevator"
  | "cursor"
  | "seesaw"
  | "folderStep";
export interface PlatformSpec {
  id: string;
  stage: number;
  index: number;
  x: number;
  y: number;
  z: number;
  width: number;
  depth: number;
  kind: PlatformKind;
  motion: PlatformMotion;
  round: boolean;
  pitch?: number;
  optional?: boolean;
  glyph?: string;
  fontVariant?: number;
}
// Repeated UI scenes are separated by open jumps, with broad lateral curves.
const frontendLayout: [PlatformKind, number, number, number, number, number][] =
  [
    ["ramp", 2, 0.35, -9, 6, 6.5],
    ["colorpicker", 3, 1.5, -18.5, 8, 8],
    ["folder", 5, 2.7, -25.5, 4.8, 3.2],
    ["folder", 3, 4.6, -32.5, 4.8, 3.2],
    ["folder", 0, 5.7, -39.5, 4.8, 3.2],
    ["cursor", -2, 6.8, -48, 3.2, 3.2],
    ["tab", -3, 8.2, -56.3, 6.2, 2.6],
    ["tab", -1, 8.8, -59.8, 5, 2.6],
    ["tab", 1, 9.85, -63.3, 5.6, 2.6],
    ["toggle", 4, 11, -75, 7, 16],
    ["spinner", 5, 13.2, -79.8, 4.8, 5.2],
    ["popup", 2, 13, -89.2, 6, 8.5],
    ["clock", -2, 13.6, -98, 4.5, 5.2],
    ["button", -5, 14.85, -105, 5.5, 5.2],
    ["dropdown", -6, 15.8, -112, 4.4, 5.2],
    ["button", -4, 20.8, -119, 5.5, 5.2],
    ["folder", -2, 21.5, -125.1, 4.8, 3.2],
    ["folder", 0, 22.3, -133, 4.8, 3.2],
    ["folder", 2, 23.1, -140, 4.8, 3.2],
    ["trash", 2, 25.1, -149, 6, 6.8],
    ["checkbox", 0, 26.2, -155, 3, 3],
    ["gear", -2, 27.25, -159, 4.2, 4.2],
    ["checkbox", 0, 28.3, -164, 4, 4],
  ];
export const frontendPlatforms: PlatformSpec[] = frontendLayout.map(
  ([kind, x, y, z, width, depth], index) => ({
    id: `0-${index}`,
    stage: 0,
    index,
    kind,
    x,
    y: index >= 10 ? y + 3.1 : y,
    z: index >= 10 ? z - 5 : z,
    width,
    depth,
    motion:
      kind === "button" ? "press" : kind === "dropdown"
        ? "elevator"
        : kind === "cursor"
          ? "cursor"
          : kind === "toggle"
            ? "seesaw"
            : kind === "spinner"
              ? "rotate"
              : kind === "paper"
                ? "folderStep"
                : "static",
    pitch: kind === "ramp" ? 0.15 : undefined,
    round: ["spinner", "clock"].includes(kind),
  }),
);
export const frontendExtras: PlatformSpec[] = [
  { id: "type-sans", stage: 0, index: 100, kind: "letter", glyph: "A", fontVariant: 0, x: -10.5, y: 18.1, z: -109.5, width: 3.6, depth: 3.6, motion: "static", round: false, optional: true },
  { id: "type-serif", stage: 0, index: 101, kind: "letter", glyph: "a", fontVariant: 1, x: -15.7, y: 18.8, z: -112, width: 3.6, depth: 3.6, motion: "static", round: false, optional: true },
  { id: "type-display", stage: 0, index: 102, kind: "letter", glyph: "g", fontVariant: 2, x: -20.9, y: 19.5, z: -114.5, width: 3.6, depth: 3.6, motion: "static", round: false, optional: true },
];
export const stackPlatforms: PlatformSpec[] = Object.entries(stackLayouts).flatMap(([key, layout]) => {
  const stage = Number(key);
  return layout.map(([kind, x, y, z, width, depth, motion = "static"], index) => ({
    id: `${stage}-${index}`, stage, index, kind, x,
    y: levels[stage].y + y, z: levels[stage].z + z, width, depth, motion: stage === 1 && index === 9 ? "disappear" : motion,
    round: ["dbStack", "dbCommit", "cloudBucket", "testPad", "deployPad"].includes(kind),
  }));
});
export const course: PlatformSpec[] = [...frontendPlatforms, ...stackPlatforms.filter((p) => p.stage < 4)];
export const finalSteps = stackPlatforms.filter((p) => p.stage === 4);
export const bridgeSteps: PlatformSpec[] = [0, 1, 2, 3].map((stage) => ({
  id: `bridge-${stage}`, stage,
  index: stage === 0 ? frontendPlatforms.length : stackLayouts[stage].length,
  x: 0,
  y: stage === 0 ? levels[1].y - 0.8 : levels[stage].y + 16.1,
  z: stage === 0 ? levels[1].z + 7 : levels[stage].z - 101,
  width: 5, depth: 4.5,
  kind: stage === 0 ? "browser" : stage === 1 ? "response" : stage === 2 ? "dbRow" : "container",
  motion: "static", round: false,
}));
export const allPlatforms = [...course, ...bridgeSteps, ...finalSteps, ...frontendExtras];
export interface PlatformState extends PlatformSpec {
  press?: number;
  burst?: number;
  checked?: boolean;
  activated?: boolean;
  color?: string;
  hue?: number;
  solid: boolean;
  warning: boolean;
  cycle?: number;
  tilt?: number;
  open?: number;
}
export const platformStates = new Map<string, PlatformState>();
