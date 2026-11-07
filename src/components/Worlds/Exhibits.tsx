import { useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Image, RoundedBox } from "@react-three/drei";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";
import { levels } from "../../data/levels";
import { portfolio } from "../../data/portfolio";
import { showcases } from "../../data/showcases";
import { playCue } from "../../hooks/gameAudio";
import { Block, Label, playerAnchor, reducedMotion } from "./shared";
export function ParticleBurst({
  energy,
  color,
}: {
  energy: RefObject<number>;
  color: string;
}) {
  const ref = useRef<THREE.InstancedMesh>(null),
    dummy = new THREE.Object3D();
  useFrame(() => {
    if (!ref.current) return;
    const e = energy.current;
    ref.current.visible = e > 0.02;
    if (e <= 0.02) return;
    const age = 1 - e;
    for (let i = 0; i < 16; i++) {
      const a = i * 2.399;
      dummy.position.set(
        Math.cos(a) * age * 1.8,
        0.2 + Math.sin(age * Math.PI) * (0.5 + (i % 3) * 0.22),
        Math.sin(a) * age * 1.8,
      );
      dummy.scale.setScalar(e * 0.055);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 16]} visible={false}>
      <icosahedronGeometry args={[1, 0]} />
      <meshBasicMaterial color={color} />
    </instancedMesh>
  );
}
const checkpointHalo = new THREE.Shape();
checkpointHalo.moveTo(-1.65, -1.65);
checkpointHalo.lineTo(1.65, -1.65);
checkpointHalo.lineTo(1.65, 1.65);
checkpointHalo.lineTo(-1.65, 1.65);
checkpointHalo.closePath();
const checkpointHole = new THREE.Path();
checkpointHole.moveTo(-1.53, -1.53);
checkpointHole.lineTo(-1.53, 1.53);
checkpointHole.lineTo(1.53, 1.53);
checkpointHole.lineTo(1.53, -1.53);
checkpointHole.closePath();
checkpointHalo.holes.push(checkpointHole);
export function Checkpoint({
  index,
  active,
  onActivate,
}: {
  index: number;
  active: boolean;
  onActivate: (n: number) => void;
}) {
  const l = levels[index],
    { gl } = useThree();
  const glow = useRef<THREE.MeshStandardMaterial>(null),
    halo = useRef<THREE.Mesh>(null),
    pad = useRef<THREE.Group>(null),
    pulse = useRef(0);
  useFrame((_, dt) => {
    pulse.current *= Math.exp(-dt * 2.5);
    if (glow.current)
      glow.current.emissiveIntensity =
        (active ? 0.55 : 0.1) + pulse.current * 1.3;
    if (halo.current) {
      halo.current.visible = pulse.current > 0.02;
      halo.current.scale.setScalar(
        reducedMotion ? 1 : 1 + (1 - pulse.current) * 0.7,
      );
      (halo.current.material as THREE.MeshBasicMaterial).opacity =
        pulse.current * 0.65;
    }
    if (pad.current)
      pad.current.scale.set(
        reducedMotion ? 1 : 1 + pulse.current * 0.045,
        1,
        reducedMotion ? 1 : 1 + pulse.current * 0.045,
      );
  });
  return (
    <group position={[0, l.y, l.z]}>
      <group ref={pad}>
        <RoundedBox
          position={[0, -0.02, 0]}
          args={[3.2, 0.12, 3.2]}
          radius={0.05}
          smoothness={2}
        >
          <meshStandardMaterial
            ref={glow}
            color={active ? "#71c6a1" : l.color}
            emissive={active ? "#71c6a1" : l.color}
            emissiveIntensity={0.4}
            roughness={0.65}
          />
        </RoundedBox>
        {[-1, 1].flatMap((side) => [
          <Block
            key={`x${side}`}
            position={[side * 1.4, 0.06, 0]}
            size={[0.055, 0.015, 2.85]}
            color="#effff7"
            radius={0.005}
          />,
          <Block
            key={`z${side}`}
            position={[0, 0.06, side * 1.4]}
            size={[2.85, 0.015, 0.055]}
            color="#effff7"
            radius={0.005}
          />,
        ])}
      </group>
      <mesh
        ref={halo}
        position={[0, 0.08, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
      >
        <shapeGeometry args={[checkpointHalo]} />
        <meshBasicMaterial
          color="#acffdb"
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
      <ParticleBurst energy={pulse} color="#c0ffe0" />
      <Label
        position={[0, 0.02, 1.85]}
        rotation={[-Math.PI / 2, 0, 0]}
        size={0.16}
        color="#6a7f80"
      >
        {active ? "CHECKPOINT SAVED" : "TOUCH TO SAVE"}
      </Label>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          args={[1.6, 0.6, 1.6]}
          position={[0, 0.5, 0]}
          sensor
          name="checkpoint"
          onIntersectionEnter={({ other }) => {
            if (other.rigidBodyObject?.name === "player" && !active) {
              gl.domElement.dataset.checkpoint = String(index);
              gl.domElement.dataset.checkpointGlow = String(index);
              pulse.current = 1;
              playCue("checkpoint");
              onActivate(index);
            }
          }}
        />
      </RigidBody>
    </group>
  );
}
export function PortfolioShowcase({ stage }: { stage: number }) {
  const l = levels[stage],
    image = stage === 0 ? portfolio.photo : showcases[stage - 1].image;
  const rim = useRef<THREE.MeshStandardMaterial>(null);
  const screen = useRef<THREE.MeshStandardMaterial>(null);
  const proximity = useRef(0);
  useFrame(({ clock }, dt) => {
    const near =
      Math.hypot(playerAnchor.x + 3.4, playerAnchor.z - (l.z - 2)) < 6.2;
    proximity.current = THREE.MathUtils.damp(
      proximity.current,
      near ? 1 : 0,
      6,
      Math.min(dt, 0.1),
    );
    const glow = reducedMotion
      ? 0.7
      : (1 - Math.cos((clock.elapsedTime * Math.PI * 2) / 2.6)) / 2;
    if (rim.current) {
      rim.current.emissiveIntensity = 0.02 + proximity.current * glow * 1.5;
    }
    if (screen.current)
      screen.current.emissiveIntensity = 0.02 + proximity.current * glow * 0.65;
  });
  return (
    <group position={[-3.2, l.y, l.z - 2.7]} rotation={[0, 0.24, 0]}>
      <group>
        <RoundedBox
          position={[0, 2.55, 0]}
          args={[5.15, 3.45, 0.32]}
          radius={0.14}
          smoothness={2}
        >
          <meshStandardMaterial
            ref={rim}
            color="#61517e"
            emissive="#b799e7"
            emissiveIntensity={0.02}
            roughness={0.65}
          />
        </RoundedBox>
        <RoundedBox
          position={[0, 2.55, 0.19]}
          args={[4.85, 3.13, 0.08]}
          radius={0.035}
          smoothness={2}
        >
          <meshStandardMaterial
            ref={screen}
            color={stage === 0 ? "#fff1f7" : "#f2fbfb"}
            emissive="#cbb5ef"
            emissiveIntensity={0.02}
            roughness={0.65}
          />
        </RoundedBox>
        <Block
          position={[0, 4.05, 0.23]}
          size={[4.7, 0.22, 0.04]}
          color={l.color}
        />
        <Label position={[0, 3.64, 0.26]} size={0.25}>
          {stage === 0 ? "HELLO, WORLD!" : showcases[stage - 1].title}
        </Label>
        <Block
          position={[1.65, 1.35, 0.27]}
          size={[1.2, 0.5, 0.06]}
          color="#b799d2"
          radius={0.08}
        />
        <Label position={[1.65, 1.35, 0.32]} size={0.22} color="#fff8ff">
          Press E!
        </Label>
        {image && stage !== 0 ? (
          <Image url={image} position={[0, 2.63, 0.26]} scale={[4.2, 1.5]} />
        ) : (
          <>
            <Block
              position={[-1.35, 2.62, 0.26]}
              size={[1.45, 1.35, 0.06]}
              color={l.accent}
            />
            {stage === 0 && image ? (
              <Image url={image} position={[-1.35, 2.62, 0.31]} scale={[1.3, 1.3]} transparent />
            ) : <Label
              position={[-1.35, 2.62, 0.31]}
              size={stage === 0 ? 0.4 : 0.3}
            >
              {stage === 0 ? portfolio.initials : "</>"}
            </Label>}
            <Label position={[0.85, 2.94, 0.28]} size={0.16}>
              {stage === 0
                ? "About Me"
                : stage === 3
                  ? "BANKING / COGNITO / AWS"
                  : stage === 1
                    ? "FOCUS / XP / COMPUTER VISION"
                    : "STUDYDAY / PLAN & TRACK"}
            </Label>
            {[0, 1, 2].map((i) => (
              <Block
                key={i}
                position={[0.85, 2.55 - i * 0.24, 0.28]}
                size={[1.8 - i * 0.25, 0.08, 0.04]}
                color={i === 2 ? l.accent : "#d5cbe0"}
              />
            ))}
          </>
        )}
        <Block
          position={[0, 0.7, -0.42]}
          size={[0.4, 1.25, 0.3]}
          color="#b0a0c2"
        />
        <Block
          position={[0, 1.15, -0.22]}
          size={[0.7, 0.6, 0.16]}
          color="#8d79a7"
        />
        <Block
          position={[0, 0.03, -0.18]}
          size={[2.8, 0.18, 1.6]}
          color={l.color}
        />
        <Block
          position={[0, 0.15, -0.18]}
          size={[2.5, 0.12, 1.4]}
          color={l.accent}
        />
      </group>
      {stage > 0 && (
        <Label
          position={[0, 0.2, 1.25]}
          rotation={[-Math.PI / 2, 0, 0]}
          size={0.15}
          color="#806b96"
        >
          EXPLORE THE PROJECT
        </Label>
      )}
    </group>
  );
}
