/** Park beside the course, enter, block, then reverse along the same path. */
export function popupOffset(elapsed: number) {
  const phase = ((elapsed % 10) + 10) % 10;
  const ease = (t: number) => t * t * (3 - 2 * t);
  if (phase < 4) return 5;
  if (phase < 5) return 5 * (1 - ease(phase - 4));
  if (phase < 7) return 0;
  if (phase < 8) return 5 * ease(phase - 7);
  return 5;
}

/** Open before the player touches the lift; ignore distant floors above/below it. */
export function isNearDropdown(player: { x: number; y: number; z: number }, menu: { x: number; y: number; z: number }) {
  return Math.hypot(player.x - menu.x, player.z - menu.z) < 9 &&
    player.y > menu.y - 4 && player.y < menu.y + 8;
}

/** Repeating dropdown ride: board at the bottom, retract, exit at the top, drop again. */
export function dropdownRide(elapsed: number) {
  const phase = ((elapsed % 10) + 10) % 10;
  const smooth = (x: number) => x * x * (3 - 2 * x);
  if (phase < 2) return 0;
  if (phase < 5) return 4.2 * smooth((phase - 2) / 3);
  if (phase < 7) return 4.2;
  return 4.2 * (1 - smooth((phase - 7) / 3));
}
