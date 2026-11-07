import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Block, Label, Cylinder, reducedMotion } from "./shared";
import { launchSite } from "../../data/stackJourney";
import { levels } from "../../data/levels";
import { playCue } from "../../hooks/gameAudio";
export default function RocketLaunch({
  launch,
  onComplete,
}: {
  launch: number;
  onComplete: () => void;
}) {
  const rocket = useRef<THREE.Group>(null),
    confetti = useRef<THREE.InstancedMesh>(null),
    fireworks = useRef<THREE.InstancedMesh>(null),
    smoke = useRef<THREE.Group>(null),
    elapsed = useRef(0),
    done = useRef(false),
    lastCount = useRef(3),
    [count, setCount] = useState(3);
  const dummy = new THREE.Object3D();
  useEffect(() => {
    elapsed.current = 0;
    done.current = false;
    lastCount.current = 3;
    setCount(3);
    if (rocket.current) rocket.current.position.y = 0;
    if (confetti.current) {
      confetti.current.visible = false;
      for (let i = 0; i < 64; i++)
        confetti.current.setColorAt(
          i,
          new THREE.Color(["#f5d185", "#d6b4f4", "#b9e9e1", "#f4c4db"][i % 4]),
        );
      if (confetti.current.instanceColor)
        confetti.current.instanceColor.needsUpdate = true;
    }
    if (smoke.current) smoke.current.visible = false;
    if (fireworks.current) {
      fireworks.current.visible = false;
      for (let i = 0; i < 48; i++)
        fireworks.current.setColorAt(
          i,
          new THREE.Color(
            ["#ffe3a3", "#e0bcff", "#aaf3de"][Math.floor(i / 16)],
          ),
        );
      if (fireworks.current.instanceColor)
        fireworks.current.instanceColor.needsUpdate = true;
    }
  }, [launch]);
  useFrame((_, dt) => {
    if (!launch) return;
    elapsed.current += dt;
    const t = elapsed.current,
      n = Math.max(0, 3 - Math.floor(t));
    if (n !== lastCount.current) {
      lastCount.current = n;
      setCount(n);
      if (n === 0) playCue("launch");
    }
    if (rocket.current && t > 3) rocket.current.position.y = (t - 3) ** 2 * 2.2;
    if (smoke.current) {
      smoke.current.visible = t > 2.8;
      smoke.current.scale.setScalar(Math.min(1.5, (t - 2.8) * 0.7));
      smoke.current.rotation.y = t * 0.25;
    }
    if (confetti.current) {
      confetti.current.visible = t > 4.4 && !reducedMotion;
      if (t > 4.4)
        for (let i = 0; i < 64; i++) {
          const age = (t - 4.4 + i * 0.025) % 2.8,
            a = i * 2.399;
          dummy.position.set(
            Math.cos(a) * age * (1 + (i % 3) * 0.3),
            2.5 + age * (3 + (i % 4) * 0.2) - age * age * 1.2,
            Math.sin(a) * age * (1 + (i % 3) * 0.3),
          );
          dummy.rotation.set(age + i, age * 2, age * 0.8);
          dummy.scale.set(0.055, 0.12, 0.025);
          dummy.updateMatrix();
          confetti.current.setMatrixAt(i, dummy.matrix);
        }
      confetti.current.instanceMatrix.needsUpdate = true;
    }
    if (fireworks.current) {
      fireworks.current.visible = t > 4.7 && !reducedMotion;
      for (let i = 0; i < 48; i++) {
        const group = Math.floor(i / 16),
          age = (t - 4.7 - group * 0.32) % 2.5,
          a = i * 2.399,
          spread = Math.max(0, age) * 1.8;
        dummy.position.set(
          (group - 1) * 3 + Math.cos(a) * spread,
          4 + group * 0.8 + Math.sin(a) * spread - age * age * 0.25,
          -2 + Math.sin(i * 1.7) * spread * 0.6,
        );
        dummy.scale.setScalar(age < 0 ? 0 : Math.max(0, 1 - age / 2.5) * 0.065);
        dummy.updateMatrix();
        fireworks.current.setMatrixAt(i, dummy.matrix);
      }
      fireworks.current.instanceMatrix.needsUpdate = true;
    }
    if (t > 7 && !done.current) {
      done.current = true;
      onComplete();
    }
  });
  return (
    <group position={[0, levels[4].y + launchSite.height, levels[4].z + launchSite.offsetZ]}>
      <Cylinder
        position={[0, 0.05, 0]}
        radius={2.9}
        height={0.22}
        color="#81709c"
      />
      <mesh position={[0, 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.45, 2.59, 40]} />
        <meshStandardMaterial
          color="#f3d48b"
          emissive="#f3d48b"
          emissiveIntensity={0.5}
        />
      </mesh>
      <group ref={rocket}>
        <mesh position={[0, 2.7, 0]} castShadow>
          <cylinderGeometry args={[0.86, 0.86, 3.5, 24]} />
          <meshStandardMaterial color="#fff8ed" roughness={0.65} />
        </mesh>
        <mesh position={[0, 5, 0]} castShadow>
          <coneGeometry args={[0.87, 1.3, 24]} />
          <meshStandardMaterial color="#b098d1" roughness={0.6} />
        </mesh>
        <Cylinder
          position={[0, 1.15, 0]}
          radius={0.92}
          height={0.4}
          color="#b098d1"
        />
        <mesh position={[0, 3.2, 0.85]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.09, 32]} />
          <meshStandardMaterial
            color="#6aaeca"
            metalness={0.25}
            roughness={0.25}
          />
        </mesh>
        {[0, 2.094, 4.189].map((a) => (
          <group key={a} rotation={[0, a, 0]}>
            <Block
              position={[0, 1.25, 0.95]}
              size={[0.26, 1.5, 0.9]}
              color="#b098d1"
            />
          </group>
        ))}
        {launch > 0 && (
          <mesh position={[0, 0.5, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.4, 1.6, 12]} />
            <meshBasicMaterial color="#ffd296" />
          </mesh>
        )}
      </group>
      <group ref={smoke} visible={false}>
        {Array.from({ length: 9 }, (_, i) => (
          <mesh
            key={i}
            position={[
              Math.cos(i * 2.4) * (0.7 + i * 0.12),
              0.3 + (i % 3) * 0.18,
              Math.sin(i * 2.4) * (0.7 + i * 0.12),
            ]}
          >
            <sphereGeometry args={[0.35 + i * 0.03, 10, 8]} />
            <meshStandardMaterial color="#eee5f4" transparent opacity={0.65} />
          </mesh>
        ))}
      </group>
      <instancedMesh
        ref={fireworks}
        args={[undefined, undefined, 48]}
        visible={false}
      >
        <sphereGeometry args={[1, 6, 4]} />
        <meshBasicMaterial />
      </instancedMesh>
      <instancedMesh
        ref={confetti}
        args={[undefined, undefined, 64]}
        visible={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial />
      </instancedMesh>
      <group position={[-4, 1.3, 1]} rotation={[0, 0.18, 0]}>
        <Block size={[2.4, 1.8, 0.22]} color="#66517f" />
        <Block
          position={[0, 0, 0.14]}
          size={[2.15, 1.55, 0.08]}
          color="#c6b0df"
        />
        <Label position={[0, 0.35, 0.2]} size={0.14}>
          LAUNCH SEQUENCE
        </Label>
        <Label
          position={[0, -0.13, 0.2]}
          size={launch ? 0.4 : 0.18}
          color="#fff5d9"
        >
          {launch
            ? count > 0
              ? `T − ${count}`
              : "LIFTOFF"
            : "READY TO DEPLOY"}
        </Label>
      </group>
      <Label
        position={[0, 0.2, 2.0]}
        rotation={[-Math.PI / 2, 0, 0]}
        size={0.22}
        color="#ffedb7"
      >
        [ E ] DEPLOY
      </Label>
    </group>
  );
}
