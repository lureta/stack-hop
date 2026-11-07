import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";
import { Block, Label, playerAnchor } from "./shared";
import { platformStates, type PlatformSpec } from "../../data/course";
import { hsvColor, pickerLayout, samplePicker } from "../../data/colorPicker";

function paintField(geometry: THREE.BufferGeometry, hue: number, width: number, depth: number) {
  const positions = geometry.attributes.position;
  const colors = geometry.attributes.color as THREE.BufferAttribute;
  const color = new THREE.Color();
  for (let i = 0; i < positions.count; i++) {
    hsvColor(hue, positions.getX(i) / width + 0.5, 0.5 - positions.getZ(i) / depth, color);
    colors.setXYZ(i, color.r, color.g, color.b);
  }
  colors.needsUpdate = true;
}
export function ColorPickerPlatform({ p }: { p: PlatformSpec }) {
  const layout = useMemo(() => pickerLayout(p.width, p.depth), [p.width, p.depth]);
  const { gl } = useThree();
  const dragging = useRef<number | null>(null);
  useEffect(() => {
    const stop = () => { dragging.current = null; delete gl.domElement.dataset.widgetDrag; };
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    window.addEventListener("blur", stop);
    return () => { stop(); window.removeEventListener("pointerup", stop); window.removeEventListener("pointercancel", stop); window.removeEventListener("blur", stop); };
  }, [gl]);
  const hue = useRef(0.76), saturation = useRef(0.42), value = useRef(0.82);
  const color = useMemo(() => hsvColor(0.76, 0.42, 0.82), []);
  const [hex, setHex] = useState(() => `#${color.getHexString().toUpperCase()}`);
  const lastHex = useRef(hex), labelTime = useRef(0);
  const swatch = useRef<THREE.MeshBasicMaterial>(null);
  const marker = useRef<THREE.Group>(null), hueMarker = useRef<THREE.Group>(null);
  const field = useMemo(() => {
    const geometry = new THREE.BoxGeometry(layout.wellWidth, 0.04, layout.wellDepth, 24, 1, 16);
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count * 3), 3));
    paintField(geometry, 0.76, layout.wellWidth, layout.wellDepth);
    return geometry;
  }, [layout]);
  const rainbow = useMemo(() => {
    const geometry = new THREE.BoxGeometry(0.28, 0.04, layout.wellDepth, 1, 1, 48);
    const positions = geometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    const color = new THREE.Color();
    for (let i = 0; i < positions.count; i++) {
      hsvColor(0.5 - positions.getZ(i) / layout.wellDepth, 1, 1, color);
      colors.set([color.r, color.g, color.b], i * 3);
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geometry;
  }, [layout]);
  function slideHue(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    const hit = event.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -p.y - .12), new THREE.Vector3());
    if (!hit) return;
    hue.current = THREE.MathUtils.clamp(.5 - (hit.z - p.z - layout.wellZ) / layout.wellDepth, 0, 1);
    paintField(field, hue.current, layout.wellWidth, layout.wellDepth);
  }
  useFrame((_, dt) => {
    labelTime.current += dt;
    const dy = playerAnchor.y - p.y;
    if (dragging.current === null && dy > 0.5 && dy < 1.1) {
      const sample = samplePicker(layout, playerAnchor.x - p.x, playerAnchor.z - p.z);
      if (sample?.type === "hue" && Math.abs(sample.hue - hue.current) > 0.001) {
        hue.current = sample.hue;
        paintField(field, hue.current, layout.wellWidth, layout.wellDepth);
      } else if (sample?.type === "well") {
        saturation.current = sample.saturation;
        value.current = sample.value;
      }
    }
    hsvColor(hue.current, saturation.current, value.current, color);
    swatch.current?.color.copy(color);
    marker.current?.position.set(layout.wellX + (saturation.current - 0.5) * layout.wellWidth, 0.085,
      layout.wellZ + (0.5 - value.current) * layout.wellDepth);
    hueMarker.current?.position.set(layout.hueX, 0.085, layout.wellZ + (0.5 - hue.current) * layout.wellDepth);
    const nextHex = `#${color.getHexString().toUpperCase()}`;
    const state = platformStates.get(p.id);
    if (state) { state.color = nextHex; state.hue = hue.current; }
    if (labelTime.current > 0.08 && nextHex !== lastHex.current) {
      labelTime.current = 0;
      lastHex.current = nextHex;
      setHex(nextHex);
    }
  });
  return <>
    <Block position={[0, -0.225, 0]} size={[p.width, 0.45, p.depth]} color="#a991bf" radius={0.18} />
    <Block position={[0, .025, -p.depth / 2 + .32]} size={[p.width - .3, .05, .5]} color="#bea7d0" radius={.025} />
    <Block position={[layout.wellX, 0.015, layout.wellZ]} size={[layout.wellWidth + 0.1, 0.03, layout.wellDepth + 0.1]} color="#705881" radius={0.01} />
    <mesh geometry={field} position={[layout.wellX, 0.02, layout.wellZ]}>
      <meshBasicMaterial vertexColors toneMapped={false} />
    </mesh>
    <Block position={[layout.hueX, 0.015, layout.wellZ]} size={[0.4, 0.03, layout.wellDepth + 0.1]} color="#705881" radius={0.01} />
    <mesh geometry={rainbow} position={[layout.hueX, 0.02, layout.wellZ]}>
      <meshBasicMaterial vertexColors toneMapped={false} />
    </mesh>
    <mesh position={[layout.hueX, .12, layout.wellZ]}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        dragging.current = event.pointerId;
        gl.domElement.dataset.widgetDrag = "hue";
        (event.target as HTMLElement).setPointerCapture(event.pointerId);
        slideHue(event);
      }}
      onPointerMove={(event) => { if (dragging.current === event.pointerId) slideHue(event); }}
      onPointerUp={(event) => { if (dragging.current !== event.pointerId) return; slideHue(event); dragging.current = null; delete gl.domElement.dataset.widgetDrag; (event.target as HTMLElement).releasePointerCapture(event.pointerId); }}>
      <boxGeometry args={[.8, .12, layout.wellDepth + .2]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
    <group ref={marker} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh><torusGeometry args={[0.15, 0.022, 6, 24]} /><meshBasicMaterial color="#403449" toneMapped={false} /></mesh>
      <mesh><torusGeometry args={[0.118, 0.02, 6, 24]} /><meshBasicMaterial color="#fffaf4" toneMapped={false} /></mesh>
    </group>
    <group ref={hueMarker}>
      <Block size={[0.53, 0.055, 0.12]} color="#4b3958" radius={0.015} />
      <Block position={[0, 0.035, 0]} size={[0.44, 0.025, 0.055]} color="#fffaf4" radius={0.008} />
    </group>
    <RoundedBox args={[1.3, 0.07, 1.3]} position={[-p.width / 2 + 1.05, 0.035, layout.footerZ]} radius={0.015} smoothness={2}>
      <meshBasicMaterial ref={swatch} color={color} toneMapped={false} />
    </RoundedBox>
    <Block position={[0.95, 0.0225, layout.footerZ]} size={[p.width - 3.2, 0.045, 0.8]} color="#fff7f1" radius={0.02} />
    <Label position={[0.95, 0.07, layout.footerZ]} rotation={[-Math.PI / 2, 0, 0]} size={0.23}>{hex}</Label>
  </>;
}
