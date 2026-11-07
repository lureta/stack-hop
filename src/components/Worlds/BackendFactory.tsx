import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CuboidCollider, type RapierCollider } from "@react-three/rapier";
import * as THREE from "three";
import { allPlatforms } from "../../data/course";
import { levels } from "../../data/levels";
import { backendFactory as state, backendPoint, backendReady } from "../../data/backendFactory";
import { Block, Cylinder, Label, Orb, playerAnchor, reducedMotion, type V3 } from "./shared";
const cyan = "#a5cfdf", purple = "#b7a2d0", orange = "#e9c69e", dark = "#647c94";
function Barrier({ index, open, label }: { index: number; open: () => boolean; label: string }) {
  const collider = useRef<RapierCollider>(null), beams = useRef<THREE.Group>(null), green = useRef<THREE.Group>(null);
  const p = allPlatforms.find((v) => v.id === `1-${index}`)!;
  useFrame(({ clock }) => {
    const unlocked = open();
    collider.current?.setEnabled(!unlocked);
    if (beams.current) { beams.current.visible = !unlocked; beams.current.scale.x = reducedMotion ? 1 : .985 + Math.sin(clock.elapsedTime * 4) * .015; }
    if (green.current) green.current.visible = unlocked;
  });
  return <group position={[p.x, p.y, p.z - 1.55]}>
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider ref={collider} args={[p.width / 2 + .3, 2.5, .1]} position={[0, 2.4, 0]} />
    </RigidBody>
    {index === 14 && <>
      {[-1, 1].map((side) => <Block key={side} position={[side * (p.width / 2 + .3), 2.5, 0]} size={[.4, 5.4, .6]} color={purple} glow={.25} />)}
      <Block position={[0, 5.2, 0]} size={[p.width + 1, .4, .6]} color={cyan} glow={.5} />
    </>}
    <group ref={beams}>
      {[0, 1, 2, 3, 4, 5].map((i) => <Block key={i} position={[0, .35 + i * .62, 0]} size={[p.width, .055, .07]} color="#f3a0b9" glow={.8} radius={.02} />)}
      <Label position={[0, 4.25, .1]} size={.29} color="#df8eae">{label}</Label>
    </group>
    <group ref={green} visible={false}>
      <Block position={[0, 3.65, 0]} size={[p.width, .12, .12]} color="#96f4c6" glow={.7} />
      <Label position={[0, 4.25, .1]} size={index === 14 ? .65 : .3} color="#8bf0c1">{index === 14 ? "200 OK" : index === 4 ? "200 Authorized" : "200 OK · SERVER RESTORED"}</Label>
    </group>
  </group>;
}
function Token() {
  const root = useRef<THREE.Group>(null), p = backendPoint(3);
  useFrame(({ clock }) => {
    if (!root.current) return;
    root.current.visible = !state.token;
    root.current.rotation.y = reducedMotion ? 0 : clock.elapsedTime;
    root.current.position.y = p.y + 1 + (reducedMotion ? 0 : Math.sin(clock.elapsedTime * 2) * .1);
  });
  return <group ref={root} position={[p.x, p.y + 1, p.z]}>
    <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.52, .52, .14, 6]} /><meshStandardMaterial color={orange} emissive={orange} emissiveIntensity={.5} /></mesh>
    <Label position={[0, 0, .1]} size={.2} color={dark}>JWT</Label>
    <Label position={[0, .9, 0]} size={.22} color={orange}>ACCESS TOKEN</Label>
  </group>;
}
function Switch({ index }: { index: number }) {
  const lever = useRef<THREE.Group>(null), lamp = useRef<THREE.MeshStandardMaterial>(null);
  const p = backendPoint(11), x = p.x + (index - 1) * 1.5;
  useFrame((_, dt) => {
    const on = state.switches.has(index);
    if (lever.current) lever.current.rotation.x = THREE.MathUtils.damp(lever.current.rotation.x, on ? -.65 : .65, 8, Math.min(dt, .1));
    if (lamp.current) { lamp.current.color.set(on ? "#9bf6c6" : orange); lamp.current.emissive.copy(lamp.current.color); }
  });
  return <group position={[x, p.y, p.z + .4]}>
    <Block position={[0, .055, 0]} size={[.8, .11, .8]} color={dark} />
    <group ref={lever} position={[0, .12, -.15]}>
      <Cylinder position={[0, .22, 0]} radius={.055} height={.44} color="#f6e6da" />
      <mesh position={[0, .44, 0]}><sphereGeometry args={[.14, 10, 8]} /><meshStandardMaterial ref={lamp} emissiveIntensity={.35} /></mesh>
    </group>
    <Label position={[0, .1, .53]} rotation={[-Math.PI / 2, 0, 0]} size={.18} color={orange}>{`0${index + 1}`}</Label>
  </group>;
}
function Fan({ position }: { position: V3 }) {
  const fan = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (fan.current && !reducedMotion) fan.current.rotation.z = (fan.current.rotation.z + Math.min(dt, .05) * 3) % (Math.PI * 2);
  });
  return <group position={position}>
    <mesh><torusGeometry args={[.8, .09, 6, 20]} /><meshStandardMaterial color={cyan} emissive={cyan} emissiveIntensity={.2} /></mesh>
    <group ref={fan}>{[0, 1, 2, 3].map((i) => <group key={i} rotation={[0, 0, i * Math.PI / 2]}><Block position={[0, .42, 0]} size={[.22, .48, .08]} color={dark} radius={.06} /></group>)}</group>
    <mesh position={[0, 0, .06]}><sphereGeometry args={[.19, 16, 12]} /><meshStandardMaterial color={cyan} /></mesh>
    <mesh position={[1.08, .5, 0]}><sphereGeometry args={[.09, 8, 6]} /><meshBasicMaterial color={cyan} /></mesh>
  </group>;
}
function Robot({ position }: { position: V3 }) {
  const joint = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (joint.current && !reducedMotion) joint.current.rotation.z = Math.sin(clock.elapsedTime * 1.4) * .3; });
  return <group position={position}>
    <Cylinder radius={1} height={.5} color={dark} />
    <group ref={joint} position={[0, .3, 0]}>
      <Block position={[0, 1.4, 0]} size={[.45, 2.8, .55]} color={purple} />
      <Orb position={[0, 2.8, 0]} scale={[.4, .4, .4]} color={orange} />
      <Block position={[-1, 2.8, 0]} size={[2, .4, .5]} color={cyan} />
      {[-1, 1].map((s) => <Block key={s} position={[-2, 2.3, s * .3]} size={[.16, .9, .16]} color={dark} />)}
    </group>
  </group>;
}
/** Stateful puzzle objects use the existing capsule controller and checkpoint system. */
export function BackendFactory({ paused }: { paused: boolean }) {
  const root = useRef<THREE.Group>(null), screens = useRef<THREE.Group>(null);
  useFrame(({ gl }) => {
    if (root.current) root.current.visible = Math.abs(playerAnchor.z - levels[1].z + 45) < 100;
    if (!paused) {
      const near = (i: number, radius: number) => { const p = backendPoint(i); return Math.hypot(playerAnchor.x - p.x, playerAnchor.z - p.z) < radius && Math.abs(playerAnchor.y - p.y - .7) < 1.4; };
      if (near(0, 3)) state.entered = true;
      if (near(3, .95)) state.token = true;
      if (near(6, 2.5)) state.validated = true;
      if (near(8, 2.5)) {
        const p = backendPoint(8), lane = Math.round((playerAnchor.x - p.x) / 1.6);
        if (lane === 0) state.maze = true; else state.wrongDoor = lane;
      }
      if (near(11, 3)) {
        const p = backendPoint(11);
        for (let i = 0; i < 3; i++) if (Math.hypot(playerAnchor.x - p.x - (i - 1) * 1.5, playerAnchor.z - p.z - .4) < .7) state.switches.add(i);
      }
    }
    if (screens.current) screens.current.children.forEach((child, i) => { child.visible = i === 0 ? !state.maze && state.wrongDoor !== 2 : state.maze; });
    gl.domElement.dataset.backend = JSON.stringify({ token: state.token, validated: state.validated, maze: state.maze, wrongDoor: state.wrongDoor, switches: state.switches.size, ready: backendReady() });
  });
  const method = ["GET", "POST", "PUT", "DELETE"];
  return <group ref={root}>
    <Token />
    <Barrier index={4} open={() => state.token} label="401 Unauthorized · collect JWT" />
    <Barrier index={11} open={() => state.switches.size === 3} label="500 Internal Server Error · repair 3 switches" />
    <Barrier index={14} open={backendReady} label="Auth · endpoint · validation · repair" />
    {[0, 1, 2].map((i) => <Switch key={i} index={i} />)}
    {[1, 2, 3, 7].map((index, i) => { const p = backendPoint(index); return <Label key={index} position={[p.x, p.y + .09, p.z + 1.1]} rotation={[-Math.PI / 2, 0, 0]} size={.32} color={i % 2 ? orange : cyan}>{method[i]}</Label>; })}
    {(() => { const p = backendPoint(8); return <>
      {[-1, 0, 1].map((lane) => <group key={lane} position={[p.x + lane * 1.6, p.y, p.z]}>
        <Block position={[0, 2.8, 0]} size={[1.45, .3, .2]} color={lane === 0 ? cyan : purple} />
        <Label position={[0, 2.82, .13]} size={.14} color={dark}>{lane === 0 ? "/api/study" : lane < 0 ? "/missing" : "/unknown"}</Label>
        <Block position={[-.7, 1.35, 0]} size={[.1, 2.7, .15]} color={purple} />
      </group>)}
      <group ref={screens} position={[p.x, p.y + 3.6, p.z]}>
        <Label color={orange} size={.3}>404 Not Found · try /api/study</Label>
        <Label color={cyan} size={.3}>200 OK · endpoint found</Label>
      </group>
    </>; })()}
    {[10, 11, 12, 13].map((index, i) => { const p = backendPoint(index); return <Label key={index} position={[p.x, p.y + .14, p.z + 1.5]} rotation={[-Math.PI / 2, 0, 0]} size={.22} color={orange}>{["middleware", "validation", "controller", "service"][i]}</Label>; })}
    {[0, 1, 2].map((i) => <group key={i} position={[(i % 2 ? 1 : -1) * 15, levels[1].y + i * 5 - 1, levels[1].z - 22 - i * 31]} rotation={[0, (i % 2 ? -1 : 1) * .25, 0]}><Fan position={[0, 4, 2.3]} /></group>)}
    {[5, 10].map((index) => { const p = backendPoint(index); return <Robot key={index} position={[p.x + 6, p.y, p.z]} />; })}
    {[2, 5, 9, 13].map((index, i) => { const p = backendPoint(index); return <group key={index} position={[p.x + 8, p.y + 1, p.z]}>
      <Block size={i === 0 ? [1.6, 1.6, 1.6] : [3, 2.8, 3]} color={i === 0 ? purple : dark} />
      {i === 0 && <mesh><boxGeometry args={[3.1, 2.95, 3.1]} /><meshStandardMaterial color={cyan} transparent opacity={.12} depthWrite={false} /></mesh>}
      <Block position={[0, 1.48, 0]} size={[3.2, .16, 3.2]} color={purple} radius={.07} />
      <Label position={[0, .4, 1.56]} color={cyan} size={.24}>{["DOCKER", "REDIS", "MESSAGE QUEUE", "MICROSERVICE"][i]}</Label>
      <Label position={[0, -.3, 1.56]} color={orange} size={.25}>{'{ "data": "JSON" }'}</Label>
    </group>; })}
    {[-1, 1].map((side) => <group key={side} position={[side * 8, levels[1].y + 12, levels[1].z - 80]}>
      <Cylinder radius={.5} height={5} color={dark} /><Orb position={[0, 2.8, 0]} scale={[.4, .4, .4]} color={purple} />
      <Label position={[0, 3.8, 0]} size={.25} color={cyan}>WebSocket ↔</Label>
    </group>)}
    {(() => { const p = backendPoint(5); return <group position={[p.x - 8, p.y + 1, p.z]}>
      <Block size={[3, 1.1, 2.2]} color={dark} />
      <Label position={[0, .2, 1.14]} color={cyan} size={.25}>LOAD BALANCER</Label>
      {[-1, 0, 1].map((i) => <group key={i}>
          <Block position={[i * 1.7, .4, -3.5]} size={[1.3, 2, 1.2]} color={dark} />
        <Block position={[i * 1.7, .5, -2.87]} size={[.8, .12, .04]} color={cyan} glow={.4} />
      </group>)}
    </group>; })()}
  </group>;
}
