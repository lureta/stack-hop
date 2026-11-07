import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

/** Manual orbit shares the existing follow camera, rather than competing with it. */
export function useDragView(
  canvas: HTMLCanvasElement,
  enabled: boolean,
  camera: THREE.Camera,
  focus: RefObject<THREE.Vector3>,
) {
  const orbit = useRef({ active: false, yaw: 0, pitch: 0.4, radius: 13 });
  const targetRadius = useRef(13);
  useFrame((_, dt) => {
    if (orbit.current.active)
      orbit.current.radius = THREE.MathUtils.damp(orbit.current.radius, targetRadius.current, 14, Math.min(dt, .1));
  });
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    started: boolean;
  } | null>(null);
  useEffect(() => {
    const stop = () => {
      if (drag.current && canvas.hasPointerCapture(drag.current.id))
        canvas.releasePointerCapture(drag.current.id);
      drag.current = null;
      canvas.style.cursor = "";
    };
    const initialize = () => {
      if (orbit.current.active) return;
      const offset = camera.position.clone().sub(focus.current);
      orbit.current.radius = THREE.MathUtils.clamp(offset.length(), 8, 22);
      targetRadius.current = orbit.current.radius;
      orbit.current.yaw = Math.atan2(offset.x, offset.z);
      orbit.current.pitch = Math.asin(
        THREE.MathUtils.clamp(
          offset.y / Math.max(offset.length(), 0.001),
          -1,
          1,
        ),
      );
      orbit.current.active = true;
    };
    const down = (e: PointerEvent) => {
      if (
        !enabledRef.current ||
        !!canvas.dataset.widgetDrag ||
        (e.button !== 0 && e.button !== 2) ||
        !e.isPrimary
      )
        return;
      drag.current = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        started: false,
      };
    };
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d || e.pointerId !== d.id) return;
      if (!enabledRef.current || canvas.dataset.widgetDrag) {
        stop();
        return;
      }
      const dx = e.clientX - d.x,
        dy = e.clientY - d.y;
      if (!d.started) {
        if (Math.hypot(dx, dy) < 4) return;
        d.started = true;
        initialize();
        canvas.setPointerCapture(e.pointerId);
        canvas.style.cursor = "grabbing";
      }
      orbit.current.yaw -= dx * 0.0045;
      orbit.current.pitch = THREE.MathUtils.clamp(
        orbit.current.pitch + dy * 0.004,
        0.12,
        1.35,
      );
      d.x = e.clientX;
      d.y = e.clientY;
      e.preventDefault();
    };
    const zoom = (e: WheelEvent) => {
      if (!enabledRef.current) return;
      e.preventDefault();
      initialize();
      const delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? canvas.clientHeight : 1);
      // Trackpad pinch gestures arrive as small wheel deltas with Ctrl set.
      const sensitivity = e.ctrlKey ? 0.08 : 0.016;
      targetRadius.current = THREE.MathUtils.clamp(
        targetRadius.current + THREE.MathUtils.clamp(delta, -200, 200) * sensitivity,
        8,
        22,
      );
    };
    const context = (e: MouseEvent) => {
      e.preventDefault();
    };
    canvas.addEventListener("wheel", zoom, { passive: false });
    canvas.addEventListener("contextmenu", context);
    canvas.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    window.addEventListener("blur", stop);
    return () => {
      stop();
      canvas.removeEventListener("wheel", zoom);
      canvas.removeEventListener("contextmenu", context);
      canvas.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
      window.removeEventListener("blur", stop);
    };
  }, [canvas, camera, focus]);
  return orbit;
}
