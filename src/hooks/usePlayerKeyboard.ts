import { useEffect, useRef } from "react";

const keyAliases: Record<string, string> = {
  w: "KeyW", a: "KeyA", s: "KeyS", d: "KeyD",
  ArrowUp: "ArrowUp", ArrowDown: "ArrowDown",
  ArrowLeft: "ArrowLeft", ArrowRight: "ArrowRight",
  " ": "Space", Spacebar: "Space",
};
const movementCodes = new Set(Object.values(keyAliases));

// Some keyboard layouts and browser-generated events omit the physical code.
function movementCode(event: KeyboardEvent) {
  if (movementCodes.has(event.code)) return event.code;
  return keyAliases[event.key] ?? keyAliases[event.key.toLowerCase()];
}

export function usePlayerKeyboard(enabled: boolean, canvas: HTMLCanvasElement) {
  const keys = useRef(new Set<string>());
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    keys.current.clear();
    if (enabled) canvas.focus({ preventScroll: true });
  }, [enabled, canvas]);

  useEffect(() => {
    canvas.tabIndex = 0;
    canvas.setAttribute("aria-label", "Playable world. Use WASD or arrow keys to move, Space to jump, and E to interact.");
    const reset = () => keys.current.clear();
    const down = (event: KeyboardEvent) => {
      const target = event.target;
      if (!enabledRef.current || event.metaKey || event.ctrlKey || event.altKey ||
          (target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable="true"]'))) return;
      const code = movementCode(event);
      if (!code) return;
      event.preventDefault();
      keys.current.add(code);
    };
    const up = (event: KeyboardEvent) => {
      const code = movementCode(event);
      if (code) keys.current.delete(code);
    };
    const focus = () => { if (enabledRef.current) canvas.focus({ preventScroll: true }); };
    const visibility = () => { if (document.hidden) reset(); };
    window.addEventListener("keydown", down, true);
    window.addEventListener("keyup", up, true);
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", visibility);
    canvas.addEventListener("pointerdown", focus);
    focus();
    return () => {
      reset();
      window.removeEventListener("keydown", down, true);
      window.removeEventListener("keyup", up, true);
      window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", visibility);
      canvas.removeEventListener("pointerdown", focus);
    };
  }, [canvas]);
  return keys;
}
