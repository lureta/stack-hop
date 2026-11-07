import { Block } from "./shared";
import { uiIconGeometry } from "../../data/frontendShapes";
import type { PlatformSpec } from "../../data/course";

/** Molded desktop app tiles with raised, recognizable glyphs. */
export function AppPlatform({ p }: { p: PlatformSpec }) {
  const trash = p.kind === "trash", size = Math.min(p.width, p.depth);
  const glyph = size * .55;
  return <>
    {/* Recess the shell below the inset: coincident top faces flicker as the camera moves. */}
    <Block position={[0, -.375, 0]} size={[p.width, .55, p.depth]} color={trash ? "#88b9aa" : "#939dbb"} radius={.3} />
    <Block position={[0, -.065, 0]} size={[p.width - .16, .13, p.depth - .16]} color={trash ? "#aed7c6" : "#b9c2d9"} radius={.28} />
    {trash ? <>
      <Block position={[0, .055, glyph * .12]} size={[glyph * .72, .11, glyph * .75]} color="#fff9ee" radius={.12} />
      <Block position={[0, .06, -glyph * .35]} size={[glyph, .12, glyph * .12]} color="#fff9ee" radius={.06} />
      <Block position={[0, .055, -glyph * .47]} size={[glyph * .38, .11, glyph * .13]} color="#fff9ee" radius={.04} />
      {[-1, 0, 1].map((i) => <Block key={i} position={[i * glyph * .17, .115, glyph * .13]} size={[glyph * .045, .025, glyph * .48]} color="#89b7a7" radius={.015} />)}
    </> : <mesh position={[0, .12, 0]} scale={[.65, .24, .65]} geometry={uiIconGeometry("gear", size, size)} castShadow receiveShadow dispose={null}>
      <meshStandardMaterial color="#fff9ee" roughness={.5} metalness={.08} />
    </mesh>}
  </>;
}
