export interface Showcase {
  id: string;
  title: string;
  description: string;
  image: string;
  technologies: string[];
  technicalDetails: string;
  challenges: string;
  githubUrl: string;
  liveUrl: string;
  videoUrl?: string;
  status?: "In progress";
}
export const showcases: Showcase[] = [
  {
    id: "cram-cam",
    title: "Cram-Cam",
    image: "",
    description:
      "A gamified study platform that combines webcam-based focus detection with a Chrome extension to help students stay on task. Focused study earns XP, with live feedback and daily and weekly progress tracking.",
    technologies: ["React", "Python", "FastAPI", "OpenCV", "Chrome Extension"],
    technicalDetails:
      "A React frontend sends webcam snapshots to a FastAPI backend for OpenCV presence analysis. A JavaScript Chrome extension reports distracting tabs, while the app coordinates study timers, pause state, XP, and unlockable webcam accessories.",
    challenges:
      "Coordinating webcam detection, manual pauses, and extension events without conflicting state updates. The project also tackles cross-origin communication and keeping the timer, rewards, and dashboard synchronized.",
    githubUrl: "https://github.com/sidblwl/Cram-Cam",
    liveUrl: "",
  },
  {
    id: "studyday",
    title: "timeEntriesForStudying",
    image: "",
    description:
      "Studyday brings workplace-style timesheets to student life. Plan study sessions, log completed hours, compare planned versus actual study time, and track goals in a customizable weekly workspace.",
    technologies: [
      "React",
      "TypeScript",
      "Supabase",
      "PostgreSQL",
      "Google Calendar API",
    ],
    technicalDetails:
      "A React and TypeScript app backed by Supabase Auth and PostgreSQL, with account-scoped Row Level Security. Optional Google Calendar OAuth connects existing commitments; recurring sessions, goals, preferences, and analytics are synchronized across devices.",
    challenges:
      "Keeping planned and submitted study hours distinct while synchronizing data and preferences. Recurring schedules handle duplicate prevention, independent occurrence edits, and daylight-saving boundaries.",
    githubUrl: "https://github.com/lureta/timeEntriesForStudying",
    liveUrl: "https://lureta.github.io/timeEntriesForStudying/",
  },
  {
    id: "capital-one-demo",
    title: "Capital One Banking Demo",
    image: "",
    description:
      "A personal banking demo with Cognito sign-in, account creation, balance checks, deposits, and withdrawals. A React interface connects account actions to AWS API Gateway.",
    technologies: ["React", "JavaScript", "Amazon Cognito", "AWS API Gateway", "OpenID Connect"],
    technicalDetails:
      "The React client uses OpenID Connect for Cognito authentication and sends bearer-authenticated requests to account, deposit, and withdrawal endpoints. Amounts are validated and sent as integer cents, each transaction receives a UUID, and successful actions refresh the account balance. The repository includes the frontend and a Python database dependency layer; backend handlers and infrastructure provisioning are separate.",
    challenges:
      "Coordinating sign-in with account loading, distinguishing a missing account from a request failure, and keeping the displayed balance current after transactions. The UI guards against stale responses after authentication changes and disables submission while a request is pending.",
    githubUrl: "https://github.com/lureta/capital-one-demo",
    liveUrl: "",
  },
];
