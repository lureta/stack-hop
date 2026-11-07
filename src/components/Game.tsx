import { nearbyStory, STORY_BASE } from "../data/storyStops";
import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Physics,
  RigidBody,
  CapsuleCollider,
  useRapier,
  type RapierRigidBody,
} from "@react-three/rapier";
import * as THREE from "three";
import { resetBackendFactory } from "../data/backendFactory";
import { levels } from "../data/levels";
import { useDragView } from "../hooks/useDragView";
import { usePlayerKeyboard } from "../hooks/usePlayerKeyboard";
import { playCue } from "../hooks/gameAudio";
import Avatar, { type AvatarMotion } from "./Player/Avatar";
import { resetFrontend } from "./Worlds/FrontendScenes";
import World from "./Worlds/World";
import { launchSite, stackJourney } from "../data/stackJourney";
import { playerAnchor, playerMoveIntent, cameraObstacles } from "./Worlds/shared";
export { PortfolioShowcase } from "./Worlds/Exhibits";
export interface GameProps {
  stage: number;
  teleport: number;
  paused: boolean;
  launch: number;
  onCheckpoint: (n: number) => void;
  onNear: (n: number | null) => void;
  onFall: () => void;
  onReady: () => void;
  onComplete: () => void;
}
function Player(p: GameProps) {
  const body = useRef<RapierRigidBody>(null);
  const visual = useRef<THREE.Group>(null);
  const avatarMotion = useRef<AvatarMotion>({
    moving: false,
    airborne: false,
    verticalVelocity: 0,
    falling: false,
  });
  const jumpHeld = useRef(false);
  // Checkpoint saves change the respawn stage, not the player's current position.
  const initialPosition = useRef<[number, number, number]>([
    0, levels[p.stage].y + 0.85, levels[p.stage].z,
  ]);
  const lastSupported = useRef(-Infinity);
  const groundCarry = useRef<{
    handle: number;
    x: number;
    z: number;
    y: number;
    rotation: THREE.Quaternion;
    playerY: number;
    playerX: number;
    playerZ: number;
  } | null>(null);
  const ledgeJumpUsed = useRef(false);
  const ledgeDrive = useRef({ x: 0, z: 0, until: 0, top: Infinity });
  const lastReset = useRef(0);
  const pendingRespawn = useRef(false);
  const syncVisualUntil = useRef(0);
  const respawnCount = useRef(0);
  const hasMoved = useRef(false);
  const introBlend = useRef(1);
  const near = useRef<number | null>(null);
  const { camera, gl, scene } = useThree();
  const keys = usePlayerKeyboard(!p.paused, gl.domElement);
  const { world, rapier, rigidBodyStates } = useRapier();
  const target = new THREE.Vector3();
  const cameraAnchor = useRef(new THREE.Vector3());
  const cameraRay = useRef(new THREE.Raycaster());
  const wasGrounded = useRef(true);
  const shadow = useRef<THREE.Mesh>(null);
  const focus = useRef(new THREE.Vector3());
  const desiredFocus = useRef(new THREE.Vector3());
  const cameraRig = useRef(new THREE.PerspectiveCamera());
  const directionVector = useRef(new THREE.Vector3());
  const orbit = useDragView(gl.domElement, !p.paused, camera, focus);
  function resetPlayer(stage: number, reason: "spawn" | "teleport" | "fall") {
    const b = body.current;
    if (!b) return;
    if (stage === 0 && reason !== "fall") { resetFrontend(); stackJourney.activated.clear(); resetBackendFactory(); }
    const spawn = { x: 0, y: levels[stage].y + 0.85, z: levels[stage].z };
    b.setTranslation(spawn, true);
    b.setLinvel({ x: 0, y: 0, z: 0 }, true);
    b.setAngvel({ x: 0, y: 0, z: 0 }, true);
    b.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
    b.resetForces(true);
    b.resetTorques(true);
    const state = rigidBodyStates.get(b.handle);
    if (state) {
      state.object.position.set(spawn.x, spawn.y, spawn.z);
      state.object.quaternion.identity();
      state.object.updateMatrixWorld(true);
    }
    lastReset.current = performance.now();
    syncVisualUntil.current = lastReset.current + 180;
    pendingRespawn.current = false;
    keys.current.clear();
    jumpHeld.current = false;
    lastSupported.current = -Infinity;
    groundCarry.current = null;
    ledgeJumpUsed.current = false;
    ledgeDrive.current.until = 0;
    wasGrounded.current = true;
    Object.assign(avatarMotion.current, {
      moving: false,
      airborne: false,
      falling: false,
      verticalVelocity: 0,
      expression: "idle",
    });
    if (visual.current) visual.current.rotation.set(0, 0, 0);
    if (shadow.current) shadow.current.visible = false;
    playerAnchor.set(spawn.x, spawn.y, spawn.z);
    near.current = null;
    p.onNear(null);
    orbit.current.active = false;
    hasMoved.current = false;
    introBlend.current = 1;
    focus.current.set(spawn.x, spawn.y + 1.6, spawn.z);
    camera.up.set(0, 1, 0);
    camera.position.set(spawn.x, spawn.y + 6.3, spawn.z + 11);
    camera.lookAt(focus.current);
    camera.updateMatrixWorld(true);
    if (reason === "fall") respawnCount.current++;
    gl.domElement.dataset.player = JSON.stringify({
      ...spawn,
      vx: 0,
      vy: 0,
      vz: 0,
      dt: 0,
      expression: "idle",
      respawns: respawnCount.current,
      camera: camera.position.toArray(),
      cameraQuaternion: camera.quaternion.toArray(),
      heading: 0,
    });
    gl.domElement.dataset.resetReason = reason;
  }
  const shadersReady = useRef(false);
  const readyReported = useRef(false);
  const settledFrames = useRef(0);
  useEffect(() => {
    let cancelled = false;
    void gl
      .compileAsync(scene, camera)
      .catch(() => undefined)
      .then(() => {
        if (!cancelled) shadersReady.current = true;
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    resetPlayer(p.stage, p.teleport === 0 ? "spawn" : "teleport");
  }, [p.teleport]);
  useFrame((_, dt) => {
    const b = body.current;
    if (!b) return;
    const pos = b.translation();
    if (
      (pendingRespawn.current || pos.y < levels[p.stage].y - 12) &&
      performance.now() - lastReset.current > 500
    ) {
      resetPlayer(p.stage, "fall");
      p.onFall();
      return;
    }
    // Do not interpolate a teleported body from its previous, off-map physics pose.
    if (performance.now() < syncVisualUntil.current) {
      const state = rigidBodyStates.get(b.handle);
      if (state) {
        state.object.position.set(pos.x, pos.y, pos.z);
        state.object.quaternion.identity();
        state.object.updateMatrixWorld(true);
      }
    }
    playerAnchor.set(pos.x, pos.y, pos.z);
    gl.domElement.dataset.player = JSON.stringify({
      x: pos.x,
      y: pos.y,
      z: pos.z,
      vy: b.linvel().y,
      vx: b.linvel().x,
      vz: b.linvel().z,
      dt,
      expression: avatarMotion.current.expression ?? "idle",
      respawns: respawnCount.current,
      heading: visual.current?.rotation.y ?? 0,
      camera: [camera.position.x, camera.position.y, camera.position.z],
      cameraQuaternion: camera.quaternion.toArray(),
    });
    let dx = 0,
      dz = 0;
    const k = keys.current;
    if (!p.paused) {
      dx =
        Number(k.has("KeyD") || k.has("ArrowRight")) -
        Number(k.has("KeyA") || k.has("ArrowLeft"));
      dz =
        Number(k.has("KeyS") || k.has("ArrowDown")) -
        Number(k.has("KeyW") || k.has("ArrowUp"));
    }
    if (orbit.current.active) {
      const { yaw } = orbit.current;
      const worldX = dx * Math.cos(yaw) + dz * Math.sin(yaw);
      dz = -dx * Math.sin(yaw) + dz * Math.cos(yaw);
      dx = worldX;
    }
    const len = Math.hypot(dx, dz) || 1;
    playerMoveIntent.set(dx / len, 0, dz / len);
    const attached = groundCarry.current;
    if (attached && !dx && !dz && !p.paused) {
      const platform = world.getRigidBody(attached.handle);
      if (platform?.isEnabled()) {
        const at = platform.translation();
        const rotation = new THREE.Quaternion()
          .copy(platform.rotation())
          .multiply(attached.rotation.clone().invert());
        const carried = new THREE.Vector3(
          attached.playerX - attached.x,
          attached.playerY - attached.y,
          attached.playerZ - attached.z,
        )
          .applyQuaternion(rotation)
          .add(new THREE.Vector3(at.x, at.y, at.z));
        if (
          Math.hypot(pos.x - carried.x, pos.z - carried.z) < 1.2 &&
          Math.abs(pos.y - carried.y) < 1.5
        ) {
          pos.x = carried.x;
          pos.y = carried.y;
          pos.z = carried.z;
          b.setTranslation(pos, true);
          b.setLinvel({ x: 0, y: 0, z: 0 }, true);
          playerAnchor.set(pos.x, pos.y, pos.z);
        }
      }
    }
    const v = b.linvel();
    // Probe the capsule's footprint, including toes that still overlap a ledge.
    let supportBody: RapierRigidBody | null = null;
    let supportHeight = pos.y;
    let supported = false,
      supportVelocity = 0;
    {
      for (let i = 0; i < 9; i++) {
        const angle = ((i - 1) / 8) * Math.PI * 2;
        const radius = i === 0 ? 0 : 0.26;
        const hit = world.castRayAndGetNormal(
          new rapier.Ray(
            {
              x: pos.x + Math.cos(angle) * radius,
              y: pos.y - 0.5,
              z: pos.z + Math.sin(angle) * radius,
            },
            { x: 0, y: -1, z: 0 },
          ),
          0.24,
          true,
          rapier.QueryFilterFlags.EXCLUDE_SENSORS,
          undefined,
          undefined,
          b,
        );
        if (hit && hit.normal.y > 0.5) {
          const groundVelocity = hit.collider.parent()?.linvel().y ?? 0;
          const onMovingSurface =
            !!hit.collider.parent()?.isKinematic() && Math.abs(v.y) < 4;
          const normalVelocity =
            v.x * hit.normal.x +
            (v.y - groundVelocity) * hit.normal.y +
            v.z * hit.normal.z;
          if (normalVelocity <= 0.6 || onMovingSurface) {
            supported = true;
            supportVelocity = onMovingSurface
              ? v.y
              : groundVelocity -
                (v.x * hit.normal.x + v.z * hit.normal.z) / hit.normal.y;
            supportBody = hit.collider.parent();
            supportHeight =
              pos.y - 0.5 - hit.timeOfImpact + 0.32 + 0.32 / hit.normal.y;
            break;
          }
        }
      }
    }
    if (supported && supportBody?.isKinematic()) {
      pos.y = supportHeight;
      b.setTranslation(pos, true);
      const platformPosition = supportBody.translation();
      groundCarry.current = {
        handle: supportBody.handle,
        x: platformPosition.x,
        z: platformPosition.z,
        y: platformPosition.y,
        rotation: new THREE.Quaternion().copy(supportBody.rotation()),
        playerY: pos.y,
        playerX: pos.x,
        playerZ: pos.z,
      };
    } else groundCarry.current = null;
    const now = performance.now();
    if (supported) {
      lastSupported.current = now;
      ledgeJumpUsed.current = false;
    }
    const jumping = k.has("Space");
    const freshJump = !p.paused && jumping && !jumpHeld.current;
    let ledge: { x: number; z: number; top: number } | null = null;
    // One assisted jump per airtime, and only where a reachable, clear ledge exists.
    if (
      freshJump &&
      !supported &&
      now - lastSupported.current > 120 &&
      !ledgeJumpUsed.current &&
      v.y <= 3 &&
      v.y > -14
    ) {
      const directions =
        len > 0 && (dx || dz) ? [{ x: dx / len, z: dz / len }] : [];
      for (let i = 0; i < 8; i++)
        directions.push({
          x: Math.cos((i * Math.PI) / 4),
          z: Math.sin((i * Math.PI) / 4),
        });
      for (const direction of directions) {
        let wall: ReturnType<typeof world.castRayAndGetNormal> = null;
        for (const height of [-0.45, 0.2, 0.75]) {
          const contact = world.castRayAndGetNormal(
            new rapier.Ray(
              { x: pos.x, y: pos.y + height, z: pos.z },
              { x: direction.x, y: 0, z: direction.z },
            ),
            0.72,
            true,
            rapier.QueryFilterFlags.EXCLUDE_SENSORS,
            undefined,
            undefined,
            b,
          );
          if (contact && Math.abs(contact.normal.y) <= 0.4) {
            wall = contact;
            break;
          }
        }
        if (!wall) continue;
        const x =
          pos.x + direction.x * wall.timeOfImpact - wall.normal.x * 0.34;
        const z =
          pos.z + direction.z * wall.timeOfImpact - wall.normal.z * 0.34;
        const top = world.castRayAndGetNormal(
          new rapier.Ray({ x, y: pos.y + 2.2, z }, { x: 0, y: -1, z: 0 }),
          2.75,
          true,
          rapier.QueryFilterFlags.EXCLUDE_SENSORS,
          undefined,
          undefined,
          b,
        );
        if (
          !top ||
          top.normal.y < 0.7 ||
          top.collider.handle !== wall.collider.handle
        )
          continue;
        const topY = pos.y + 2.2 - top.timeOfImpact;
        if (topY < pos.y - 0.52) continue;
        const blocked = world.castRay(
          new rapier.Ray({ x, y: topY + 0.05, z }, { x: 0, y: 1, z: 0 }),
          1.5,
          true,
          rapier.QueryFilterFlags.EXCLUDE_SENSORS,
          undefined,
          undefined,
          b,
        );
        if (blocked) continue;
        ledge = { x: -wall.normal.x, z: -wall.normal.z, top: topY };
        break;
      }
    }
    const canJump =
      freshJump && (now - lastSupported.current <= 120 || !!ledge);
    if (ledge) {
      gl.domElement.dataset.ledgeAssist = JSON.stringify({
        ...ledge,
        playerY: pos.y,
      });
      ledgeJumpUsed.current = true;
      ledgeDrive.current = {
        x: ledge.x * 3.5,
        z: ledge.z * 3.5,
        until: now + 900,
        top: ledge.top,
      };
    }
    if (canJump) {
      groundCarry.current = null;
      lastSupported.current = -Infinity;
      playCue("jump");
    }
    const riding = supported && !!supportBody?.isKinematic();
    const grounded =
      supported && (riding || Math.abs(v.y - supportVelocity) < 0.6);
    if (grounded && !wasGrounded.current) playCue("land");
    wasGrounded.current = grounded;
    if (grounded && !canJump) ledgeDrive.current.until = 0;
    const assisting = now < ledgeDrive.current.until && !p.paused;
    const ledgeCleared = pos.y - 0.64 > ledgeDrive.current.top + 0.02;
    b.setLinvel(
      {
        x: assisting
          ? ledgeCleared
            ? ledgeDrive.current.x
            : 0
          : (dx / len) * 6.7,
        y: canJump
          ? ledge
            ? Math.min(
                12.5,
                Math.max(8.2, Math.sqrt(44 * (ledge.top + 1.05 - pos.y))),
              )
            : 8.2
          : riding
            ? 0
            : v.y,
        z: assisting
          ? ledgeCleared
            ? ledgeDrive.current.z
            : 0
          : (dz / len) * 6.7,
      },
      true,
    );
    jumpHeld.current = jumping;
    if (visual.current) {
      if (dx || dz) visual.current.rotation.y = Math.atan2(dx, dz);
    }
    avatarMotion.current.moving = !!(dx || dz);
    avatarMotion.current.airborne =
      canJump ||
      !supported ||
      (!riding && Math.abs(v.y - supportVelocity) > 0.6);
    avatarMotion.current.falling = pos.y < levels[p.stage].y - 1.5 || v.y < -10;
    avatarMotion.current.verticalVelocity = v.y;
    let n: number | null = null;
    levels.forEach((l, i) => {
      if (i < 4 && Math.hypot(pos.x + 3.4, pos.z - (l.z - 2)) < 6.2) n = i;
      if (i === 4 && Math.hypot(pos.x, pos.z - (levels[4].z + launchSite.offsetZ)) < 5 &&
        Math.abs(pos.y - levels[4].y - launchSite.height) < 3.5) n = 4;
    });
    const story = nearbyStory(pos.x, pos.y, pos.z);
    if (story >= 0 && n === null) n = STORY_BASE + story;
    if (n !== near.current) {
      near.current = n;
      p.onNear(n);
    }
    const smoothDt = Math.min(dt, 0.1),
      alpha = 1 - Math.exp(-smoothDt * (orbit.current.active ? 16 : 7));
    if (dx || dz) hasMoved.current = true;
    introBlend.current = THREE.MathUtils.damp(
      introBlend.current,
      hasMoved.current ? 0 : 1,
      4,
      smoothDt,
    );
    const intro = introBlend.current;
    target.set(
      pos.x + 1.2 * (1 - intro),
      Math.max(pos.y, 0) + 6.2 + 0.1 * intro,
      pos.z + 12.5 - 1.5 * intro,
    );
    if (orbit.current.active) {
      const { yaw, pitch, radius } = orbit.current;
      target.set(
        pos.x + Math.sin(yaw) * Math.cos(pitch) * radius,
        Math.max(pos.y, 0) + 1.4 + Math.sin(pitch) * radius,
        pos.z + Math.cos(yaw) * Math.cos(pitch) * radius,
      );
    }
    cameraAnchor.current.set(pos.x, Math.max(pos.y, 0) + 0.8, pos.z);
    const direction = directionVector.current
        .copy(target)
        .sub(cameraAnchor.current),
      distance = direction.length();
    direction.normalize();
    cameraRay.current.set(cameraAnchor.current, direction);
    cameraRay.current.far = distance;
    const obstacle = cameraRay.current
      .intersectObjects([...cameraObstacles], true)
      .find((i) => i.distance > 1.8);
    if (obstacle && obstacle.distance < distance)
      target
        .copy(cameraAnchor.current)
        .addScaledVector(direction, Math.max(2.5, obstacle.distance - 0.4));
    camera.position.lerp(target, alpha);
    desiredFocus.current.set(
      pos.x - 0.3 * (1 - intro),
      Math.max(pos.y, 0) + 1.4 + 0.2 * intro,
      pos.z - 1.2 * (1 - intro),
    );
    if (orbit.current.active)
      desiredFocus.current.set(pos.x, Math.max(pos.y, 0) + 1.4, pos.z);
    focus.current.lerp(desiredFocus.current, alpha);
    cameraRig.current.position.copy(camera.position);
    cameraRig.current.up.set(0, 1, 0);
    cameraRig.current.lookAt(focus.current);
    if (orbit.current.active)
      camera.quaternion.copy(cameraRig.current.quaternion);
    else camera.quaternion.slerp(cameraRig.current.quaternion, alpha);
    if (!readyReported.current && shadersReady.current) {
      settledFrames.current =
        grounded && !pendingRespawn.current ? settledFrames.current + 1 : 0;
      if (
        settledFrames.current >= 6 &&
        performance.now() - lastReset.current > 700
      ) {
        readyReported.current = true;
        p.onReady();
      }
    }
    const contact = world.castRay(
      new rapier.Ray(
        { x: pos.x, y: pos.y - 0.6, z: pos.z },
        { x: 0, y: -1, z: 0 },
      ),
      5,
      true,
      rapier.QueryFilterFlags.EXCLUDE_SENSORS,
      undefined,
      undefined,
      b,
    );
    if (shadow.current) {
      shadow.current.visible = !!contact;
      if (contact) {
        shadow.current.position.set(
          pos.x,
          pos.y - 0.6 - contact.timeOfImpact + 0.012,
          pos.z,
        );
        shadow.current.scale.setScalar(1 + contact.timeOfImpact * 0.12);
        (shadow.current.material as THREE.MeshBasicMaterial).opacity =
          0.18 * (1 - contact.timeOfImpact / 5);
      }
    }
  });
  return (
    <>
      <RigidBody
        ref={body}
        name="player"
        colliders={false}
        enabledRotations={[false, false, false]}
        position={initialPosition.current}
        linearDamping={0.3}
        onIntersectionEnter={({ other }) => {
          if (
            other.colliderObject?.name === "hazard" &&
            performance.now() - lastReset.current > 500
          )
            pendingRespawn.current = true;
        }}
      >
        <CapsuleCollider
          args={[0.32, 0.32]}
          friction={0}
          frictionCombineRule={rapier.CoefficientCombineRule.Min}
        />
        <group ref={visual} position={[0, -0.64, 0]}>
          <Avatar motion={avatarMotion} />
        </group>
      </RigidBody>
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <circleGeometry args={[0.45, 24]} />
        <meshBasicMaterial
          color="#4f4265"
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}
export default function Game(p: GameProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ fov: 48, near: 0.1, far: 480 }}
      gl={{ antialias: true }}
    >
      <Suspense fallback={null}>
        <Physics gravity={[0, -22, 0]} timeStep={1 / 60}>
          <World {...p} />
          <Player {...p} />
        </Physics>
      </Suspense>
    </Canvas>
  );
}
