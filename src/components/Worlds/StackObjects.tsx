import { useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Block, Cylinder, Label, playerAnchor, reducedMotion } from "./shared";
import type { PlatformSpec } from "../../data/course";
import { backendFactory } from "../../data/backendFactory";
import { stackGeometry } from "../../data/stackGeometry";
import { stackJourney, stackLayouts } from "../../data/stackJourney";

export const stackThickness: Record<string, number> = {
  gateway: .9, service: 2.8, queue: 1.1, auth: .8, cache: 1.4, apiPipe: 4.4, response: .75,
  dbStack: 2.8, dbRow: .85, dbIndex: .9, dbShard: 2.2, dbJoin: .7, dbReplica: 1.8, dbCommit: .8,
  container: 2.7, cloudBucket: 3.1, loadBalancer: 1.3, cloudLift: 1, satellite: .3, region: 1.5,
  artifact: 2.2, buildRoller: .85, testPad: .7, releaseGate: .85, deployPad: 1.4,
};
const navy = "#647f96", blue = "#a6c6d9", ice = "#e0edf3", green = "#86b9a4", mint = "#c6e3d4";
const cream = "#fff3e5", lilac = "#b8a5ce", ink = "#4f5673", gold = "#e7cea1";
export function PipeMesh({ p }: { p: PlatformSpec }) {
  return <mesh geometry={stackGeometry("apiPipe", p.width, p.depth)} dispose={null} castShadow receiveShadow>
    <meshStandardMaterial color={blue} roughness={.42} metalness={.25} />
  </mesh>;
}
function TopLabel({ text, z = 0, color = ink, size = .32 }: { text: string; z?: number; color?: string; size?: number }) {
  return <Label position={[0, .065, z]} rotation={[-Math.PI / 2, 0, 0]} size={size} color={color}>{text}</Label>;
}
function Power({ active, width, z }: { active: MutableRefObject<boolean>; width: number; z: number }) {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(() => {
    if (!mat.current) return;
    mat.current.color.set(active.current ? "#99f4c8" : "#b6cfe3");
    mat.current.emissive.set(active.current ? "#67d8b0" : "#7ca1bf");
    mat.current.emissiveIntensity = active.current ? .65 : .1;
  });
  return <mesh position={[0, .035, z]}>
    <boxGeometry args={[width, .045, .12]} /><meshStandardMaterial ref={mat} />
  </mesh>;
}
function Gate({ p, active }: { p: PlatformSpec; active: MutableRefObject<boolean> }) {
  const left = useRef<THREE.Group>(null), right = useRef<THREE.Group>(null), open = useRef(0);
  useFrame((_, dt) => {
    const near = Math.hypot(playerAnchor.x - p.x, playerAnchor.z - p.z) < 8 && Math.abs(playerAnchor.y - p.y) < 5;
    open.current = THREE.MathUtils.damp(open.current, (p.stage === 1 && p.index === 4 ? backendFactory.token : near || active.current) ? 1 : 0, 5, Math.min(dt, .1));
    if (left.current) left.current.position.x = -p.width / 4 - open.current * p.width / 3;
    if (right.current) right.current.position.x = p.width / 4 + open.current * p.width / 3;
  });
  return <>
    {[-1, 1].map((side) => <group key={side} position={[side * (p.width / 2 - .12), 0, -.45]}>
      <Block position={[0, 1.8, 0]} size={[.3, 3.6, .55]} color={navy} />
      <Block position={[0, 1.8, .3]} size={[.12, 3.1, .08]} color={ice} glow={.3} />
    </group>)}
    <Block position={[0, 3.65, -.45]} size={[p.width + .15, .35, .7]} color={p.stage === 4 ? lilac : navy} />
    <Label position={[0, 3.66, -.075]} color={cream} size={.24}>{p.kind === "auth" ? "AUTH" : p.kind === "gateway" ? "API" : "RELEASE"}</Label>
    {[left, right].map((ref, i) => <group key={i} ref={ref} position={[(i ? 1 : -1) * p.width / 4, 0, -.45]}>
      <Block position={[0, 1.7, 0]} size={[p.width / 2 - .25, 2.7, .16]} color={p.stage === 4 ? lilac : blue} />
      <Block position={[0, 1.7, .1]} size={[.08, 2.1, .035]} color={cream} glow={.25} />
    </group>)}
  </>;
}
function Records({ p, active }: { p: PlatformSpec; active: MutableRefObject<boolean> }) {
  const selected = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!selected.current) return;
    const local = THREE.MathUtils.clamp(Math.floor((playerAnchor.z - p.z + p.depth / 2) / (p.depth / 4)), 0, 3);
    selected.current.position.z = -p.depth / 2 + (local + .5) * p.depth / 4;
    selected.current.visible = active.current;
  });
  return <>
    <Block position={[0, -.425, 0]} size={[p.width, .85, p.depth]} color={green} radius={.16} />
    {[0, 1, 2, 3].map((row) => <group key={row} position={[0, .016, -p.depth / 2 + (row + .5) * p.depth / 4]}>
      {[-1, 0, 1].map((col) => <Block key={col} position={[col * p.width / 3, 0, 0]}
        size={[p.width / 3 - .13, .03, p.depth / 4 - .13]} color={row % 2 ? mint : "#edf6df"} radius={.035} />)}
    </group>)}
    <group ref={selected}>
      <Block position={[-p.width / 2 + .12, .06, 0]} size={[.12, .05, p.depth / 4 - .2]} color={gold} glow={.3} />
    </group>
  </>;
}
function Conveyor({ p, time }: { p: PlatformSpec; time: MutableRefObject<number> }) {
  const rollers = useRef<THREE.Group>(null);
  useFrame(() => { if (rollers.current) rollers.current.children.forEach((child) => { child.rotation.x = reducedMotion ? 0 : -time.current * 1.5; }); });
  return <>
    <Block position={[0, -.5, 0]} size={[p.width, .7, p.depth]} color={p.stage === 4 ? lilac : navy} />
    <group ref={rollers}>
      {Array.from({ length: 9 }, (_, i) => <group key={i} position={[0, -.14, (i - 4) * p.depth / 9]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[.14, .14, p.width - .45, 12]} /><meshStandardMaterial color={ice} metalness={.2} roughness={.5} /></mesh>
      </group>)}
    </group>
    {[-1, 1].map((side) => <Block key={side} position={[side * (p.width / 2 - .12), -.1, 0]} size={[.24, .2, p.depth]} color={p.stage === 4 ? gold : blue} />)}
  </>;
}
/** Each platform is the object itself; no generic tile is drawn underneath. */
export function StackPlatform({ p, time }: { p: PlatformSpec; time: MutableRefObject<number> }) {
  const active = useRef(false), signal = useRef<THREE.Group>(null);
  const t = stackThickness[p.kind] ?? .8;
  useFrame(() => {
    active.current = stackJourney.activated.has(p.id);
    if (signal.current) signal.current.scale.setScalar(active.current ? 1 : .65);
  });
  const round = (color: string, height = t) => <Cylinder position={[0, -height / 2, 0]} radius={p.width / 2} height={height} color={color} />;
  const box = (color: string, height = t) => <Block position={[0, -height / 2, 0]} size={[p.width, height, p.depth]} color={color} radius={.18} />;
  if (["gateway", "auth", "releaseGate"].includes(p.kind)) return <>
    {box(p.stage === 4 ? lilac : navy)}<Gate p={p} active={active} />
    <Power active={active} width={p.width - .8} z={p.depth / 2 - .35} />
    {[-1, 0, 1].map((i) => <Block key={i} position={[i * 1.3, -.4, p.depth / 2 + .04]} size={[.8, .22, .1]} color={ice} />)}
  </>;
  if (p.kind === "service") return <>
    {box(navy)}
    {[0, 1, 2, 3].map((i) => <group key={i} position={[0, -.4 - i * .6, p.depth / 2 + .025]}>
      <Block size={[p.width - .35, .45, .1]} color={i % 2 ? "#557e9c" : "#638cab"} radius={.05} />
      <Block position={[-p.width / 2 + .5, 0, .065]} size={[.12, .12, .04]} color={mint} glow={.3} />
      {[0, 1, 2].map((v) => <Block key={v} position={[p.width / 2 - .55 - v * .3, 0, .065]} size={[.08, .23, .04]} color={navy} />)}
    </group>)}
    <TopLabel text={p.motion === "elevator" ? "SCALE ↑" : "{ }"} color={ice} size={.55} />
    <Power active={active} width={p.width - .8} z={-p.depth / 2 + .4} />
  </>;
  if (p.kind === "queue" || p.kind === "buildRoller") return <>
    <Conveyor p={p} time={time} />
    {[-1, 1].map((side) => <group key={side} position={[side * (p.width / 2 + .24), -.3, 0]}>
      {[0, 1, 2].map((i) => <Block key={i} position={[0, 0, (i - 1) * 1.1]} size={[.3, .5, .65]} color={i === 1 ? gold : ice} radius={.05} />)}
    </group>)}
  </>;
  if (p.kind === "cache") return <>
    {box("#659ab0")}
    {[-1, 0, 1].map((col) => <group key={col} position={[col * (p.width - .5) / 3, 0, 0]}>
      <Block position={[0, .025, 0]} size={[(p.width - .9) / 3, .05, p.depth - .7]} color={navy} radius={.05} />
      {[-1, 0, 1].map((row) => <Block key={row} position={[0, .06, row * (p.depth - 1) / 3]} size={[(p.width - 1.3) / 3, .04, .65]} color={mint} radius={.03} />)}
    </group>)}
    <Power active={active} width={p.width - 1} z={p.depth / 2 - .18} />
    {[-1, 1].map((side) => <Block key={side} position={[side * (p.width / 2 + .08), -.6, 0]} size={[.16, .35, p.depth - 1]} color={gold} />)}
  </>;
  if (p.kind === "apiPipe") return <>
    <PipeMesh p={p} />
    {[-1, 1].map((side) => <mesh key={side} position={[0, -p.width / 2, side * (p.depth / 2 - .18)]}>
      <torusGeometry args={[p.width / 2 - .07, .1, 6, 24]} /><meshStandardMaterial color={ice} metalness={.3} roughness={.4} />
    </mesh>)}
    <Block position={[0, .04, 0]} size={[.16, .06, p.depth - .6]} color={mint} glow={.25} />
  </>;
  if (p.kind === "response") return <>
    {box(blue)}<TopLabel text="200 OK" size={.55} color={cream} />
    <Power active={active} width={p.width - .7} z={p.depth / 2 - .35} />
    {[-1, 1].map((side) => <Block key={side} position={[side * (p.width / 2 - .25), -.32, p.depth / 2 + .05]} size={[.2, .3, .15]} color={gold} />)}
  </>;
  if (p.kind === "dbRow") return <Records p={p} active={active} />;
  if (p.kind === "dbStack") return <>
    {round(green)}
    {[.25, 1.05, 1.85, 2.65].map((y) => <Cylinder key={y} position={[0, -y, 0]} radius={p.width / 2 + .035} height={.16} color={mint} />)}
    <mesh position={[0, .025, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[p.width * .31, p.width * .35, 32]} /><meshStandardMaterial color={cream} /></mesh>
    <TopLabel text="≡" color={cream} size={.8} />
  </>;
  if (p.kind === "dbIndex") return <>
    {box(green)}
    <Block position={[0, .025, 0]} size={[p.width - .5, .05, p.depth - .5]} color={cream} />
    {[-1, 0, 1].map((i) => <Block key={i} position={[i * 1.3, .075, -p.depth / 2 + .45]} size={[1.1, .08, .5]} color={[mint, gold, ice][i + 1]} radius={.05} />)}
    <Block position={[0, -.35, p.depth / 2 + .08]} size={[1.3, .17, .2]} color={gold} radius={.07} />
    <TopLabel text="INDEX ↑" size={.4} />
  </>;
  if (p.kind === "dbShard") return <>
    <mesh geometry={stackGeometry("dbShard", p.width, p.depth)} dispose={null} castShadow receiveShadow><meshStandardMaterial color={green} /></mesh>
    <mesh position={[0, .025, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[p.width * .25, p.width * .29, 6]} /><meshStandardMaterial color={cream} /></mesh>
    <TopLabel text={`#${p.index + 1}`} size={.48} />
  </>;
  if (p.kind === "dbJoin") return <>
    {[-1, 1].map((side) => <group key={side} position={[side * p.width / 4, 0, 0]}>
      <Block position={[0, -.35, 0]} size={[p.width / 2 - .25, .7, p.depth]} color={side === -1 ? green : "#91b5a0"} />
      {[-1, 0, 1].map((i) => <Block key={i} position={[0, .025, i * 1.25]} size={[p.width / 2 - .6, .05, .7]} color={mint} radius={.05} />)}
    </group>)}
    <Block position={[0, -.2, 0]} size={[.7, .4, 1.4]} color={gold} radius={.05} />
  </>;
  if (p.kind === "dbReplica") return <>
    {box("#72a793")}
    {[-1, 1].map((side) => <group key={side} position={[side * (p.width / 2 - .3), -.85, 0]}>
      {[-1, 0, 1].map((i) => <Block key={i} position={[0, i * .45, 0]} size={[.2, .18, p.depth - .5]} color={mint} />)}
    </group>)}
    <TopLabel text="⇄" color={cream} size={1} />
    <Power active={active} width={p.width - .8} z={p.depth / 2 - .3} />
  </>;
  if (p.kind === "dbCommit" || p.kind === "testPad") return <>
    {round(p.kind === "testPad" ? lilac : green)}
    <mesh position={[0, .025, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[p.width / 2 - .3, p.width / 2 - .18, 32]} /><meshStandardMaterial color={gold} /></mesh>
    <group ref={signal}><TopLabel text="✓" color={cream} size={1.25} /></group>
  </>;
  if (p.kind === "container") return <>
    {box(p.index % 2 ? "#b5aed3" : blue)}
    {Array.from({ length: 8 }, (_, i) => <Block key={i} position={[(i - 3.5) * (p.width - .7) / 8, .025, 0]} size={[.08, .05, p.depth - .3]} color={ice} radius={.02} />)}
    {[-1, 1].map((side) => <group key={side} position={[side * p.width / 4, -1.35, p.depth / 2 + .03]}>
      <Block size={[p.width / 2 - .16, 2.4, .07]} color={ice} radius={.04} />
      <Block position={[0, 0, .07]} size={[.09, 2, .07]} color={navy} />
    </group>)}
    <TopLabel text="{ }" color={navy} size={.6} />
  </>;
  if (p.kind === "cloudBucket") return <>
    <mesh geometry={stackGeometry("cloudBucket", p.width, p.depth)} dispose={null} castShadow receiveShadow><meshStandardMaterial color={ice} roughness={.55} metalness={.1} /></mesh>
    <Cylinder position={[0, -.04, 0]} radius={p.width / 2 + .025} height={.16} color={blue} />
    <TopLabel text="Cloud Storage" color={navy} size={.32} />
  </>;
  if (p.kind === "satellite") return <>
    <Block position={[0, -.25, 0]} size={[1.5, .5, p.depth]} color={cream} />
    {[-1, 1].map((side) => <group key={side} position={[side * (p.width + 1.5) / 4, 0, 0]}>
      <Block position={[0, -.15, 0]} size={[(p.width - 1.5) / 2, .3, p.depth]} color={navy} radius={.05} />
      {[0, 1, 2, 3].map((row) => <group key={row}>{[0, 1].map((col) => <Block key={col}
        position={[(col - .5) * (p.width - 1.5) / 4, .02, (row - 1.5) * (p.depth - .3) / 4]}
        size={[(p.width - 1.5) / 4 - .1, .04, (p.depth - .3) / 4 - .09]} color={blue} radius={.01} />)}</group>)}
    </group>)}
    <Power active={active} width={.9} z={0} />
  </>;
  if (p.kind === "loadBalancer" || p.kind === "cloudLift") return <>
    {box(p.kind === "cloudLift" ? "#b2a2cf" : navy)}
    {[-1, 0, 1].map((i) => <Block key={i} position={[i * p.width / 3, .02, 0]} size={[p.width / 3 - .25, .04, p.depth - .6]} color={ice} radius={.09} />)}
    <TopLabel text={p.kind === "cloudLift" ? "↑ ↑ ↑" : "↗ ↑ ↖"} size={.6} />
    <Power active={active} width={p.width - .8} z={p.depth / 2 - .2} />
  </>;
  if (p.kind === "region") return <>
    {box(ice)}
    {[-1, 1].map((side) => <group key={side} position={[side * (p.width / 2 - .3), .7, -1]}>
      <Block size={[.45, 1.4, 1.5]} color={blue} />
      {[-.4, 0, .4].map((y) => <Block key={y} position={[0, y, .8]} size={[.24, .08, .04]} color={mint} glow={.3} />)}
    </group>)}
    <TopLabel text="REGION" color={navy} size={.4} />
    <Power active={active} width={p.width - 1.2} z={p.depth / 2 - .3} />
  </>;
  if (p.kind === "artifact") return <>
    {box(cream)}
    <Label position={[0, .025, 0]} rotation={[-Math.PI / 2, 0, 0]} size={.65} color={ink}>
      {`v${stackLayouts[p.stage].slice(0, p.index + 1).filter(([kind]) => kind === "artifact").length}.0`}
    </Label>
  </>;
  if (p.kind === "deployPad") return <>
    {round(ink)}
    <mesh position={[0, .03, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[p.width / 2 - .5, p.width / 2 - .32, 48]} /><meshStandardMaterial color={gold} emissive={gold} emissiveIntensity={.3} /></mesh>
    {Array.from({ length: 12 }, (_, i) => <group key={i} rotation={[0, i * Math.PI / 6, 0]}>
      <Block position={[0, .055, p.width / 2 - .7]} size={[.15, .06, .4]} color={cream} glow={.15} />
    </group>)}
  </>;
  return null;
}
