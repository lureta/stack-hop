import { useEffect, useRef, type ReactNode } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
const geometries = new Map<string, THREE.BufferGeometry>();
const materials = new Map<string, THREE.MeshStandardMaterial>();
const sphereGeometry = new THREE.SphereGeometry(1, 16, 12);
const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 24);
function material(color: string, glow = 0) {
  const key = `${color}-${glow}`;
  let result = materials.get(key);
  if (!result) {
    result = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.76,
      emissive: color,
      emissiveIntensity: glow,
    });
    materials.set(key, result);
  }
  return result;
}
export type V3 = [number, number, number];
export const reducedMotion = matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
export const playerAnchor = new THREE.Vector3(0, 0.85, 0);
export const playerMoveIntent = new THREE.Vector3();
export const cameraObstacles = new Set<THREE.Object3D>();
export function Block({
  position = [0, 0, 0],
  size,
  color,
  radius = 0.12,
  glow = 0,
  occluder = false,
}: {
  position?: V3;
  size: V3;
  color: string;
  radius?: number;
  glow?: number;
  occluder?: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useEffect(() => {
    const mesh = ref.current;
    if (mesh && occluder) cameraObstacles.add(mesh);
    return () => {
      if (mesh) cameraObstacles.delete(mesh);
    };
  }, [occluder]);
  const roundedRadius = Math.min(radius, ...size.map((n) => n / 2 - 0.001)),
    key = `${size.join(",")}-${roundedRadius}`;
  let geometry = geometries.get(key);
  if (!geometry) {
    geometry = new RoundedBoxGeometry(...size, 2, roundedRadius);
    geometries.set(key, geometry);
  }
  return (
    <mesh
      ref={ref}
      position={position}
      geometry={geometry}
      material={material(color, glow)}
      castShadow={Math.min(...size) > 0.14}
      receiveShadow
      dispose={null}
    />
  );
}
export function Label({
  position = [0, 0, 0],
  size = 0.22,
  color = "#5d507d",
  children,
  rotation = [0, 0, 0],
}: {
  position?: V3;
  size?: number;
  color?: string;
  children: ReactNode;
  rotation?: V3;
}) {
  return (
    <Text
      font="/world-font.ttf"
      position={position}
      rotation={rotation}
      fontSize={size}
      color={color}
      anchorX="center"
      anchorY="middle"
      textAlign="center"
    >
      {children}
    </Text>
  );
}
export function Cylinder({
  position = [0, 0, 0],
  radius = 1,
  height = 0.4,
  color,
  glow = 0,
}: {
  position?: V3;
  radius?: number;
  height?: number;
  color: string;
  glow?: number;
}) {
  return (
    <mesh
      position={position}
      scale={[radius, height, radius]}
      geometry={cylinderGeometry}
      material={material(color, glow)}
      castShadow={height > 0.15}
      receiveShadow
      dispose={null}
    />
  );
}
export function Orb({
  position = [0, 0, 0],
  scale = [1, 1, 1],
  color,
}: {
  position?: V3;
  scale?: V3;
  color: string;
}) {
  return (
    <mesh
      position={position}
      scale={scale}
      geometry={sphereGeometry}
      material={material(color)}
      castShadow
      dispose={null}
    />
  );
}
export function Cable({
  points,
  color = "#8edbd9",
  radius = 0.08,
}: {
  points: V3[];
  color?: string;
  radius?: number;
}) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(...p)),
  );
  return (
    <mesh>
      <tubeGeometry args={[curve, 24, radius, 8, false]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.25}
        roughness={0.6}
      />
    </mesh>
  );
}
export function CloudShape({
  position = [0, 0, 0],
  scale = 1,
  color = "#fff9f3",
}: {
  position?: V3;
  scale?: number;
  color?: string;
}) {
  return (
    <group position={position} scale={scale}>
      {[
        [-1, 0, 0],
        [0, 0.2, 0],
        [1, 0.02, 0],
        [0, 0, 0.65],
        [0, 0, -0.65],
      ].map((p, i) => (
        <Orb key={i} position={p as V3} scale={[1.12, 0.6, 1]} color={color} />
      ))}
    </group>
  );
}
export function Server({
  position = [0, 0, 0],
  scale = 1,
  color = "#647cad",
}: {
  position?: V3;
  scale?: number;
  color?: string;
}) {
  return (
    <group position={position} scale={scale}>
      <Block
        position={[0, 1.4, 0]}
        size={[1.45, 2.8, 1.1]}
        color={color}
        occluder
      />
      {[0, 1, 2, 3].map((i) => (
        <group key={i}>
          <Block
            position={[0, 0.45 + i * 0.6, 0.565]}
            size={[1.22, 0.42, 0.06]}
            color="#d9e9f6"
            radius={0.04}
          />
          <Block
            position={[-0.4, 0.45 + i * 0.6, 0.61]}
            size={[0.12, 0.12, 0.03]}
            color="#8af3d2"
            glow={0.5}
          />
          <Block
            position={[0.15, 0.45 + i * 0.6, 0.61]}
            size={[0.55, 0.045, 0.03]}
            color="#94adc8"
          />
        </group>
      ))}
    </group>
  );
}
export function DatabaseTower({
  position = [0, 0, 0],
  scale = 1,
}: {
  position?: V3;
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      {[0, 1, 2].map((i) => (
        <group key={i}>
          <Cylinder
            position={[0, 0.45 + i * 0.85, 0]}
            radius={1.2}
            height={0.72}
            color={i % 2 ? "#67bba9" : "#94d6c4"}
          />
          <Cylinder
            position={[0, 0.82 + i * 0.85, 0]}
            radius={1.24}
            height={0.07}
            color="#d6fff0"
            glow={0.35}
          />
        </group>
      ))}
    </group>
  );
}
