import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  RigidBody,
  CuboidCollider,
  type RapierRigidBody,
} from "@react-three/rapier";
import * as THREE from "three";
import { Block, Label, Cylinder, playerAnchor, reducedMotion } from "./shared";
import { DropdownMenu } from "./DropdownLift";
import { popupOffset } from "../../data/frontendMotion";
import { toggleGeometry, TOGGLE_MAX_TILT } from "../../data/toggleGeometry";
import { loadingBars, loadingBarGeometry } from "../../data/frontendShapes";
import type { PlatformSpec } from "../../data/course";

function LoadingIndicator({ p }: { p: PlatformSpec }) {
  const materials = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const colors = useMemo(() => [new THREE.Color("#dff5e5"), new THREE.Color("#4b9d78")], []);
  useFrame(({ clock }) => {
    const phase = reducedMotion ? 0 : clock.elapsedTime * .6;
    materials.current.forEach((material, i) => {
      if (!material) return;
      const trail = ((i / 12 - phase) % 1 + 1) % 1;
      material.color.lerpColors(colors[0], colors[1], trail ** 1.4);
      material.emissive.copy(material.color);
    });
  });
  return <>{loadingBars(p.width).map((bar, i) => <group key={i} position={[bar.x, 0, bar.z]} rotation={[0, bar.angle, 0]}>
    <mesh geometry={loadingBarGeometry(p.width)} dispose={null} castShadow receiveShadow>
      <meshStandardMaterial ref={(material) => { materials.current[i] = material; }} color={bar.color} emissive={bar.color} emissiveIntensity={.12} roughness={.5} />
    </mesh>
  </group>)}</>;
}

export const mechanismStates = new Map<
  string,
  { open?: number; clear?: boolean; tilt?: number }
>();
export const cursorGeometry = (() => {
  const shape = new THREE.Shape();
  const points = [
    [-1.5, 1.5],
    [0, -1.8],
    [1.5, 1.5],
    [0.45, 1.1],
    [0.55, 2],
    [0, 2.1],
    [-0.55, 1.1],
  ];
  shape.moveTo(points[0][0], -points[0][1]);
  points.slice(1).forEach(([x, z]) => shape.lineTo(x, -z));
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.32,
    bevelEnabled: false,
    steps: 1,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, -0.32, 0);
  return geometry;
})();
export function MechanismModel({
  p,
  tilt,
}: {
  p: PlatformSpec;
  tilt?: { current: number };
}) {
  const knob = useRef<THREE.Group>(null);
  useFrame(() => {
    if (knob.current) knob.current.position.z = toggleGeometry(p.width, p.depth).travel * (1 - 2 * (tilt?.current ?? 0) / TOGGLE_MAX_TILT);
  });
  if (p.kind === "cursor")
    return (
      <mesh geometry={cursorGeometry} castShadow receiveShadow>
        <meshStandardMaterial color="#fff4df" roughness={0.7} />
      </mesh>
    );
  if (p.kind === "toggle") {
    const parts = toggleGeometry(p.width, p.depth);
    return <>
      <mesh geometry={parts.housing} castShadow receiveShadow dispose={null}>
        <meshStandardMaterial color="#cc91aa" roughness={0.65} />
      </mesh>
      <mesh geometry={parts.rim} castShadow receiveShadow dispose={null}>
        <meshStandardMaterial color="#f0c4d3" roughness={0.55} />
      </mesh>
      <mesh geometry={parts.floor} receiveShadow dispose={null}>
        <meshStandardMaterial color="#9e6c89" roughness={0.85} />
      </mesh>
      <group ref={knob}>
        <mesh geometry={parts.knob} castShadow receiveShadow dispose={null}>
          <meshStandardMaterial color="#fff8ef" roughness={0.38} metalness={0.02} />
        </mesh>
        <Label position={[0, parts.knobTop + .035, -.8]} rotation={[-Math.PI / 2, 0, 0]} size={.7} color="#825772">↑</Label>
        <Label position={[0, parts.knobTop + .035, .35]} rotation={[-Math.PI / 2, 0, 0]} size={.34} color="#825772">{"PUSH TO\nSLIDE"}</Label>
      </group>
      {[-1, 1].map((end) => <Label key={end} position={[0, parts.rimTop + 0.025, end * (p.depth / 2 - 0.3)]} rotation={[-Math.PI / 2, 0, 0]} size={0.28}>{end === 1 ? "OFF" : "ON"}</Label>)}
    </>;
  }
  if (p.kind === "spinner") return <LoadingIndicator p={p} />;
  if (p.kind === "html")
    return (
      <>
        <group rotation={[0, -0.2, 0]}>
          <Block
            position={[0, -0.3, 0]}
            size={[1.15, 0.6, 4.8]}
            color="#a9c8d4"
            radius={0.1}
          />
        </group>
        {[-1, 1].flatMap((side) =>
          [-1, 1].map((end) => (
            <group
              key={`${side}${end}`}
              position={[side * 1.7, -0.3, end * 0.65]}
              rotation={[0, -side * end * 0.65, 0]}
            >
              <Block size={[1.9, 0.6, 0.8]} color="#c1a4d8" radius={0.08} />
            </group>
          )),
        )}
      </>
    );
  if (p.kind === "clock")
    return (
      <>
        <Cylinder
          position={[0, -0.16, 0]}
          radius={p.width / 2}
          height={0.32}
          color="#cba4ba"
        />
        <Cylinder
          position={[0, 0.025, 0]}
          radius={p.width / 2 - 0.2}
          height={0.05}
          color="#f4e9dc"
        />
        <Block
          position={[0, 0.07, -0.55]}
          size={[0.12, 0.06, 1.1]}
          color="#745d83"
          radius={0.015}
        />
        <group rotation={[0, 0.9, 0]}>
          <Block
            position={[0.5, 0.075, 0]}
            size={[1, 0.07, 0.12]}
            color="#745d83"
            radius={0.02}
          />
        </group>
        {Array.from({ length: 12 }, (_, i) => (
          <group key={i} rotation={[0, (i * Math.PI) / 6, 0]}>
            <Block
              position={[0, 0.065, 1.7]}
              size={[0.1, 0.04, 0.23]}
              color="#ac90b8"
              radius={0.01}
            />
          </group>
        ))}
      </>
    );
  return null;
}
// Back-edge hinges unfold the covers toward the next obstacle, making real ramps.
export function FolderLid({ p, paused }: { p: PlatformSpec; paused: boolean }) {
  const body = useRef<RapierRigidBody>(null),
    angle = useRef(0),
    q = useMemo(() => new THREE.Quaternion(), []);
  useFrame((_, dt) => {
    if (paused) return;
    const near = Math.hypot(playerAnchor.x - p.x, playerAnchor.z - p.z) < 10;
    angle.current = THREE.MathUtils.damp(
      angle.current,
      near ? -2.8 : 0,
      4,
      Math.min(dt, 0.1),
    );
    body.current?.setNextKinematicRotation(
      q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), angle.current),
    );
    mechanismStates.set(p.id, { open: angle.current / -2.8 });
  });
  return (
    <RigidBody
      ref={body}
      type="kinematicPosition"
      colliders={false}
      position={[p.x, p.y + 0.16, p.z - p.depth / 2]}
    >
      <CuboidCollider
        args={[p.width / 2, 0.07, p.depth / 2]}
        position={[0, 0, p.depth / 2]}
      />
      <Block
        position={[0, 0, p.depth / 2]}
        size={[p.width, 0.14, p.depth]}
        color="#ecd29f"
        radius={0.06}
      />
      <Block
        position={[-p.width * 0.25, 0.12, p.depth - 0.3]}
        size={[1.4, 0.1, 0.8]}
        color="#d2b179"
      />
    </RigidBody>
  );
}
export function PopupGate({ p, paused }: { p: PlatformSpec; paused: boolean }) {
  const body = useRef<RapierRigidBody>(null),
    time = useRef(2),
    { gl } = useThree();
  useFrame((_, dt) => {
    if (!paused) time.current += dt;
    const offset = popupOffset(time.current);
    body.current?.setNextKinematicTranslation({
      x: p.x + offset,
      y: p.y + 1.65,
      z: p.z - 1.2,
    });
    mechanismStates.set(p.id, { clear: Math.abs(offset) > 3 });
    gl.domElement.dataset.popupClear = String(Math.abs(offset) > 3);
  });
  return (
    <RigidBody
      ref={body}
      type="kinematicPosition"
      colliders={false}
      position={[p.x + 5, p.y + 1.65, p.z - 1.2]}
    >
      <CuboidCollider args={[2.05, 1, 0.18]} />
      <Block size={[4.1, 2, 0.36]} color="#b69bcd" radius={0.15} occluder />
      <Block
        position={[0, -0.1, 0.22]}
        size={[3.8, 1.5, 0.08]}
        color="#f0e3df"
        radius={0.035}
      />
      <Label position={[1.6, 0.75, 0.25]} size={0.28}>
        ×
      </Label>
      <Label position={[0, -0.1, 0.29]} size={0.29}>
        {"Uh oh!\nPopup in the way"}
      </Label>
    </RigidBody>
  );
}

/** Fixed frames make both mechanisms read as real controls, independently of their moving parts. */
export function MechanismScenery({ p, paused }: { p: PlatformSpec; paused: boolean }) {
  if (p.kind === "toggle") return <group position={[p.x, p.y, p.z]}>
    <group position={[0, -0.72, 0]} rotation={[0, 0, Math.PI / 2]}>
      <Cylinder radius={0.28} height={p.width + 0.6} color="#8f7aa4" />
    </group>
  </group>;
  if (p.motion !== "elevator") return null;
  return <DropdownMenu p={p} paused={paused} onOpen={(open) => mechanismStates.set(p.id, { open })} />;
}
