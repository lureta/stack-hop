import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";
import { Block, Label, playerAnchor, reducedMotion } from "./shared";
import { allPlatforms, platformStates, type PlatformSpec } from "../../data/course";
import { letterGeometry, buttonGeometry, typographySelection } from "../../data/uiPlaygroundGeometry";
const ink = "#83659d", cream = "#fff3e7", pink = "#dca8c5", mint = "#a4d4bd";
export function ButtonCap({ p }: { p: PlatformSpec }) {
  const ring = useRef<THREE.Mesh>(null), sparks = useRef<THREE.Group>(null), material = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(() => {
    const state = platformStates.get(p.id), burst = state?.burst ?? 0, age = 1 - burst;
    if (ring.current) { ring.current.visible = burst > 0 && !reducedMotion; ring.current.scale.setScalar(1 + age * 2.5); (ring.current.material as THREE.MeshBasicMaterial).opacity = burst; }
    if (sparks.current) {
      sparks.current.visible = burst > 0 && !reducedMotion;
      sparks.current.children.forEach((child, i) => { const a = i * Math.PI / 4; child.position.set(Math.cos(a) * (1 + age * 3), .4 + Math.sin(age * Math.PI) * 2, Math.sin(a) * (1 + age * 3)); child.scale.setScalar(burst); });
    }
    if (material.current) material.current.color.set((state?.press ?? 0) > .12 ? "#a4d4bd" : (p.optional || p.z < -120) ? pink : "#bd9cdb");
  });
  return <>
    <mesh geometry={buttonGeometry(p.width, p.depth)} dispose={null} castShadow receiveShadow>
      <meshStandardMaterial ref={material} color={pink} roughness={.65} />
    </mesh>
    <Label position={[0, .04, -.45]} rotation={[-Math.PI / 2, 0, 0]} size={.55} color={ink}>{"<button>"}</Label>
    <Label position={[0, .04, .6]} rotation={[-Math.PI / 2, 0, 0]} size={.23} color={ink}>JUMP TO CLICK</Label>
    <mesh ref={ring} visible={false} rotation={[-Math.PI / 2, 0, 0]} position={[0, .06, 0]}><torusGeometry args={[1, .045, 6, 24]} /><meshBasicMaterial color={mint} transparent depthWrite={false} /></mesh>
    <group ref={sparks} visible={false}>{Array.from({ length: 8 }, (_, i) => <mesh key={i}><octahedronGeometry args={[.12]} /><meshBasicMaterial color={i % 2 ? mint : cream} /></mesh>)}</group>
  </>;
}
export function HtmlBlock({ p }: { p: PlatformSpec }) {
  const tag = p.kind === "tag" ? "<section>" : "<div>";
  return <>
    <Block position={[0, -.49, 0]} size={[p.width, .9, p.depth]} color={ink} radius={.22} />
    <Block position={[0, -.07, 0]} size={[p.width - .18, .14, p.depth - .18]} color={p.kind === "tag" ? mint : cream} radius={.15} />
    <Label position={[0, .04, -.2]} rotation={[-Math.PI / 2, 0, 0]} size={p.kind === "tag" ? .6 : .85} color={ink}>{tag}</Label>
    {[-1, 1].map((side) => <Block key={side} position={[side * (p.width / 2 - .5), .025, p.depth / 2 - .45]} size={[.5, .05, .1]} color={pink} radius={.02} />)}
    <Label position={[0, -.4, p.depth / 2 + .03]} size={.3} color={cream}>{tag}</Label>
  </>;
}
export function LetterPlatform({ p }: { p: PlatformSpec }) {
  const material = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(() => {
    if (material.current) material.current.emissiveIntensity = typographySelection.current === p.fontVariant ? .25 : 0;
  });
  return <>
    <mesh onClick={(event) => { event.stopPropagation(); typographySelection.current = p.fontVariant!; }} rotation={[Math.PI / 2, 0, 0]} geometry={letterGeometry(p.glyph!, p.fontVariant!, p.width, p.depth)} dispose={null} castShadow receiveShadow>
      <meshStandardMaterial ref={material} color={[pink, mint, "#b5a3dd"][p.fontVariant!]} emissive="#bd9cdb" roughness={.6} />
    </mesh>
    <Label position={[0, -p.depth / 2 - .4, .1]} size={.24}>{["Sans", "Serif", "Display"][p.fontVariant!]}</Label>
  </>;
}
export function UIPlaygroundScenery() {
  const preview = useRef<THREE.Mesh>(null), root = useRef<THREE.Group>(null);
  useFrame(({ gl, camera }) => {
    gl.domElement.dataset.typography = String(typographySelection.current);
    if (root.current) {
      root.current.visible = Math.abs(playerAnchor.z + 115) < 70;
      root.current.rotation.set(0, Math.atan2(camera.position.x - root.current.position.x, camera.position.z - root.current.position.z), 0);
    }
    if (preview.current) preview.current.geometry = letterGeometry("Aa", typographySelection.current, 4.3, 2.8);
  });
  return <>
    {allPlatforms.filter((p) => p.kind === "button").map((p) => <RigidBody key={p.id} type="fixed" colliders={false} position={[p.x, p.y, p.z]}>
      <CuboidCollider args={[(p.width + .35) / 2, .25, (p.depth + .35) / 2]} position={[0, -.65, 0]} />
      <Block position={[0, -.65, 0]} size={[p.width + .35, .5, p.depth + .35]} color={ink} radius={.2} />
    </RigidBody>)}
    <group ref={root} position={[-21.5, 23.8, -115]}>
      <Label position={[0, 2.1, .2]} size={.28}>Typography</Label>
      <group rotation={[Math.PI / 2, 0, 0]}><mesh ref={preview} geometry={letterGeometry("Aa", 0, 4.3, 2.8)} dispose={null}><meshStandardMaterial color={cream} roughness={.6} /></mesh></group>
    </group>
  </>;
}
