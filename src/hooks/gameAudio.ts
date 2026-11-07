type Cue = "jump" | "land" | "checkpoint" | "interact" | "launch";
let context: AudioContext | null = null;
let enabled = false;
export function audioPreference() {
  try {
    return localStorage.getItem("tech-journey-sound") === "on";
  } catch {
    return false;
  }
}
export async function enableAudio(value: boolean) {
  enabled = value;
  try {
    localStorage.setItem("tech-journey-sound", value ? "on" : "off");
  } catch {}
  if (value) {
    try {
      context ??= new AudioContext();
      await context.resume();
    } catch {
      enabled = false;
    }
  }
}
export function playCue(cue: Cue) {
  if (!enabled || !context || context.state !== "running") return;
  const notes: Record<Cue, [number, number, number]> = {
    jump: [340, 620, 0.12],
    land: [140, 90, 0.08],
    checkpoint: [520, 880, 0.27],
    interact: [420, 540, 0.09],
    launch: [130, 430, 0.8],
  };
  const [start, end, duration] = notes[cue],
    time = context.currentTime;
  const oscillator = context.createOscillator(),
    gain = context.createGain();
  oscillator.type = cue === "launch" ? "triangle" : "sine";
  oscillator.frequency.setValueAtTime(start, time);
  oscillator.frequency.exponentialRampToValueAtTime(end, time + duration);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(
    cue === "land" ? 0.018 : 0.035,
    time + 0.012,
  );
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(time);
  oscillator.stop(time + duration + 0.02);
  oscillator.onended = () => {
    oscillator.disconnect();
    gain.disconnect();
  };
}
