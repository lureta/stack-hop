import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Block, Label, reducedMotion } from "./shared";
import { platformStates, type PlatformSpec } from "../../data/course";

function Chevron() {
  return <>{[-1, 1].map((side) => <group key={side} position={[side * .13, 0, 0]} rotation={[0, 0, -side * Math.PI / 4]}>
    <Block size={[.11, .4, .07]} color="#715687" radius={.025} />
  </group>)}</>;
}

/** This extruded last option is the physical lift, attached to the bottom of the menu. */
export function DropdownOption({ p }: { p: PlatformSpec }) {
  return <>
    <Block position={[0, -.4, 0]} size={[p.width, .8, p.depth]} color="#a88fc2" radius={.16} />
    <Block position={[0, .025, .05]} size={[p.width - .55, .05, p.depth - .55]} color="#d9c6eb" radius={.025} />
    <Block position={[0, -.4, p.depth / 2 + .025]} size={[p.width - .55, .35, .05]} color="#eee1f2" radius={.025} />
  </>;
}

/** A single inline dropdown: the panel extends down to its protruding, rideable last row. */
export function DropdownMenu({ p, onOpen }: {
  p: PlatformSpec; paused: boolean; onOpen: (progress: number) => void;
}) {
  const panel = useRef<THREE.Group>(null), rows = useRef<THREE.Group>(null), arrow = useRef<THREE.Group>(null);
  const pops = useRef([0, 0, 0]), velocities = useRef([0, 0, 0]);
  const width = p.width + .4;
  useFrame((_, dt) => {
    const height = Math.max(0, Math.min(4.2, (platformStates.get(p.id)?.y ?? p.y) - p.y));
    const open = 1 - height / 4.2;
    rows.current?.children.forEach((row, i) => {
      const threshold = Math.max(.15, 3.9 - i * 1.5 - 1);
      const target = Number(height < threshold);
      if (reducedMotion) pops.current[i] = target;
      else {
        const elapsed = Math.min(dt, .06), steps = Math.max(1, Math.ceil(elapsed / .016)), step = elapsed / steps;
        for (let n = 0; n < steps; n++) {
          velocities.current[i] += (target - pops.current[i]) * 210 * step;
          velocities.current[i] *= Math.exp(-17 * step);
          pops.current[i] += velocities.current[i] * step;
        }
      }
      const pop = Math.max(0, Math.min(1.12, pops.current[i]));
      row.visible = pop > .05;
      row.scale.setScalar(.85 + pop * .15);
      row.position.y = -.9 - i * 1.5 + (1 - pop) * .12;
      row.position.z = .32 + (1 - pop) * .15;
      row.rotation.z = reducedMotion ? 0 : (i % 2 ? 1 : -1) * (1 - pop) * .035;
    });
    if (panel.current) {
      const pop = Math.min(1.08, Math.max(0, ...pops.current));
      panel.current.visible = pop > .05;
      panel.current.scale.setScalar(.96 + pop * .04);
    }
    if (arrow.current) arrow.current.rotation.z = open * Math.PI;
    onOpen(open);
  });
  return <group position={[p.x, p.y, p.z - p.depth / 2 + .12]}>
    <group position={[0, 5.25, 0]}>
      <Block size={[width, .85, .5]} color="#af96c6" radius={.14} />
      <Block position={[0, 0, .29]} size={[width - .16, .65, .08]} color="#f3eaf5" radius={.035} />
      <Label position={[-.35, 0, .35]} size={.28}>Jump menu</Label>
      <group position={[width / 2 - .52, 0, .36]} ref={arrow}><Chevron /></group>
    </group>
    <group position={[0, 4.8, 0]}>
      <group ref={panel}>
        <Block position={[0, -2.4, 0]} size={[width, 4.8, .42]} color="#b49acb" radius={.12} />
        <Block position={[0, -2.4, .24]} size={[width - .16, 4.65, .08]} color="#faf2f5" radius={.025} />
      </group>
      <group ref={rows}>
        {["Layout", "Components", "Next scene"].map((label, i) => <group key={label} position={[0, -.9 - i * 1.5, .32]}>
          <Block size={[width - .35, 1.2, .12]} color={i === 2 ? "#d9c6eb" : "#eee5f2"} radius={.07} />
          <Block position={[-width / 2 + .56, 0, .11]} size={[.32, .32, .08]} color={["#b8cbd5", "#c5b1dc", "#a8c8b9"][i]} radius={.06} />
          <Label position={[.15, 0, .12]} size={.25}>{label}</Label>
        </group>)}
      </group>
    </group>
  </group>;
}
