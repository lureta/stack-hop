import { BackgroundToy, backgroundToyState, toyClick } from "./BackgroundToy";
import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Block, Cylinder, Label, playerAnchor, reducedMotion, type V3 } from "./shared";
const lilac = "#b39bcd", pale = "#eadff0", pink = "#dcb7d0", mint = "#b5d7ca", ink = "#9278ab";
function Keyboard({ position }: { position: V3 }) {
  const [pressed, setPressed] = useState(-1);
  useEffect(() => { if (pressed < 0) return; const timer = setTimeout(() => setPressed(-1), 300); return () => clearTimeout(timer); }, [pressed]);
  return <group position={position} rotation={[.1, -.3, -.08]}>
    <Block size={[10, 1.2, 7]} color={ink} radius={.5} />
    <Block position={[0, .65, 0]} size={[9.6, .2, 6.6]} color={pale} radius={.35} />
    {[0, 1, 2, 3].flatMap((row) => Array.from({ length: 7 }, (_, col) => <group key={`${row}-${col}`} onClick={toyClick(() => { setPressed(row * 7 + col); backgroundToyState.set("keyboard", String(row * 7 + col)); })}>
      <Block position={[(col - 3) * 1.25, pressed === row * 7 + col ? .8 : .95, (row - 1.5) * 1.25]} size={[1.05, .45, 1.05]} color={pressed === row * 7 + col ? mint : row === 0 ? pink : col % 3 ? pale : lilac} radius={.15} />
    </group>))}
    <Block position={[0, 1, 2.8]} size={[4.8, .4, .65]} color={mint} radius={.12} />
  </group>;
}
function Files({ position }: { position: V3 }) {
  const [opened, setOpened] = useState(true), cover = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (cover.current) cover.current.rotation.x = THREE.MathUtils.damp(cover.current.rotation.x, opened ? .8 : .05, 7, Math.min(dt, .1)); });
  return <group position={position} rotation={[0, .25, 0]} onClick={toyClick(() => { setOpened(!opened); backgroundToyState.set("folder", String(!opened)); })}>
    <Block position={[0, 2.8, 0]} size={[7, 5.6, 2.4]} color="#dfc38d" radius={.35} />
    <Block position={[-2, 5.65, 0]} size={[2.5, .45, 2]} color="#dfc38d" radius={.18} />
    {[0, 1, 2, 3].map((i) => <group key={i} position={[(i - 1.5) * .13, 3.1 + i * .23, 1.2 + i * .18]} rotation={[.08 * i, 0, -.03 * i]}>
      <Block size={[5.9, 4.2, .12]} color={i % 2 ? "#fff3e6" : pale} radius={.12} />
      <Label position={[0, 1.2, .085]} size={.3} color="#776658">{["DESIGN NOTES", "COMPONENTS", "STYLE GUIDE", "BUILD CHECKLIST"][i]}</Label>
      <Label position={[0, -.1, .085]} size={.24} color="#887768">{[
        "Start with a sketch.\nMake every click feel clear.\nTest, learn, and refine.",
        "<header />\n<main>Hello, world!</main>\n<footer />",
        "Soft colors.\nRounded corners.\nRoom to breathe.",
        "✓ Build the layout\n✓ Add interactions\n✓ Test the experience",
      ][i]}</Label>
    </group>)}
    <group ref={cover} rotation={[.8, 0, 0]} position={[0, .25, 2]}><Block position={[0, 2, 0]} size={[7, 4, .2]} color="#ecd29f" radius={.25} /></group>
  </group>;
}
function Face({ width, height, color = pale }: { width: number; height: number; color?: string }) {
  return <Block size={[width, height, .32]} color={color} radius={Math.min(.35, height / 3)} />;
}
function Search() {
  const [run, setRun] = useState(0), [query, setQuery] = useState("Search...");
  useEffect(() => {
    if (!run) return;
    const text = run % 2 ? "Hello, Lily!" : "React + people";
    let length = 0;
    setQuery("");
    const timer = setInterval(() => { length++; setQuery(text.slice(0, length)); backgroundToyState.set("search", text.slice(0, length)); if (length >= text.length) clearInterval(timer); }, 65);
    return () => clearInterval(timer);
  }, [run]);
  const caret = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (caret.current) caret.current.visible = reducedMotion || Math.sin(clock.elapsedTime * 3) > -.2; });
  return <group onClick={toyClick(() => setRun(run + 1))}>
    <Face width={8} height={1.6} />
    <mesh position={[-2.9, .12, .22]}><torusGeometry args={[.32, .07, 6, 20]} /><meshStandardMaterial color={ink} /></mesh>
    <group position={[-2.62, -.2, .22]} rotation={[0, 0, -.7]}><Block size={[.13, .45, .1]} color={ink} /></group>
    <Label position={[-.5, 0, .21]} size={.4} color={ink}>{query}</Label>
    <group ref={caret}><Block position={[Math.min(1.8, -.5 + query.length * .1), 0, .23]} size={[.055, .6, .08]} color={ink} /></group>
    <Block position={[3, 0, .25]} size={[1, .95, .18]} color={mint} radius={.2} />
    <Label position={[3, 0, .36]} size={.5} color={ink}>↵</Label>
  </group>;
}
function Dropdown() {
  const [selected, setSelected] = useState(1), [opened, setOpened] = useState(true);
  return <>
    <group position={[0, opened ? 0 : 1.75, 0]}><Face width={6} height={opened ? 4.9 : 1.4} /></group>
    <group onClick={toyClick(() => { setOpened(!opened); backgroundToyState.set("theme-open", String(!opened)); })}><Block position={[0, 1.75, .22]} size={[5.5, .95, .14]} color={lilac} radius={.18} />
    <Label position={[-.5, 1.75, .32]} size={.33}>{["Rose", "Mint", "Lavender"][selected]}</Label>
    <Label position={[2.25, 1.75, .33]} size={.45}>{opened ? "⌃" : "⌄"}</Label></group>
    {opened && [0, 1, 2].map((i) => <group onClick={toyClick(() => { setSelected(i); backgroundToyState.set("theme", String(i)); })} key={i} position={[0, .65 - i * 1.05, .2]}>
      <Block size={[5.5, .85, .08]} color={i === selected ? mint : "#fff4ec"} radius={.12} />
      <mesh position={[-2.05, 0, .09]}><circleGeometry args={[.18, 16]} /><meshStandardMaterial color={[pink, mint, lilac][i]} /></mesh>
      <Label position={[-.35, 0, .09]} size={.29}>{["Rose", "Mint", "Lavender"][i]}</Label>
      {i === selected && <Label position={[2.1, 0, .09]} size={.4}>✓</Label>}
    </group>)}
  </>;
}
function Sliders() {
  const [values, setValues] = useState([-1.5, .3, 1.5]);
  useEffect(() => { backgroundToyState.set("sliders", JSON.stringify(values)); }, [values]);
  const thumbs = useRef<THREE.Group>(null), fills = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (thumbs.current) thumbs.current.children.forEach((child, i) => {
      const x = reducedMotion ? values[i] : THREE.MathUtils.damp(child.position.x, values[i], 10, Math.min(dt, .1));
      child.position.x = x;
      const fill = fills.current?.children[i];
      if (fill) { fill.scale.x = x + 2.9; fill.position.x = (x - 2.9) / 2; }
    });
  });
  return <>
    <Face width={7.5} height={4.6} />
    <Label position={[-1.6, 1.65, .22]} size={.3}>Appearance</Label>
    {[-1, 0, 1].map((i) => <group key={i} position={[0, i * 1.05 - .2, .23]} onClick={(event) => {
      event.stopPropagation(); const x = event.eventObject.worldToLocal(event.point.clone()).x;
      setValues((old) => old.map((value, index) => index === i + 1 ? THREE.MathUtils.clamp(x, -2.8, 2.8) : value));
    }}>
      <mesh><boxGeometry args={[5.8, .65, .13]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>
      <Block size={[5.8, .17, .09]} color={ink} radius={.06} />
    </group>)}
    <group ref={fills}>{[-1, 0, 1].map((i) => <group key={i} position={[0, i * 1.05 - .2, .29]}><Block size={[1, .17, .07]} color={i ? pink : mint} radius={.03} /></group>)}</group>
    <group ref={thumbs}>{[-1, 0, 1].map((i) => <mesh key={i} position={[0, i * 1.05 - .2, .38]} rotation={[Math.PI / 2, 0, 0]} onClick={toyClick(() => setValues((old) => old.map((value, index) => index === i + 1 ? value > 1.8 ? -2.5 : value + 1 : value)))}><cylinderGeometry args={[.28, .28, .18, 24]} /><meshStandardMaterial color={i ? pink : mint} /></mesh>)}</group>
  </>;
}
function Toast({ success = true }: { success?: boolean }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return <group onClick={toyClick(() => { setDismissed(false); backgroundToyState.set("toast", "visible"); })}><Face width={3} height={.9} /><Label position={[0, 0, .2]} size={.23}>Show notice ↺</Label></group>;
  return <>
    <Face width={7.4} height={1.8} color={success ? "#d4e9dc" : "#f0dce8"} />
    <mesh position={[-2.7, 0, .22]}><circleGeometry args={[.45, 20]} /><meshStandardMaterial color={success ? mint : pink} /></mesh>
    <Label position={[-2.7, 0, .25]} size={.5}>{success ? "✓" : "♥"}</Label>
    <Label position={[-.05, .15, .22]} size={.31}>{success ? "Changes saved" : "New notification"}</Label>
    <Block position={[-.3, -.43, .22]} size={[2.9, .1, .07]} color={success ? mint : pink} radius={.02} />
    <group onClick={toyClick(() => { setDismissed(true); backgroundToyState.set("toast", "dismissed"); })}><mesh position={[2.9, .05, .24]}><boxGeometry args={[.8, .9, .12]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh><Label position={[2.9, .05, .22]} size={.36}>×</Label></group>
  </>;
}
function ColorSwatches() {
  const [selected, setSelected] = useState(2);
  return <>
    <Face width={6.7} height={4.5} />
    <Label position={[-1.2, 1.5, .22]} size={.34}>Color palette</Label>
    {[pink, mint, lilac, "#ebce95", "#a7c9dd", "#dca6b0", "#b2b5db", "#e7d3be"].map((color, i) => <group onClick={toyClick(() => { setSelected(i); backgroundToyState.set("swatch", color); })} key={color} position={[(i % 4 - 1.5) * 1.4, .4 - Math.floor(i / 4) * 1.5, .24]}>
      <Block size={[1.12, 1.12, .18]} color={color} radius={.2} />
      {i === selected && <Label position={[0, 0, .13]} size={.45} color="#fff8f0">✓</Label>}
    </group>)}
  </>;
}
function Profile() {
  const [following, setFollowing] = useState(false);
  return <>
    <Face width={6.4} height={6} />
    <Block position={[0, 1.4, .22]} size={[5.8, 2.5, .15]} color={lilac} radius={.25} />
    <mesh position={[-1.7, .5, .37]}><circleGeometry args={[.65, 24]} /><meshStandardMaterial color={mint} /></mesh>
    <mesh position={[-1.7, .67, .4]}><circleGeometry args={[.2, 16]} /><meshStandardMaterial color={pale} /></mesh>
    <Block position={[-1.7, .22, .4]} size={[.6, .4, .09]} color={pale} radius={.15} />
    <Block position={[.5, -.25, .24]} size={[2.6, .18, .07]} color={ink} radius={.04} />
    <Block position={[.2, -.8, .24]} size={[2, .12, .07]} color={pink} radius={.03} />
    <group onClick={toyClick(() => { setFollowing(!following); backgroundToyState.set("profile", following ? "unfollowed" : "following"); })}><Block position={[0, -2, .25]} size={[5, .8, .18]} color={following ? lilac : mint} radius={.18} />
    <Label position={[0, -2, .37]} size={.32}>{following ? "Following ✓" : "Follow +"}</Label></group>
  </>;
}
function Calendar() {
  const [selected, setSelected] = useState(5);
  return <>
    <Face width={6.8} height={6.4} />
    <Block position={[0, 2.45, .24]} size={[6.3, .9, .14]} color={pink} radius={.16} />
    <Label position={[0, 2.45, .34]} size={.35}>November</Label>
    {Array.from({ length: 21 }, (_, i) => <group onClick={toyClick(() => { setSelected(i); backgroundToyState.set("calendar", String(i + 1)); })} key={i} position={[(i % 7 - 3) * .8, 1.2 - Math.floor(i / 7) * 1.2, .24]}>
      <mesh><boxGeometry args={[.72, .95, .1]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>
      {i === selected && <Block size={[.68, .8, .1]} color={mint} radius={.15} />}
      <Label position={[0, 0, .08]} size={.24}>{i + 1}</Label>
    </group>)}
    {[-1, 1].map((side) => <Block key={side} position={[side * 2, 3.2, .05]} size={[.25, .65, .5]} color={ink} radius={.1} />)}
  </>;
}
/** Recognizable UI widgets form the scenery, with clear space around the actual obby. */
export function FrontendBackdrop() {
  const root = useRef<THREE.Group>(null);
  useFrame(({ gl }) => { if (root.current) root.current.visible = playerAnchor.z > -205; gl.domElement.dataset.toys = JSON.stringify(Object.fromEntries(backgroundToyState)); });
  return <group ref={root}>
    <BackgroundToy><Keyboard position={[-15, 1, -24]} /></BackgroundToy>
    <BackgroundToy><Files position={[-16, 22, -132]} /></BackgroundToy>
    <BackgroundToy><group position={[14, 5, -17]} rotation={[0, -.2, 0]}><Search /><group position={[0, -2.5, -.3]}><Toast /></group></group></BackgroundToy>
    <BackgroundToy><group position={[15, 7, -37]} rotation={[0, -.25, -.05]}><Dropdown /></group></BackgroundToy>
    <BackgroundToy><group position={[-15, 9, -57]} rotation={[0, .25, 0]}><Profile /></group></BackgroundToy>
    <BackgroundToy><group position={[15, 14, -75]} rotation={[0, -.2, .04]}><Sliders /><group position={[0, -3.6, -.2]}><Toast success={false} /></group></group></BackgroundToy>
    <BackgroundToy><group position={[-15, 19, -96]} rotation={[0, .25, 0]}><ColorSwatches /><group position={[0, -3.7, -.4]}><Search /></group></group></BackgroundToy>
    <BackgroundToy><group position={[15, 25, -121]} rotation={[0, -.25, 0]}><Calendar /></group></BackgroundToy>
    <BackgroundToy><group position={[15, 30, -151]} rotation={[0, -.2, -.04]}><Profile /><group position={[0, 4.4, -.2]}><Toast /></group></group></BackgroundToy>
  </group>;
}
