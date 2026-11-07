import { useThree, type ThreeEvent } from "@react-three/fiber";
import type { ReactNode } from "react";
import { playCue } from "../../hooks/gameAudio";
export const backgroundToyState = new Map<string, string>();
export function toyClick(action: () => void) {
  return (event: ThreeEvent<MouseEvent>) => { event.stopPropagation(); action(); playCue("interact"); };
}
/** Background widgets remain clickable; journey stories are now physical signs. */
export function BackgroundToy({ children }: { children: ReactNode }) {
  const { gl } = useThree();
  return <group onPointerOver={(event) => { event.stopPropagation(); gl.domElement.style.cursor = "pointer"; }}
    onPointerOut={() => { gl.domElement.style.cursor = ""; }}>
    {children}
  </group>;
}
