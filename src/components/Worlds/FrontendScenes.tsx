import { typographySelection } from "../../data/uiPlaygroundGeometry";
import { ButtonCap, HtmlBlock, LetterPlatform } from "./UIPlayground";
import { AppPlatform } from "./AppPlatform";
import { ColorPickerPlatform } from "./ColorPickerPlatform";
import { DropdownOption } from "./DropdownLift";
import { CheckboxPlatform } from "./CheckboxPlatform";
import { useFrame, useThree } from "@react-three/fiber";
import { Block, Cylinder, Label } from "./shared";
import { uiIconGeometry } from "../../data/frontendShapes";
import { BrowserTab, BrowserWindow } from "./BrowserObjects";
import { MechanismModel, mechanismStates } from "./FrontendMechanisms";
import { frontendPlatforms, type PlatformSpec } from "../../data/course";

export const frontendJourney = { visited: new Set<number>(), checked: new Set<string>() };
export function resetFrontend() {
  typographySelection.current = 0;
  frontendJourney.visited.clear();
  frontendJourney.checked.clear();
}
export function visitFrontend(index: number) {
  if (index < frontendPlatforms.length) frontendJourney.visited.add(index);
}
const cream = "#f5eadc";

export function FrontendPlatform({
  p,
  tilt,
  checked,
}: {
  p: PlatformSpec;
  tilt?: { current: number };
  checked: { current: boolean };
}) {
  const k = p.kind;
  if (k === "button") return <ButtonCap p={p} />;
  if (k === "html" || k === "tag") return <HtmlBlock p={p} />;
  if (k === "letter") return <LetterPlatform p={p} />;
  if (k === "colorpicker") return <ColorPickerPlatform p={p} />;
  if (k === "checkbox") return <CheckboxPlatform p={p} checked={checked} />;
  if (["cursor", "toggle", "spinner", "clock"].includes(k))
    return <MechanismModel p={p} tilt={tilt} />;
  if (k === "tab") return <BrowserTab p={p} />;
  if (k === "browser" || k === "ramp" || k === "popup")
    return <BrowserWindow p={p} />;
  if (k === "trash" || k === "gear") return <AppPlatform p={p} />;
  if (k === "folder") return <>
    <Block position={[0, -0.09, 0]} size={[p.width, 0.18, p.depth]} color="#dfc38d" radius={0.06} />
    {[0, 1].map((sheet) => <Block key={sheet} position={[sheet * 0.035, 0.015 + sheet * 0.03, 0]} size={[p.width - 0.35, 0.02, p.depth - 0.25]} color={sheet ? "#fff8ef" : "#f1e8d5"} radius={0.008} />)}
    <Label position={[0, .07, -.8]} rotation={[-Math.PI / 2, 0, 0]} size={.22} color="#776658">{["design.notes", "components.tsx", "styles.css"][p.index % 3]}</Label>
    <Label position={[0, .07, .25]} rotation={[-Math.PI / 2, 0, 0]} size={.16} color="#887768">{[
      "Sketch → build → refine\nKeep it clear. Make it playful.\nDesign for people.",
      "function Hello() {\n  return <h1>Hello, world!</h1>;\n}",
      ".card {\n  border-radius: 16px;\n  background: lavender;\n}",
    ][p.index % 3]}</Label>
    <Block position={[0, 0.04, -p.depth / 2 + 0.08]} size={[p.width - 0.12, 0.24, 0.12]} color="#c9a66d" radius={0.035} />
  </>;
  if (k === "dropdown") return <DropdownOption p={p} />;
  if (k === "camera") return <>
    <mesh geometry={uiIconGeometry("camera", p.width, p.depth)} castShadow receiveShadow dispose={null}>
      <meshStandardMaterial color="#b9a7d0" roughness={0.65} />
    </mesh>
    <Cylinder position={[0, 0.025, 0]} radius={1.1} height={0.05} color="#725e8d" />
    <Cylinder position={[0, 0.04, 0]} radius={0.82} height={0.04} color="#a8c7d3" />
    <Cylinder position={[0, 0.055, 0]} radius={0.52} height={0.025} color="#596b83" />
    <Block position={[-p.width * 0.3, 0.035, -p.depth * 0.22]} size={[0.55, 0.07, 0.24]} color={cream} radius={0.045} />
  </>;
  return null;
}

/** Only the playable UI objects form the Frontend scenery. */
export function FrontendScenes() {
  const { gl } = useThree();
  useFrame(() => {
    gl.domElement.dataset.frontend = JSON.stringify({
      steps: frontendJourney.visited.size,
      total: frontendPlatforms.length,
      mechanisms: Object.fromEntries(mechanismStates),
    });
  });
  return null;
}
