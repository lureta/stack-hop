import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { storyStops, storyPlatform, storyReads } from "../../data/storyStops";
import { journeySigns } from "../../data/journeySigns";
import { placeJourneyPrompt } from "../../data/journeyPromptLayout";
import { Block, playerAnchor } from "./shared";

/** Solid signs placed in free space beside the route; ordinary depth testing hides obscured faces. */
function JourneyPrompt({ index }: { index: number }) {
  const root = useRef<THREE.Group>(null), face = useRef<THREE.Group>(null), badge = useRef<THREE.MeshBasicMaterial>(null);
  const nextCheck = useRef(0), clear = useRef(false);
  const stop = storyStops[index], base = storyPlatform(stop), copy = journeySigns[stop.id];
  const side = index % 2 ? -1 : 1;
  useFrame(({ camera, scene, clock }) => {
    if (!root.current || !face.current || !base) return;
    const nearby = Math.abs(playerAnchor.z - base.z) < 18 && Math.abs(playerAnchor.y - base.y) < 9;
    if (nearby && clock.elapsedTime >= nextCheck.current) {
      nextCheck.current = clock.elapsedTime + .4;
      const occupied: THREE.Box3[] = [], sphere = new THREE.Sphere();
      const anchor = new THREE.Vector3(base.x, base.y + 3, base.z);
      const visit = (object: THREE.Object3D) => {
        if (!object.visible || object.userData.journeyPrompt || object.name === "player") return;
        if (object instanceof THREE.Mesh && object.geometry instanceof THREE.BufferGeometry) {
          const geometry = object.geometry;
          if (!geometry.boundingSphere) geometry.computeBoundingSphere();
          if (geometry.boundingSphere) {
            sphere.copy(geometry.boundingSphere).applyMatrix4(object.matrixWorld);
            if (sphere.center.distanceTo(anchor) < sphere.radius + 14) {
              if (!geometry.boundingBox) geometry.computeBoundingBox();
              if (geometry.boundingBox) occupied.push(geometry.boundingBox.clone().applyMatrix4(object.matrixWorld));
            }
          }
        }
        object.children.forEach(visit);
      };
      visit(scene);
      const promptBase = stop.id === "design" ? { ...base, z: base.z - 1 } : base;
      const position = placeJourneyPrompt(promptBase, side, occupied, stop.id === "design" ? [2.2, 2.6, 3.2] : undefined, stop.id === "design" ? [2, 4.2] : undefined);
      clear.current = position !== null;
      if (position) root.current.position.copy(position);
    }
    root.current.visible = nearby && clear.current;
    face.current.rotation.y = Math.atan2(camera.position.x - root.current.position.x, camera.position.z - root.current.position.z);
    badge.current?.color.set(storyReads.has(stop.id) ? "#91bda6" : "#ac93c4");
  });
  if (!base || !copy) return null;
  return <group ref={root} name={`journey-prompt-${stop.id}`} userData={{ journeyPrompt: true }} visible={false}>
    <group ref={face}>
      <Block size={[3.7, 1.35, .16]} color="#ae96c3" radius={.16} />
      <Block position={[0, 0, .1]} size={[3.5, 1.15, .05]} color="#fff8f0" radius={.12} />
      <mesh position={[-1.32, -.15, .15]}><boxGeometry args={[.43, .43, .04]} /><meshBasicMaterial ref={badge} color="#ac93c4" /></mesh>
      <Text font="/world-font.ttf" position={[0, .3, .15]} fontSize={.15} color="#625077" maxWidth={3.1}>{copy.topic}</Text>
      <Text font="/world-font.ttf" position={[-1.32, -.15, .18]} fontSize={.27} color="#fff8f0">E</Text>
      <Text font="/world-font.ttf" position={[.25, -.15, .15]} fontSize={.18} color="#554265" maxWidth={2.45}>{copy.prompt}</Text>
    </group>
  </group>;
}
export function StoryMarkers() { return <>{storyStops.map((stop, i) => <JourneyPrompt key={stop.id} index={i} />)}</>; }
