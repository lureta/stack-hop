/** Two gentle opacity pulses, then a complete fade at the existing collision deadline. */
export function warningOpacity(elapsed: number, duration: number, reducedMotion = false) {
  const progress = Math.max(0, Math.min(1, elapsed / duration));
  const pulseEnd = .72;
  if (progress < pulseEnd) {
    if (reducedMotion) return 1;
    return 1 - .5 * Math.sin(progress / pulseEnd * Math.PI * 2) ** 2;
  }
  const fade = (progress - pulseEnd) / (1 - pulseEnd);
  return 1 - fade * fade * (3 - 2 * fade);
}
export function platformOpacity(motion: string, elapsed: number, reducedMotion = false) {
  if (motion === "disappear") {
    if (elapsed < 1.25) return warningOpacity(elapsed, 1.25, reducedMotion);
    if (elapsed <= 3.8) return 0;
    return Math.min(1, (elapsed - 3.8) / .35);
  }
  if (motion === "packet") {
    const phase = elapsed % 6.8;
    if (phase < 1.2) return 0;
    if (phase < 1.55) return (phase - 1.2) / .35;
    if (phase > 5.7) return warningOpacity(phase - 5.7, 1.1, reducedMotion);
  }
  return 1;
}
