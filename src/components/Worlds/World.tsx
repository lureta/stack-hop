import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";
import { levels } from "../../data/levels";
import { allPlatforms, platformStates } from "../../data/course";
import { WorldIsland } from "./Scenery";
import { Checkpoint, PortfolioShowcase } from "./Exhibits";
import { StoryMarkers } from "./StoryMarkers";
import { BackendFactory } from "./BackendFactory";
import Course from "./Course";
import WorldFabric from "./WorldFabric";
import RocketLaunch from "./RocketLaunch";
import { playerAnchor } from "./shared";
const skies = ["#e6dfef", "#dce9f2", "#dcece5", "#e4eaf4", "#e6ddef"].map(
  (c) => new THREE.Color(c),
);
function Lighting({ stage }: { stage: number }) {
  const light = useRef<THREE.DirectionalLight>(null),
    target = useRef(new THREE.Object3D());
  const { scene, gl } = useThree(),
    lastTelemetry = useRef(0);
  useEffect(() => {
    gl.domElement.dataset.course = JSON.stringify(allPlatforms);
  }, [gl]);
  useFrame((_, dt) => {
    if (scene.background instanceof THREE.Color)
      scene.background.lerp(skies[stage], Math.min(1, dt * 2));
    if (
      scene.fog instanceof THREE.Fog &&
      scene.background instanceof THREE.Color
    )
      scene.fog.color.copy(scene.background);
    if (light.current) {
      light.current.position.set(
        playerAnchor.x + 9,
        playerAnchor.y + 19,
        playerAnchor.z + 8,
      );
      target.current.position.set(
        playerAnchor.x,
        playerAnchor.y,
        playerAnchor.z - 4,
      );
      target.current.updateMatrixWorld();
    }
    lastTelemetry.current += dt;
    if (lastTelemetry.current > 0.12) {
      lastTelemetry.current = 0;
      gl.domElement.dataset.platforms = JSON.stringify([
        ...platformStates.values(),
      ]);
    }
  });
  return (
    <>
      <ambientLight intensity={0.55} />
      <hemisphereLight args={["#fff5ff", "#a9a7bd", 0.8]} />
      <directionalLight
        ref={light}
        target={target.current}
        position={[9, 20, 8]}
        intensity={1.45}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-17}
        shadow-camera-right={17}
        shadow-camera-top={17}
        shadow-camera-bottom={-17}
        shadow-camera-near={0.1}
        shadow-camera-far={65}
        shadow-normalBias={0.04}
        shadow-bias={-0.00015}
      />
      <primitive object={target.current} />
    </>
  );
}
export interface WorldProps {
  stage: number;
  paused: boolean;
  launch: number;
  onCheckpoint: (n: number) => void;
  onComplete: () => void;
}
export default function World(p: WorldProps) {
  return (
    <>
      <color attach="background" args={["#e6dfef"]} />
      <fog attach="fog" args={["#e6dfef", 110, 280]} />
      <Lighting stage={p.stage} />
      {levels.map((l, index) => (
        <group key={l.name}>
          <group position={[0, l.y, l.z]}>
            <RigidBody type="fixed" colliders={false}>
              <CuboidCollider
                args={[5.85, 0.5, 5.85]}
                position={[0, -0.58, 0]}
              />
              <WorldIsland stage={index} />
            </RigidBody>
          </group>
          {index > 0 && (
            <Checkpoint
              index={index}
              active={p.stage === index}
              onActivate={p.onCheckpoint}
            />
          )}
          {index < 4 && <PortfolioShowcase stage={index} />}
          <WorldFabric stage={index} />
        </group>
      ))}
      <Course paused={p.paused} />
      <StoryMarkers />
      <BackendFactory paused={p.paused} />
      <RocketLaunch launch={p.launch} onComplete={p.onComplete} />
    </>
  );
}
