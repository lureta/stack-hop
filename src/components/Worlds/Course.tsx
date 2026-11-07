import { platformOpacity } from "../../data/platformFade";
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  RigidBody,
  CuboidCollider,
  CylinderCollider,
  ConvexHullCollider,
  TrimeshCollider,
  type RapierRigidBody,
  type RapierCollider,
} from "@react-three/rapier";
import * as THREE from "three";
import {
  cursorGeometry,
  FolderLid,
  PopupGate,
  mechanismStates,
  MechanismScenery,
} from "./FrontendMechanisms";
import { FrontendPlatform, visitFrontend, frontendJourney } from "./FrontendScenes";
import { dropdownRide, isNearDropdown } from "../../data/frontendMotion";
import { letterGeometry, buttonGeometry, typographySelection } from "../../data/uiPlaygroundGeometry";
import { iconCollider as glyphCollider } from "../../data/frontendShapes";
import { StackPlatform, stackThickness } from "./StackObjects";
import { stackKinds, stackJourney } from "../../data/stackJourney";
import { stackHull } from "../../data/stackGeometry";
import { toggleGeometry, TOGGLE_MAX_TILT } from "../../data/toggleGeometry";
import { loadingBars, loadingBarGeometry, uiIconGeometry, iconCollider } from "../../data/frontendShapes";
import {
  allPlatforms,
  platformStates,
  type PlatformSpec,
} from "../../data/course";
import {
  Label,
  playerAnchor,
  playerMoveIntent,
  reducedMotion,
} from "./shared";

function Platform({ p, paused }: { p: PlatformSpec; paused: boolean }) {
  const body = useRef<RapierRigidBody>(null),
    visual = useRef<THREE.Group>(null),
    details = useRef<THREE.Group>(null),
    signal = useRef<THREE.Mesh>(null),
    knobCollider = useRef<RapierCollider>(null),
    touchingPlayer = useRef<RapierRigidBody | null>(null),
    checked = useRef(false),
    press = useRef(0), burst = useRef(0), onButton = useRef(false);
  // Block materials are shared: fade private copies, never every matching-color object.
  const fadeMaterials = useRef(new Map<THREE.Mesh, { original: THREE.Material | THREE.Material[]; local: THREE.Material[]; opacity: number[]; depthWrite: boolean[] }>());
  useEffect(() => () => {
    fadeMaterials.current.forEach(({ original, local }, mesh) => {
      mesh.material = original;
      local.forEach(material => material.dispose());
    });
    fadeMaterials.current.clear();
  }, []);
  const time = useRef(2),
    collapse = useRef(0),
    liftStart = useRef<number | null>(null),
    tilt = useRef(0),
    rockerProgress = useRef(0),
    lastRockerContact = useRef(0),
    opening = useRef(0),
    landing = useRef(0),
    solid = useRef(true),
    warning = useRef(false);
  useEffect(() => {
    platformStates.set(p.id, { ...p, solid: true, warning: false });
    return () => {
      platformStates.delete(p.id);
    };
  }, [p]);
  useFrame((_, dt) => {
    if (!paused) time.current += dt;
    const t = time.current;
    if (p.kind === "checkbox") {
      checked.current = frontendJourney.checked.has(p.id);
      const player = touchingPlayer.current;
      if (!paused && !checked.current && player) {
        const pos = player.translation();
        const restingOnTop = pos.y > p.y + 0.56 && pos.y < p.y + 0.92 &&
          Math.abs(pos.x - p.x) < p.width / 2 + 0.12 &&
          Math.abs(pos.z - p.z) < p.depth / 2 + 0.12 && Math.abs(player.linvel().y) < 0.8;
        if (restingOnTop) {
          checked.current = true;
          frontendJourney.checked.add(p.id);
          landing.current = 1;
        }
      }
    }
    if (p.kind === "letter" && !paused && touchingPlayer.current) {
      const player = touchingPlayer.current;
      if (Math.abs(player.translation().y - p.y - .64) < .3 && Math.abs(player.linvel().y) < 1)
        typographySelection.current = p.fontVariant ?? 0;
    }
    if (stackKinds.has(p.kind) && !paused && touchingPlayer.current) {
      const player = touchingPlayer.current, pos = player.translation();
      const top = body.current?.translation().y ?? p.y;
      if (pos.y > top + .4 && pos.y < top + 1.15 && Math.abs(player.linvel().y) < 1)
        stackJourney.activated.add(p.id);
    }
    let x = p.x,
      y = p.y,
      z = p.z,
      on = true,
      warn = false;
    if (p.motion === "press") {
      if (!paused) {
      const player = touchingPlayer.current, pos = player?.translation() ?? playerAnchor;
      const top = p.y - press.current;
      const landed = (!!player || onButton.current) && pos.y > top + .4 && pos.y < top + 1 && Math.abs(pos.x - p.x) < p.width / 2 + .1 &&
        Math.abs(pos.z - p.z) < p.depth / 2 + .1 && (player?.linvel().y ?? 0) < 3;
      if (landed && !onButton.current) burst.current = 1;
      onButton.current = landed;
      press.current = THREE.MathUtils.damp(press.current, landed ? .22 : 0, 12, Math.min(dt, .1));
      burst.current = Math.max(0, burst.current - Math.min(dt, .1) * 1.3);
      }
      y -= press.current;
    }
    if (p.motion === "cursor") {
      const phase = t % 4.2;
      const travel =
        phase < 0.9
          ? 0
          : phase < 2.1
            ? (phase - 0.9) / 1.2
            : phase < 3
              ? 1
              : 1 - (phase - 3) / 1.2;
      const u = travel * travel * (3 - 2 * travel);
      x += u + Math.sin(u * Math.PI) * 0.6;
      y += u * 0.9;
      z -= u * 4;
    }
    if (p.motion === "folderStep") {
      const near = Math.hypot(playerAnchor.x - p.x, playerAnchor.z - p.z) < 12;
      if (!paused)
        opening.current = THREE.MathUtils.damp(
          opening.current,
          near ? 1 : 0,
          5,
          Math.min(dt, 0.1),
        );
      y -= (1 - opening.current) * 2;
    }
    if (p.motion === "seesaw") {
      const dy = playerAnchor.y - p.y, dz = playerAnchor.z - p.z;
      const localZ = -dy * Math.sin(tilt.current) + dz * Math.cos(tilt.current);
      const localY = dy * Math.cos(tilt.current) + dz * Math.sin(tilt.current);
      const onTop = Math.abs(playerAnchor.x - p.x) < p.width / 2 + 0.2 &&
        Math.abs(localZ) < p.depth / 2 + 0.3 && localY > 0.15 && localY < 2.4;
      if (!paused) {
        if (onTop) {
          lastRockerContact.current = t;
          // Only the approach-facing side of the raised thumb can drive it.
          // Standing on top or walking along the rim does not activate the switch.
          const parts = toggleGeometry(p.width, p.depth);
          const knobZ = parts.travel * (1 - 2 * tilt.current / TOGGLE_MAX_TILT);
          const x = playerAnchor.x - p.x, z = localZ - knobZ;
          const distance = Math.hypot(x, z);
          const pushing = playerMoveIntent.z < -0.25 && z > 0.2 &&
            distance < parts.knobRadius + 0.5 && distance > parts.knobRadius - 0.4 &&
            localY < parts.knobTop + 0.35;
          if (pushing) rockerProgress.current = Math.min(1,
            rockerProgress.current + Math.min(dt, 0.1) * 0.38);
        } else if (t - lastRockerContact.current > 2.5) rockerProgress.current = 0;
        tilt.current = THREE.MathUtils.damp(tilt.current, rockerProgress.current * TOGGLE_MAX_TILT, 3, Math.min(dt, 0.1));
      }
      body.current?.setNextKinematicRotation(
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), tilt.current),
      );
      knobCollider.current?.setTranslationWrtParent({
        x: 0, y: 0, z: toggleGeometry(p.width, p.depth).travel * (1 - 2 * tilt.current / TOGGLE_MAX_TILT),
      });
      mechanismStates.set(p.id, { tilt: tilt.current });
    }
    if (p.kind === "dropdown") {
      if (!paused && liftStart.current === null && isNearDropdown(playerAnchor, p)) liftStart.current = t;
      y += liftStart.current === null ? 0 : dropdownRide(t - liftStart.current);
    }
    if (p.motion === "elevator" && p.kind !== "dropdown" && liftStart.current !== null) {
      const elapsed = t - liftStart.current;
      const ramp =
        elapsed < 1
          ? 0
          : elapsed < 4
            ? (elapsed - 1) / 3
            : elapsed < 8
              ? 1
              : elapsed < 11
                ? 1 - (elapsed - 8) / 3
                : 0;
      y += (p.stage === 0 ? 4.2 : 3.2) * (ramp * ramp * (3 - 2 * ramp));
      if (elapsed > 12) liftStart.current = null;
    }
    if (p.motion === "slide") x += Math.sin(t * 0.65) * 0.6;
    if (p.motion === "float") y += Math.sin(t * 0.65) * 0.2;
    if (p.motion === "packet") {
      const phase = t % 6.8;
      on = phase >= 1.2;
      warn = phase > 5.7;
    }
    if (p.motion === "disappear" && collapse.current) {
      const since = t - collapse.current;
      on = since < 1.25 || since > 3.8;
      warn = since < 1.25;
      if (since > 4.15) collapse.current = 0;
    }
    if (on !== solid.current) {
      body.current?.setEnabled(on);
      solid.current = on;
    }
    warning.current = warn;
    if (details.current) {
      const fading = p.motion === "disappear" || p.motion === "packet";
      const alpha = fading && (p.motion === "packet" || collapse.current)
        ? platformOpacity(p.motion, p.motion === "packet" ? t : t - collapse.current, reducedMotion) : 1;
      details.current.visible = fading ? alpha > .001 : on;
      if (fading) details.current.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return;
        let entry = fadeMaterials.current.get(object);
        if (!entry) {
          const original = object.material, materials = Array.isArray(original) ? original : [original];
          const local = materials.map(material => { const copy = material.clone(); copy.transparent = true; return copy; });
          entry = { original, local, opacity: materials.map(m => m.opacity), depthWrite: materials.map(m => m.depthWrite) };
          object.material = Array.isArray(original) ? local : local[0];
          fadeMaterials.current.set(object, entry);
        }
        entry.local.forEach((material, i) => {
          material.opacity = entry.opacity[i] * alpha;
          material.depthWrite = entry.depthWrite[i] && alpha > .99;
        });
      });
    }
    if (
      ["press", "slide", "float", "elevator", "cursor", "folderStep"].includes(p.motion)
    )
      body.current?.setNextKinematicTranslation({ x, y, z });
    if (p.motion === "rotate")
      body.current?.setNextKinematicRotation(
        new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0),
          t * 0.35,
        ),
      );
    landing.current *= Math.exp(-dt * 9);
    if (visual.current) {
      visual.current.visible = Math.abs(playerAnchor.z - p.z) < 90;
      visual.current.scale.y =
        reducedMotion || p.kind === "folder"
          ? 1
          : 1 - landing.current * 0.045;
    }
    if (signal.current) {
      (signal.current.material as THREE.MeshBasicMaterial).color.set(
        !on ? "#e5b779" : warn ? "#ffc176" : "#c6ffe4",
      );
      signal.current.scale.setScalar(warn ? 1 + Math.sin(t * 8) * 0.08 : 1);
    }
    const state = platformStates.get(p.id);
    if (state)
      Object.assign(state, {
        x,
        y,
        z,
        tilt: tilt.current,
        open: p.kind === "dropdown" ? (mechanismStates.get(p.id)?.open ?? 0) : opening.current,
        solid: body.current?.isEnabled() ?? on,
        warning: warn,
        activated: stackKinds.has(p.kind) ? stackJourney.activated.has(p.id) : undefined,
        press: press.current, burst: burst.current,
        checked: p.kind === "checkbox" ? checked.current : undefined,
        cycle: t % (p.motion === "cursor" ? 4.2 : p.kind === "popup" ? 10 : 6.8),
      });
  });
  const moving = [
    "press",
    "slide",
    "float",
    "rotate",
    "elevator",
    "cursor",
    "seesaw",
    "folderStep",
  ].includes(p.motion);
  const frontendThickness: Record<string, number> = {
    colorpicker: 0.45, checkbox: 0.32, toggle: 1.12, spinner: 0.28, clock: 0.32, trash: 0.65,
    ramp: 0.65, popup: 0.65, browser: 0.65, tab: 0.32,
    folder: 0.18, dropdown: 0.8, gear: 0.65, camera: 0.55,
  };
  const stack = stackKinds.has(p.kind);
  const thickness = stack ? stackThickness[p.kind] : p.stage === 0 ? (frontendThickness[p.kind] ?? 0.55) : 0.55;
  return (
    <RigidBody
      ref={body}
      name={`platform-${p.id}`}
      type={moving ? "kinematicPosition" : "fixed"}
      colliders={false}
      position={[p.x, p.y, p.z]}
      rotation={[p.pitch ?? 0, 0, 0]}
      friction={1.2}
      onCollisionEnter={({ other }) => {
        if (other.rigidBodyObject?.name === "player") {
          landing.current = 1;
          if (["checkbox", "button", "letter"].includes(p.kind) || stack) touchingPlayer.current = other.rigidBody ?? null;
          if (p.stage === 0) visitFrontend(p.index);
          if (p.motion === "elevator" && p.kind !== "dropdown" && liftStart.current === null)
            liftStart.current = time.current;
          if (p.motion === "disappear" && !collapse.current)
            collapse.current = time.current;
        }
      }}
      onCollisionExit={({ other }) => {
        if (other.rigidBodyObject?.name === "player") touchingPlayer.current = null;
      }}
    >
      {p.kind === "toggle" && (
        <ConvexHullCollider ref={knobCollider}
          args={[toggleGeometry(p.width, p.depth).knob.attributes.position.array as Float32Array]}
          position={[0, 0, toggleGeometry(p.width, p.depth).travel]} />
      )}
      {stack && ["apiPipe", "dbShard", "cloudBucket"].includes(p.kind) ? (
        <ConvexHullCollider args={[stackHull(p.kind, p.width, p.depth)]} />
      ) : p.kind === "dbJoin" ? (
        <>
          {[-1, 1].map((side) => <CuboidCollider key={side} args={[(p.width / 2 - .25) / 2, .35, p.depth / 2]} position={[side * p.width / 4, -.35, 0]} />)}
          <CuboidCollider args={[.35, .2, .7]} position={[0, -.2, 0]} />
        </>
      ) : p.kind === "toggle" ? (
        <>
          <ConvexHullCollider args={[toggleGeometry(p.width, p.depth).housing.attributes.position.array as Float32Array]} />
          <TrimeshCollider args={iconCollider(toggleGeometry(p.width, p.depth).rim)} />
          <ConvexHullCollider args={[toggleGeometry(p.width, p.depth).floor.attributes.position.array as Float32Array]} />
        </>
      ) : p.kind === "cursor" ? (
        <ConvexHullCollider
          args={[cursorGeometry.attributes.position.array as Float32Array]}
        />
      ) : p.kind === "spinner" ? (
        <>{loadingBars(p.width).map((bar, i) => <ConvexHullCollider key={i}
          args={[loadingBarGeometry(p.width).attributes.position.array as Float32Array]}
          position={[bar.x, 0, bar.z]} rotation={[0, bar.angle, 0]} />)}</>
      ) : p.kind === "camera" ? (
        <TrimeshCollider args={iconCollider(uiIconGeometry(p.kind, p.width, p.depth))} />
      ) : p.kind === "trash" || p.kind === "gear" ? (
        <CuboidCollider args={[p.width / 2, .385, p.depth / 2]} position={[0, -.265, 0]} />
      ) : p.kind === "colorpicker" ? (
        <CuboidCollider args={[p.width / 2, 0.245, p.depth / 2]} position={[0, -0.205, 0]} />
      ) : p.kind === "checkbox" ? (
        <CuboidCollider args={[p.width / 2, 0.18, p.depth / 2]} position={[0, -0.14, 0]} />
      ) : p.kind === "folder" ? (
        <CuboidCollider args={[p.width / 2, 0.12, p.depth / 2]} position={[0, -0.06, 0]} />
      ) : p.kind === "letter" ? (
        <TrimeshCollider rotation={[Math.PI / 2, 0, 0]} args={glyphCollider(letterGeometry(p.glyph!, p.fontVariant!, p.width, p.depth))} />
      ) : p.kind === "html" || p.kind === "tag" ? (
        <CuboidCollider args={[p.width / 2, .45, p.depth / 2]} position={[0, -.45, 0]} />
      ) : p.kind === "button" ? (
        <ConvexHullCollider args={[buttonGeometry(p.width, p.depth).attributes.position.array as Float32Array]} />
      ) : p.round ? (
        <CylinderCollider
          args={[thickness / 2, p.width / 2]}
          position={[0, -thickness / 2, 0]}
        />
      ) : (
        <CuboidCollider
          args={[p.width / 2, thickness / 2, p.depth / 2]}
          position={[0, -thickness / 2, 0]}
        />
      )}
      {stack && ["gateway", "auth", "releaseGate"].includes(p.kind) && <>
        {[-1, 1].map((side) => <CuboidCollider key={side} args={[.15, 1.8, .275]} position={[side * (p.width / 2 - .12), 1.8, -.45]} />)}
        <CuboidCollider args={[(p.width + .15) / 2, .175, .35]} position={[0, 3.65, -.45]} />
      </>}
      {p.kind === "region" && [-1, 1].map((side) => <CuboidCollider key={side} args={[.225, .7, .75]} position={[side * (p.width / 2 - .3), .7, -1]} />)}
      <group ref={visual}>
        <group ref={details}>
          {stack ? <StackPlatform p={p} time={time} /> : p.stage === 0 ? (
            <FrontendPlatform p={p} tilt={tilt} checked={checked} />
          ) : null}
        </group>
      </group>
      {(p.motion === "disappear" || p.motion === "packet") && (
        <>
          <mesh
            ref={signal}
            position={[p.width / 2 - 0.35, 0.09, p.depth / 2 - 0.35]}
          >
            <sphereGeometry args={[0.11, 12, 8]} />
            <meshBasicMaterial color="#c6ffe4" />
          </mesh>
          <Label
            position={[0, 0.13, p.depth / 2 - 0.42]}
            rotation={[-Math.PI / 2, 0, 0]}
            size={0.18}
            color="#655676"
          >
            {p.motion === "disappear"
              ? "FADES AFTER TOUCH"
              : "WAIT FOR THE PACKET"}
          </Label>
        </>
      )}
    </RigidBody>
  );
}
export default function Course({ paused }: { paused: boolean }) {
  return (
    <>
      {allPlatforms.map((p) => (
        <Platform key={p.id} p={p} paused={paused} />
      ))}
      {allPlatforms.filter((p) => p.kind === "toggle" || p.kind === "dropdown").map((p) => <MechanismScenery key={`scenery-${p.id}`} p={p} paused={paused} />)}
      {allPlatforms
        .filter((p) => p.stage === 0 && p.kind === "folder")
        .map((p) => (
          <FolderLid key={p.id} p={p} paused={paused} />
        ))}
      {allPlatforms
        .filter((p) => p.stage === 0 && p.kind === "popup")
        .map((p) => (
          <PopupGate key={p.id} p={p} paused={paused} />
        ))}
    </>
  );
}
