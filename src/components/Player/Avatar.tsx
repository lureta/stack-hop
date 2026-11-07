import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import {
  hairMantleGeometry,
  roundedHeadGeometry,
  backHair,
  backLayers,
  frontHair,
  sideHair,
  headbandGeometry,
  smileGeometry,
  squintGeometry,
  crossGeometry,
  starGeometry,
  type Point3,
} from "./avatarGeometry";

export type AvatarExpression = "idle" | "jumping" | "falling";
export interface AvatarMotion {
  moving: boolean;
  airborne: boolean;
  verticalVelocity: number;
  falling?: boolean;
  expression?: AvatarExpression;
}
const colors = {
  skin: "#e1b293",
  hair: "#332a32",
  hairLight: "#3d313b",
  hoodie: "#b79ad9",
  rib: "#a98acb",
  cream: "#f4e5d1",
  creamShade: "#e6d4be",
  white: "#fff9fc",
  ink: "#241f25",
};
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

function Box({
  position,
  size,
  color,
  radius = 0.045,
}: {
  position: Point3;
  size: Point3;
  color: string;
  radius?: number;
}) {
  return (
    <RoundedBox
      args={size}
      position={position}
      radius={Math.min(radius, ...size.map((n) => n / 2 - 0.001))}
      smoothness={3}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color={color} roughness={0.66} />
    </RoundedBox>
  );
}
function Oval({
  position,
  scale,
  color,
}: {
  position: Point3;
  scale: Point3;
  color: string;
}) {
  return (
    <mesh position={position} scale={scale} castShadow>
      <sphereGeometry args={[1, 24, 16]} />
      <meshStandardMaterial color={color} roughness={0.65} />
    </mesh>
  );
}
function CodeMark({
  scale = 1,
  color = colors.white,
}: {
  scale?: number;
  color?: string;
}) {
  return (
    <group scale={scale}>
      {[-1, 1].map((side) => (
        <group key={side}>
          {[-1, 1].map((half) => (
            <group
              key={half}
              position={[side * 0.055, half * 0.018, 0]}
              rotation={[0, 0, side * half * 0.8]}
            >
              <Box
                position={[0, 0, 0]}
                size={[0.012, 0.055, 0.009]}
                radius={0.004}
                color={color}
              />
            </group>
          ))}
        </group>
      ))}
      <group rotation={[0, 0, -0.28]}>
        <Box
          position={[0, 0, 0]}
          size={[0.012, 0.08, 0.009]}
          radius={0.004}
          color={color}
        />
      </group>
    </group>
  );
}
function Star({
  position,
  scale,
  color,
  rotation = [0, 0, 0],
}: {
  position: Point3;
  scale: number;
  color: string;
  rotation?: Point3;
}) {
  return (
    <mesh
      geometry={starGeometry}
      position={position}
      scale={scale}
      rotation={rotation}
    >
      <meshStandardMaterial color={color} roughness={0.55} />
    </mesh>
  );
}
function Face({ motion }: { motion: RefObject<AvatarMotion> }) {
  const expressions = useRef<(THREE.Group | null)[]>([]);
  useFrame(() => {
    const m = motion.current;
    const expression: AvatarExpression = m.falling
      ? "falling"
      : m.airborne
        ? "jumping"
        : "idle";
    m.expression = expression;
    ["idle", "jumping", "falling"].forEach((name, i) => {
      if (expressions.current[i])
        expressions.current[i]!.visible = name === expression;
    });
  });
  return (
    <group>
      {(["idle", "jumping", "falling"] as const).map((expression, index) => (
        <group
          key={expression}
          ref={(node) => {
            expressions.current[index] = node;
          }}
          visible={index === 0}
          name={`expression-${expression}`}
        >
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 0.135, 0.015, 0.352]}>
              {expression === "idle" ? (
                <Oval
                  position={[0, 0, 0.004]}
                  scale={[0.034, 0.062, 0.013]}
                  color={colors.ink}
                />
              ) : expression === "jumping" ? (
                <mesh geometry={squintGeometry}>
                  <meshStandardMaterial color={colors.ink} />
                </mesh>
              ) : (
                <group>
                  {crossGeometry.map((geometry, i) => (
                    <mesh key={i} geometry={geometry}>
                      <meshStandardMaterial color={colors.ink} />
                    </mesh>
                  ))}
                </group>
              )}
            </group>
          ))}
          <mesh
            geometry={smileGeometry}
            position={[0, -0.11, 0.36]}
            rotation={expression === "falling" ? [0, 0, Math.PI] : [0, 0, 0]}
          >
            <meshStandardMaterial color={colors.ink} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
function Hair() {
  return (
    <group name="layered-hair">
      <mesh geometry={hairMantleGeometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={colors.hair}
          roughness={0.6}
          clearcoat={0.05}
          clearcoatRoughness={0.6}
        />
      </mesh>
      <Oval
        position={[0, 0.215, -0.055]}
        scale={[0.44, 0.25, 0.28]}
        color={colors.hair}
      />
      {[-1, 1].map((side) => (
        <Oval
          key={side}
          position={[side * 0.325, 0.2, -0.035]}
          scale={[0.11, 0.205, 0.26]}
          color={colors.hair}
        />
      ))}
      {backLayers.map((geometry, i) => (
        <mesh key={`layer-${i}`} geometry={geometry} castShadow>
          <meshStandardMaterial
            color={i % 2 ? colors.hair : colors.hairLight}
            roughness={0.6}
          />
        </mesh>
      ))}
      {backHair.map((geometry, i) => (
        <mesh key={`back-${i}`} geometry={geometry} castShadow>
          <meshStandardMaterial
            color={i % 3 === 0 ? colors.hairLight : colors.hair}
            roughness={0.6}
          />
        </mesh>
      ))}
      {sideHair.map((geometry, i) => (
        <mesh key={`side-${i}`} geometry={geometry} castShadow>
          <meshStandardMaterial color={colors.hair} roughness={0.6} />
        </mesh>
      ))}
      {frontHair.map(({ geometry, side, layer }) => (
        <mesh key={`${side}-${layer}`} geometry={geometry} castShadow>
          <meshStandardMaterial
            color={layer === 1 ? colors.hairLight : colors.hair}
            roughness={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}
function Headphones() {
  return (
    <group name="star-headphones">
      <mesh geometry={headbandGeometry} castShadow>
        <meshStandardMaterial color="#ead6ff" roughness={0.55} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.465, 0.015, -0.04]}>
          <Box
            position={[0, 0.07, 0]}
            size={[0.055, 0.18, 0.065]}
            radius={0.025}
            color="#eee1fa"
          />
          <Oval
            position={[side * 0.015, -0.035, 0]}
            scale={[0.085, 0.18, 0.16]}
            color="#eddaff"
          />
          <Oval
            position={[side * 0.092, -0.035, 0]}
            scale={[0.03, 0.15, 0.135]}
            color={colors.hoodie}
          />
          <Star
            position={[side * 0.125, -0.035, 0]}
            rotation={[0, (side * Math.PI) / 2, 0]}
            scale={0.08}
            color={colors.white}
          />
        </group>
      ))}
    </group>
  );
}
function Backpack() {
  return (
    <group name="laptop-backpack">
      <Box
        position={[0, -0.16, -0.08]}
        size={[0.43, 0.43, 0.18]}
        color={colors.cream}
        radius={0.07}
      />
      <Box
        position={[0, -0.2, -0.179]}
        size={[0.34, 0.28, 0.035]}
        color="#f9ebdc"
        radius={0.045}
      />
      <Box
        position={[0, 0.045, -0.07]}
        size={[0.15, 0.055, 0.085]}
        color={colors.creamShade}
        radius={0.02}
      />
      <group position={[0, -0.18, -0.205]} rotation={[0, Math.PI, 0]}>
        <Box
          position={[0, 0, 0]}
          size={[0.2, 0.145, 0.016]}
          color={colors.hoodie}
          radius={0.012}
        />
        <group position={[0, 0, 0.014]}>
          <CodeMark scale={0.65} />
        </group>
        <Box
          position={[0, -0.085, 0.02]}
          size={[0.23, 0.025, 0.055]}
          color={colors.rib}
          radius={0.01}
        />
      </group>
    </group>
  );
}

/** Visual-only model. Feet are at y=0; physics stays in Player's capsule. */
export default function Avatar({
  motion,
}: {
  motion: RefObject<AvatarMotion>;
}) {
  const rig = useRef<THREE.Group>(null),
    head = useRef<THREE.Group>(null),
    hair = useRef<THREE.Group>(null),
    backpack = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null),
    rightArm = useRef<THREE.Group>(null),
    leftLeg = useRef<THREE.Group>(null),
    rightLeg = useRef<THREE.Group>(null);
  const wasAirborne = useRef(false),
    landing = useRef(0);
  useFrame(({ clock }, dt) => {
    const m = motion.current;
    if (wasAirborne.current && !m.airborne) landing.current = 1;
    wasAirborne.current = m.airborne;
    landing.current *= Math.exp(-dt * 12);
    const stride =
      m.moving && !m.airborne ? Math.sin(clock.elapsedTime * 11) * 0.38 : 0;
    const jump = m.airborne && !m.falling;
    const targets = [
      jump ? -0.55 : -stride,
      jump ? -0.55 : stride,
      jump ? -0.18 : stride,
      jump ? 0.23 : -stride,
    ];
    [
      leftArm.current,
      rightArm.current,
      leftLeg.current,
      rightLeg.current,
    ].forEach((joint, i) => {
      if (joint)
        joint.rotation.x = THREE.MathUtils.damp(
          joint.rotation.x,
          targets[i],
          14,
          dt,
        );
    });
    if (rig.current && !reducedMotion) {
      rig.current.position.y =
        (m.moving && !m.airborne
          ? Math.abs(Math.sin(clock.elapsedTime * 11)) * 0.018
          : Math.sin(clock.elapsedTime * 2) * 0.005) -
        landing.current * 0.035;
      rig.current.scale.set(
        1 + landing.current * 0.018,
        1 - landing.current * 0.04,
        1 + landing.current * 0.018,
      );
    }
    if (head.current)
      head.current.rotation.z = reducedMotion
        ? 0
        : THREE.MathUtils.damp(
            head.current.rotation.z,
            m.moving ? Math.sin(clock.elapsedTime * 5.5) * 0.015 : 0,
            8,
            dt,
          );
    if (hair.current)
      hair.current.rotation.x = THREE.MathUtils.damp(
        hair.current.rotation.x,
        reducedMotion ? 0 : m.moving ? 0.025 : 0,
        7,
        dt,
      );
    if (backpack.current)
      backpack.current.rotation.x = THREE.MathUtils.damp(
        backpack.current.rotation.x,
        reducedMotion
          ? 0
          : m.moving
            ? 0.06 + Math.sin(clock.elapsedTime * 11) * 0.015
            : 0,
        8,
        dt,
      );
  });
  return (
    <group name="personalized-avatar">
      <group ref={rig}>
        <group position={[0, -0.065, 0]}>
          {/* Oversized blocky hoodie with rounded hem, hood, pocket, code and cords. */}
          <Box
            position={[0, 0.965, 0]}
            size={[0.73, 0.59, 0.53]}
            color={colors.hoodie}
            radius={0.13}
          />
          <Box
            position={[0, 0.705, 0]}
            size={[0.74, 0.09, 0.54]}
            color={colors.rib}
            radius={0.03}
          />
          <Oval
            position={[0, 1.225, -0.1]}
            scale={[0.31, 0.155, 0.23]}
            color={colors.hoodie}
          />
          {[-1, 1].map((side) => (
            <group
              key={`hood-${side}`}
              position={[side * 0.14, 1.215, 0.18]}
              rotation={[0, 0, side * 0.42]}
            >
              <Box
                position={[0, 0, 0]}
                size={[0.29, 0.13, 0.17]}
                color="#c7abe6"
                radius={0.045}
              />
            </group>
          ))}
          <Box
            position={[0, 0.825, 0.3]}
            size={[0.43, 0.18, 0.085]}
            color="#c3a5e2"
            radius={0.045}
          />
          <group position={[0, 1.03, 0.271]}>
            <CodeMark scale={1.05} />
          </group>
          {[-1, 1].map((side) => (
            <group key={`cord-${side}`}>
              <Box
                position={[side * 0.12, 1.095, 0.285]}
                size={[0.018, 0.205, 0.018]}
                color={colors.white}
                radius={0.008}
              />
              <Box
                position={[side * 0.12, 0.99, 0.285]}
                size={[0.033, 0.032, 0.028]}
                color={colors.white}
                radius={0.01}
              />
              <group
                position={[side * 0.28, 1.02, 0.255]}
                rotation={[0, 0, -side * 0.12]}
              >
                <Box
                  position={[0, 0, 0]}
                  size={[0.065, 0.43, 0.035]}
                  color={colors.cream}
                  radius={0.025}
                />
              </group>
            </group>
          ))}
          <group ref={backpack} position={[0, 1.1, -0.3]}>
            <Backpack />
          </group>
          <Oval
            position={[0, 1.29, 0]}
            scale={[0.12, 0.1, 0.12]}
            color={colors.skin}
          />
          {/* Keep the compact head assembly anchored at the same neck contact. */}
          <group
            ref={head}
            position={[0, 1.551015, 0]}
            scale={[0.795631, 0.795631, 0.795631]}
          >
            <mesh geometry={roundedHeadGeometry} castShadow receiveShadow>
              <meshStandardMaterial color={colors.skin} roughness={0.66} />
            </mesh>
            <Face motion={motion} />
            <group
              ref={hair}
              position={[0, 0, -0.02]}
              scale={[0.9888, 1.03, 1.0506]}
            >
              <Hair />
            </group>
            <Headphones />
          </group>
          {[-1, 1].map((side) => (
            <group
              key={`arm-${side}`}
              ref={side === -1 ? leftArm : rightArm}
              position={[side * 0.4, 1.17, 0]}
              rotation={[0, 0, side * 0.15]}
            >
              <Box
                position={[side * 0.025, -0.19, 0]}
                size={[0.3, 0.42, 0.37]}
                color={colors.hoodie}
                radius={0.13}
              />
              <Box
                position={[side * 0.025, -0.365, 0]}
                size={[0.31, 0.085, 0.38]}
                color={colors.rib}
                radius={0.03}
              />
              <Box
                position={[side * 0.025, -0.46, 0.01]}
                size={[0.22, 0.14, 0.26]}
                color={colors.skin}
                radius={0.055}
              />
            </group>
          ))}
        </group>
        {/* Cargo legs and chunky sneaker soles remain separate animated joints. */}
        <Box
          position={[0, 0.59, 0]}
          size={[0.65, 0.13, 0.43]}
          color={colors.cream}
          radius={0.035}
        />
        {[-1, 1].map((side) => (
          <group
            key={`leg-${side}`}
            ref={side === -1 ? leftLeg : rightLeg}
            position={[side * 0.175, 0.595, 0]}
          >
            <Box
              position={[0, -0.1925, 0]}
              size={[0.33, 0.395, 0.42]}
              color={colors.cream}
              radius={0.065}
            />
            <Box
              position={[side * 0.175, -0.2, 0.015]}
              size={[0.085, 0.18, 0.28]}
              color={colors.creamShade}
              radius={0.02}
            />
            <Box
              position={[side * 0.175, -0.125, 0.02]}
              size={[0.095, 0.06, 0.29]}
              color={colors.cream}
              radius={0.016}
            />
            <Box
              position={[0, -0.365, 0]}
              size={[0.34, 0.065, 0.43]}
              color={colors.creamShade}
              radius={0.02}
            />
            <Box
              position={[0, -0.49, 0.06]}
              size={[0.35, 0.2, 0.49]}
              color={colors.white}
              radius={0.065}
            />
            <Box
              position={[0, -0.57, 0.06]}
              size={[0.36, 0.05, 0.5]}
              color="#e7dfeb"
              radius={0.017}
            />
            {[-0.025, 0.025, 0.075].map((z) => (
              <Box
                key={z}
                position={[0, -0.385, z + 0.055]}
                size={[0.15, 0.012, 0.018]}
                color="#d9d0dd"
                radius={0.004}
              />
            ))}
          </group>
        ))}
      </group>
    </group>
  );
}
