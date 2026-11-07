export const levels = [
  {
    name: "Frontend",
    theme: "Creative Workshop",
    label: "About me",
    icon: "⌘",
    color: "#bd98ef",
    accent: "#f0b9d7",
    y: 0,
    z: 0,
  },
  {
    name: "Backend",
    theme: "API Network",
    label: "Cram-Cam",
    icon: "⌁",
    color: "#76bcea",
    accent: "#9cdff0",
    y: 33.1,
    z: -182,
  },
  {
    name: "Database",
    theme: "Data Vault",
    label: "Studyday",
    icon: "▤",
    color: "#6fcdb7",
    accent: "#b7efcf",
    y: 50.1,
    z: -290,
  },
  {
    name: "Cloud",
    theme: "Deployment Sky",
    label: "Capital One Banking Demo",
    icon: "☁",
    color: "#8cbce9",
    accent: "#f3c4af",
    y: 67.1,
    z: -398,
  },
  {
    name: "Production",
    theme: "Ready for liftoff",
    label: "Rocket launch",
    icon: "✦",
    color: "#a493e0",
    accent: "#f2ce77",
    y: 84.1,
    z: -506,
  },
];
export const SAVE_KEY = "tech-journey-checkpoint-v1";
export function readCheckpoint() {
  try {
    const n = Number(localStorage.getItem(SAVE_KEY));
    return Number.isInteger(n) && n >= 0 && n < 5 ? n : 0;
  } catch {
    return 0;
  }
}
export function saveCheckpoint(n: number) {
  try {
    localStorage.setItem(SAVE_KEY, String(n));
  } catch {
    /* private browsing */
  }
}
