import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { reducedMotion } from "./shared";
import type { PlatformSpec } from "../../data/course";

export function CheckboxPlatform({ p, checked }: { p: PlatformSpec; checked: { current: boolean } }) {
  const border = useRef<THREE.MeshStandardMaterial>(null);
  const face = useRef<THREE.MeshStandardMaterial>(null);
  const mark = useRef<THREE.Mesh>(null);
  const progress = useRef(0);
  const colors = useMemo(() => ["#9b84b4", "#4d816d", "#fff8f0", "#639e84"].map((c) => new THREE.Color(c)), []);
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-1, 0);
    shape.lineTo(-0.78, 0.22);
    shape.lineTo(-0.25, -0.32);
    shape.lineTo(0.77, 0.8);
    shape.lineTo(1, 0.57);
    shape.lineTo(-0.25, -0.78);
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.035, bevelEnabled: false, steps: 1 });
    const scale = Math.min(p.width, p.depth) / 2.6;
    g.scale(scale, scale, 1);
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0.042, 0);
    return g;
  }, [p.width, p.depth]);
  useFrame((_, dt) => {
    progress.current = reducedMotion ? Number(checked.current) : THREE.MathUtils.damp(progress.current, checked.current ? 1 : 0, 10, Math.min(dt, 0.1));
    const value = progress.current;
    border.current?.color.lerpColors(colors[0], colors[1], value);
    face.current?.color.lerpColors(colors[2], colors[3], value);
    if (mark.current) {
      mark.current.visible = value > 0.015;
      const pop = reducedMotion || !checked.current ? value : Math.max(0, 1 - Math.exp(-6 * value) * Math.cos(10 * value));
      mark.current.scale.set(pop, 1, pop);
    }
  });
  return <>
    <RoundedBox args={[p.width, 0.32, p.depth]} position={[0, -0.16, 0]} radius={0.12} smoothness={3} castShadow receiveShadow>
      <meshStandardMaterial ref={border} color="#9b84b4" roughness={0.6} />
    </RoundedBox>
    <RoundedBox args={[p.width - 0.32, 0.04, p.depth - 0.32]} position={[0, 0.02, 0]} radius={0.015} smoothness={2} receiveShadow>
      <meshStandardMaterial ref={face} color="#fff8f0" roughness={0.7} />
    </RoundedBox>
    <mesh ref={mark} geometry={geometry} visible={false} castShadow>
      <meshStandardMaterial color="#fffaf5" roughness={0.5} />
    </mesh>
  </>;
}
