import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Block, Cylinder, CloudShape, Label, Orb, playerAnchor, reducedMotion, type V3 } from "./shared";
import { levels } from "../../data/levels";
import { stackPlatforms } from "../../data/course";
import { launchSite } from "../../data/stackJourney";

const navy = "#71859c", blue = "#adc9db", ice = "#e0edf3", mint = "#c6e3d4", cream = "#fff3e5", gold = "#e7cea1", lilac = "#b8a5ce";
function Rack({ position, height = 8 }: { position: V3; height?: number }) {
  const rowSpacing = (height - 1.5) / 6;
  const rowHeight = Math.min(.7, rowSpacing - .1);
  return <group position={position}>
    <Block position={[0, height / 2, 0]} size={[4.5, height, 3.6]} color={navy} radius={.25} />
    <Block position={[0, -.2, 0]} size={[4.8, .4, 4.2]} color={blue} />
    {Array.from({ length: 6 }, (_, i) => <group key={i} position={[0, 1 + i * rowSpacing, 1.9]}>
      <Block size={[3.9, rowHeight, .15]} color={i % 2 ? "#5c839d" : "#729cb4"} radius={.05} />
      <Block position={[-1.5, 0, .1]} size={[.14, .14, .04]} color={mint} glow={.4} />
      <Block position={[.55, 0, .1]} size={[1.7, .15, .05]} color={navy} radius={.02} />
    </group>)}
    <Block position={[0, height + .15, 0]} size={[4.8, .3, 3.9]} color={ice} />
  </group>;
}
function DrawerWall({ position, side }: { position: V3; side: number }) {
  return <group position={position} rotation={[0, -side * .28, 0]}>
    <Block position={[0, 3.8, -.6]} size={[7.5, 8, 3]} color="#5c9785" radius={.3} />
    {Array.from({ length: 6 }, (_, i) => <group key={i} position={[(i % 2 - .5) * 3.5, 1 + Math.floor(i / 2) * 2.5, i === 3 ? 1.9 : 1.05]}>
      <Block size={[3.2, 2.1, i === 3 ? 3.6 : .4]} color={i === 3 ? cream : mint} radius={.12} />
      <Block position={[0, 0, i === 3 ? 1.85 : .25]} size={[1.1, .16, .2]} color={gold} radius={.06} />
      {i === 3 && [-1, 0, 1].map((n) => <Block key={n} position={[0, 1.1, n * .8]} size={[2.8, .3, .14]} color={n ? "#94bea4" : "#dbcf9c"} radius={.03} />)}
    </group>)}
    <Block position={[0, 8, -.5]} size={[8, .35, 3.6]} color={cream} />
  </group>;
}
function Dish({ position, scale = 1 }: { position: V3; scale?: number }) {
  return <group position={position} scale={scale}>
    <Cylinder position={[0, .7, 0]} radius={.18} height={1.4} color={lilac} />
    <group position={[0, 1.4, 0]} rotation={[.5, 0, -.3]}>
      <mesh rotation={[Math.PI, 0, 0]}><sphereGeometry args={[1.25, 20, 10, 0, Math.PI * 2, 0, Math.PI * .4]} /><meshStandardMaterial color={cream} side={THREE.DoubleSide} roughness={.5} /></mesh>
      <Cylinder position={[0, .5, 0]} radius={.06} height={1.25} color={navy} />
      <Orb position={[0, 1.1, 0]} scale={[.16, .16, .16]} color={gold} />
    </group>
  </group>;
}
function DataBelt({ position, stage }: { position: V3; stage: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current || reducedMotion) return;
    ref.current.children.forEach((child, i) => { child.position.z = 6 - ((clock.elapsedTime * 1.5 + i * 2.8) % 14); });
  });
  return <group position={position}>
    <Block position={[0, -.25, -1]} size={[2.3, .35, 16]} color={stage === 1 ? navy : lilac} />
    <group ref={ref}>{[0, 1, 2, 3, 4].map((i) => <group key={i} position={[0, .2, 6 - i * 2.8]}><Block size={[1.5, .5, 1.7]} color={i % 2 ? cream : ice} glow={stage === 1 ? .2 : 0} radius={.12} />{stage === 1 && <Label position={[0, .29, 0]} rotation={[-Math.PI / 2, 0, 0]} size={.25} color={navy}>{"{ }"}</Label>}</group>)}</group>
  </group>;
}
function RegionStation({ position }: { position: V3 }) {
  return <group position={position}>
    <CloudShape position={[0, -1.5, 0]} scale={3.3} />
    <Cylinder position={[0, -.3, 0]} radius={6.2} height={.65} color={ice} />
    <Rack position={[-2.5, 0, -1]} height={4} />
    <Rack position={[2.5, 0, -1]} height={5.5} />
    <Dish position={[3.7, 5.8, -.8]} scale={.7} />
    <Block position={[0, .1, 3.6]} size={[7.5, .12, 1.2]} color={lilac} />
    {[-1, 1].map((s) => <Block key={s} position={[s * 5.5, .5, 0]} size={[.15, 1, 5.5]} color={blue} />)}
  </group>;
}
function Entry({ stage }: { stage: number }) {
  const l = levels[stage];
  return <group position={[0, 0, -5.7]}>
    {[-1, 1].map((side) => <group key={side} position={[side * 4.1, 0, 0]}>
      <Block position={[0, 2.7, 0]} size={[.65, 5.4, .9]} color={stage === 2 ? "#78ac97" : stage === 4 ? lilac : navy} />
      <Block position={[0, 2.7, .48]} size={[.18, 4.3, .08]} color={stage === 4 ? gold : ice} glow={.25} />
    </group>)}
    <Block position={[0, 5.5, 0]} size={[8.9, .65, 1]} color={stage === 2 ? "#78ac97" : stage === 4 ? lilac : navy} />
    <Label position={[0, 5.52, .54]} size={.32} color={cream}>{l.theme.toUpperCase()}</Label>
  </group>;
}
function LiftFrame({ position, color }: { position: V3; color: string }) {
  return <group position={position}>
    {[-1, 1].map((side) => <group key={side} position={[side * 3.4, -1, 0]}>
      <Block position={[0, 2.7, 0]} size={[.35, 5.4, 4.9]} color={color} radius={.08} />
      <Block position={[-side * .22, 2.7, 1.8]} size={[.09, 5, .15]} color={cream} />
      <Block position={[-side * .22, 2.7, -1.8]} size={[.09, 5, .15]} color={cream} />
    </group>)}
    <Block position={[0, -1.2, 0]} size={[7.3, .4, 5.7]} color={color} />
  </group>;
}
function LaunchYard() {
  return <>
    <group position={[-12, 2, -26]} rotation={[0, .35, 0]}>
      <Block position={[0, 1.3, 0]} size={[5, 2.6, 5]} color={cream} />
      <Block position={[2.2, 4, -1]} size={[4.3, 2.8, 4.5]} color={ice} />
      <Block position={[0, 2.65, 0]} size={[.65, .1, 5.1]} color={lilac} />
      <Block position={[2.2, 5.45, -1]} size={[.6, .1, 4.6]} color={lilac} />
      <DataBelt position={[0, -.4, 8]} stage={4} />
    </group>
    <group position={[15, 5, -45]} rotation={[0, -.2, 0]}>
      <Block position={[0, 0, 0]} size={[6, .35, 5]} color={lilac} radius={.15} />
      {[0, 1, 2].map((i) => <group key={i} position={[(i - 1) * 1.7, .9 + (i === 1 ? .5 : 0), 0]}>
        <Block size={[1.5, 1.8 + (i === 1 ? 1 : 0), 2]} color={i === 1 ? ice : cream} radius={.16} />
        <Block position={[0, .1, 1.025]} size={[.9, .45, .06]} color={lilac} radius={.05} />
      </group>)}
    </group>
    <group position={[0, launchSite.height, launchSite.offsetZ]}>
      {[-1, 1].map((side) => <group key={side} position={[side * 5, 0, -1.8]}>
        {[-1, 1].map((x) => <Block key={x} position={[x * .65, 5.5, 0]} size={[.38, 11, .5]} color={lilac} />)}
        {[0, 1, 2, 3, 4].map((i) => <group key={i} position={[0, 1.2 + i * 2.2, 0]}>
          <Block size={[1.6, .18, .5]} color={cream} />
          <group rotation={[0, 0, side * .55]}><Block size={[.14, 2.3, .2]} color={lilac} /></group>
          <Orb position={[0, 0, .34]} scale={[.13, .13, .13]} color={gold} />
        </group>)}
      </group>)}
      <Block position={[0, 11.2, -1.8]} size={[11.8, .5, 1]} color={lilac} />
      <group position={[-10.5, 0, 0]} rotation={[0, .3, 0]}>
        <Block position={[0, 1.5, 0]} size={[6, 3, 5]} color={ice} />
        <Block position={[0, 3.2, 0]} size={[6.5, .4, 5.5]} color={lilac} />
        <Block position={[0, 2, 2.55]} size={[5.4, 1.3, .1]} color={navy} />
        {[-1, 0, 1].map((i) => <Block key={i} position={[i * 1.7, 2, 2.62]} size={[1.4, .8, .035]} color={blue} />)}
        <Dish position={[1, 3.5, -1]} scale={.7} />
      </group>
    </group>
  </>;
}
/** The large scenes are kept off the collision route, leaving every jump visible. */
export function StackScenes({ stage }: { stage: number }) {
  const root = useRef<THREE.Group>(null);
  const l = levels[stage];
  useFrame(() => {
    if (root.current) root.current.visible = Math.abs(playerAnchor.z - l.z + 45) < 110;
  });
  const lifts = stackPlatforms.filter((p) => p.stage === stage && p.motion === "elevator");
  return <group ref={root} position={[0, l.y, l.z]}>
    <Entry stage={stage} />
    {lifts.map((p) => <LiftFrame key={p.id} position={[p.x, p.y - l.y, p.z - l.z]} color={stage === 2 ? "#78ac97" : blue} />)}
    {stage === 1 && <>
      {[0, 1, 2].map((i) => <group key={i} position={[(i % 2 ? 1 : -1) * 15, i * 5 - 1, -22 - i * 31]} rotation={[0, (i % 2 ? -1 : 1) * .25, 0]}>
        <Rack position={[0, 0, 0]} height={8 + i} />
      </group>)}
      <DataBelt position={[-8, 3, -31]} stage={1} />
      <DataBelt position={[8, 11, -77]} stage={1} />
      <group position={[-16, 8, -55]} rotation={[0, .35, 0]}>
        <Block size={[7, 2.5, 5]} color={blue} />
        <Block position={[0, 1.6, 1.2]} size={[2.2, .7, 1]} color={navy} />
        <Label position={[0, 1.97, 1.2]} rotation={[-Math.PI / 2, 0, 0]} size={.26} color={cream}>API</Label>
        <Block position={[0, 1.29, .25]} size={[.1, .06, .9]} color={mint} />
        <Block position={[0, 1.29, -.15]} size={[4.5, .06, .1]} color={mint} />
        {[-1, 0, 1].map((i) => <group key={i} position={[i * 2.2, 0, -1.3]}>
          <Block position={[0, 1.29, .7]} size={[.1, .06, .9]} color={mint} />
          <Block position={[0, 1.8, 0]} size={[1.5, 1.1, 1.2]} color={navy} />
          {[0, 1, 2].map((row) => <Block key={row} position={[0, 1.5 + row * .3, .64]} size={[1.15, .12, .06]} color={row === 0 ? mint : ice} radius={.025} />)}
          <Label position={[0, 2.37, 0]} rotation={[-Math.PI / 2, 0, 0]} size={.18} color={cream}>{["AUTH", "SERVICE", "DATA"][i + 1]}</Label>
        </group>)}
      </group>
    </>}
    {stage === 2 && <>
      {[-1, 1].flatMap((side) => [0, 1].map((i) => <DrawerWall key={`${side}-${i}`} side={side} position={[side * 15, i * 9 - 1, -24 - i * 54]} />))}
      <group position={[-12, 7, -54]}>
        {[0, 1, 2].map((i) => <Cylinder key={i} position={[0, i * 1.7, 0]} radius={4.4} height={1.4} color={i % 2 ? mint : "#72b29a"} />)}
        <Cylinder position={[0, 4.5, 0]} radius={4.6} height={.3} color={cream} />
        <Label position={[0, 5.5, 3]} color="#528370" size={.6}>DATA VAULT</Label>
      </group>
    </>}
    {stage === 3 && <>
      <RegionStation position={[-14, 2, -24]} />
      <RegionStation position={[14, 11, -73]} />
      <CloudShape position={[10, -3, -10]} scale={2.5} />
      <CloudShape position={[-11, 5, -65]} scale={2.8} />
      <CloudShape position={[5, 8, -98]} scale={2.3} />
      <group position={[12, 3, -36]} rotation={[0, -.3, -.12]}>
        <Cylinder position={[0, 1.3, 0]} radius={1.2} height={2.6} color={cream} />
        {[-1, 1].map((side) => <Block key={side} position={[side * 4, 1.3, 0]} size={[5.2, .18, 4]} color={blue} />)}
        <Dish position={[0, 2.6, 0]} />
      </group>
    </>}
    {stage === 4 && <LaunchYard />}
  </group>;
}
