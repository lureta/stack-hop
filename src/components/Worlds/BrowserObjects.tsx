import { useMemo } from "react";
import * as THREE from "three";
import { Block, Cylinder, Label } from "./shared";
import type { PlatformSpec } from "../../data/course";

function CloseButton({ x, z, size = 0.25 }: { x: number; z: number; size?: number }) {
  return <group position={[x, 0.035, z]}>
    {[-1, 1].map((s) => <group key={s} rotation={[0, s * Math.PI / 4, 0]}>
      <Block size={[size, 0.055, 0.055]} color="#66517e" radius={0.02} />
    </group>)}
  </group>;
}

/** A solid browser-tab silhouette, with sloping shoulders and a deep molded edge. */
export function BrowserTab({ p }: { p: PlatformSpec }) {
  const geometry = useMemo(() => {
    const w = p.width / 2, d = p.depth / 2;
    const shape = new THREE.Shape();
    shape.moveTo(-w, -d);
    shape.lineTo(w, -d);
    shape.lineTo(w - 0.18, d - 0.27);
    shape.quadraticCurveTo(w - 0.2, d, w - 0.5, d);
    shape.lineTo(-w + 0.5, d);
    shape.quadraticCurveTo(-w + 0.2, d, -w + 0.18, d - 0.27);
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: 0.32, bevelEnabled: false, curveSegments: 6, steps: 1,
    });
    g.rotateX(-Math.PI / 2);
    g.translate(0, -0.32, 0);
    return g;
  }, [p.width, p.depth]);
  return <>
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={p.index % 2 ? "#cfadd4" : "#bca2db"} roughness={0.65} />
    </mesh>
    <Block position={[-p.width / 2 + 0.7, 0.045, 0]} size={[0.42, 0.09, 0.42]} color="#fff1df" radius={0.07} />
    <Label position={[-0.15, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} size={0.22}>
      {p.index % 2 ? "index.html" : "styles.css"}
    </Label>
    <CloseButton x={p.width / 2 - 0.65} z={0} size={0.3} />
    <Block position={[0, -0.23, p.depth / 2 + 0.008]} size={[p.width - 0.4, 0.1, 0.035]} color="#87709e" radius={0.015} />
  </>;
}

/** Browser chrome is modeled into a thick frame, rather than a blank cream slab. */
export function BrowserWindow({ p }: { p: PlatformSpec }) {
  const w = p.width, d = p.depth;
  const headerZ = -d / 2 + 0.45;
  const addressZ = headerZ + 0.65;
  return <>
    <Block position={[0, -0.325, 0]} size={[w, 0.65, d]} color="#9373b3" radius={0.24} />
    <Block position={[0, 0.025, 0.08]} size={[w - 0.3, 0.05, d - 0.35]} color="#e8dcef" radius={0.1} />
    <Block position={[0, 0.09, headerZ]} size={[w - 0.28, 0.08, 0.72]} color="#ae91c5" radius={0.08} />
    <Block position={[-w * 0.19, 0.16, headerZ]} size={[w * 0.49, 0.14, 0.74]} color="#f5e9f4" radius={0.12} />
    <Block position={[-w * 0.36, 0.25, headerZ]} size={[0.27, 0.06, 0.27]} color="#ae91c5" radius={0.035} />
    <Label position={[-w * 0.2, 0.245, headerZ]} rotation={[-Math.PI / 2, 0, 0]} size={0.19}>Stack Hop</Label>
    <group position={[0, 0.21, 0]}><CloseButton x={0} z={headerZ} /></group>
    <group position={[w * 0.13, 0.15, headerZ]}>
      <Block size={[0.32, 0.07, 0.07]} color="#f7edf5" radius={0.02} />
      <Block size={[0.07, 0.07, 0.32]} color="#f7edf5" radius={0.02} />
    </group>
    <Block position={[0.3, 0.1, addressZ]} size={[w - 1.3, 0.1, 0.42]} color="#fff6ed" radius={0.12} />
    <Label position={[0.25, 0.165, addressZ]} rotation={[-Math.PI / 2, 0, 0]} size={0.14}>stackhop.dev</Label>
    {[-1, 0, 1].map((i) => <Cylinder key={i} position={[-w / 2 + 0.35 + (i + 1) * 0.19, 0.115, addressZ]} radius={0.055} height={0.07} color={i === 0 ? "#f0c996" : i === 1 ? "#a9cbb5" : "#d9a9bc"} />)}
    <Block position={[-w * 0.27, 0.105, 0.7]} size={[w * 0.25, 0.11, Math.max(0.65, d * 0.38)]} color="#c2add9" radius={0.14} />
    <Block position={[w * 0.12, 0.085, 0.4]} size={[w * 0.39, 0.07, 0.13]} color="#b79bc9" radius={0.025} />
    <Block position={[w * 0.08, 0.085, 0.75]} size={[w * 0.31, 0.07, 0.1]} color="#cbb8d8" radius={0.025} />
    <Block position={[w * 0.08, 0.13, 1.15]} size={[w * 0.25, 0.16, 0.4]} color="#d7a9c5" radius={0.09} />
    <Block position={[0, -0.42, d / 2 + 0.015]} size={[w - 0.55, 0.12, 0.035]} color="#c7afda" radius={0.02} />
  </>;
}
