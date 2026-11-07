import { portfolio } from "./portfolio";

const experience = (company: string) => portfolio.experience.find((item) => item.company === company)!;
/** Personal chapters use the existing resume facts; no invented origin story or project outcomes. */
export const journeyChapters = [
  {
    title: "From teaching code to creating interfaces",
    connection: "The Creative Workshop connects to the interfaces I’ve built—and to teaching others how to create their own.",
    thought: "My studies combine Computer Science and Human Development, alongside a minor in Business.",
    moments: [
      { ...experience("Coding With Kids"), detail: "I taught 40+ students through 100+ lessons, including Unity and Roblox Studio. Those tools connect directly to this portfolio’s obby format." },
      { ...experience("Omal Solutions"), detail: "I turned 15+ Figma prototypes into responsive React and React Native applications, translating design ideas into interfaces people could use." },
    ],
    skills: ["React", "React Native", "Figma", "Teaching"],
  },
  {
    title: "Connecting the pieces behind the interface",
    connection: "The request pipelines, authentication gate, and services reflect the backend work behind my projects and internships.",
    thought: "My work spans the interface, the API, and the events that need to stay in sync between them.",
    moments: [
      { ...experience("Omal Solutions"), detail: "Alongside the interfaces, I integrated FastAPI and PostgreSQL, secure authentication, and real-time WebSocket chat within an 11-engineer team." },
      { ...experience("Oracle"), detail: "I built TAM SR Insight, a full-stack AI application that analyzes service-request histories and generates evidence-backed next actions and customer responses." },
    ],
    skills: ["Python", "FastAPI", "Authentication", "WebSockets"],
  },
  {
    title: "Turning stored information into something useful",
    connection: "The Data Vault connects the study records in Studyday with the data-layer work I contributed at Oracle.",
    thought: "My projects use data to support everyday decisions, from tracking study time to finding evidence in service-request histories.",
    moments: [
      { company: "timeEntriesForStudying", role: "Personal project · Studyday", detail: "I built a React and TypeScript study-planning workspace backed by Supabase Auth and PostgreSQL, with account-scoped Row Level Security and planned-versus-actual study tracking." },
      { ...experience("Oracle"), detail: "I contributed backend and data-layer work to a multimodal enterprise RAG platform using Python, FastAPI, and Oracle Autonomous Database." },
    ],
    skills: ["PostgreSQL", "Supabase", "Oracle Database", "RAG"],
  },
  {
    title: "Working with the systems behind the software",
    connection: "The Cloud world connects my UMIACS infrastructure experience with the AWS services behind my Capital One Banking Demo.",
    thought: "My experience includes the systems that applications depend on, as well as the applications themselves.",
    moments: [
      { ...experience("UMIACS"), detail: "I supported 1,200+ devices and 80+ faculty across a 6,000+ port network spanning Linux, Windows, and macOS." },
      { company: "Capital One Banking Demo", role: "Personal project · React & AWS", detail: "I connected a React banking interface to Amazon Cognito authentication and AWS API Gateway for account creation, balance checks, deposits, and withdrawals." },
    ],
    skills: ["Cloud deployments", "Linux", "Networking", "Server provisioning"],
  },
  {
    title: "Continuing to build, learn, and explore",
    connection: "Liftoff is a milestone in the game. My work in technology is still developing.",
    thought: "I’m interested in full-stack engineering, AI and robotics, and making technology useful and approachable.",
    moments: [
      { ...experience("Co-Learn Code & Mind"), detail: "I develop robotics-based curricula with micro:bit, VEX robots, and machine learning to study collaboration and problem-solving in STEM, collaborating with UC Berkeley researchers." },
      { company: "University of Maryland", role: "Computer Science & Human Development · Expected May 2027", detail: "I’m pursuing a dual degree with a Business minor. My projects connect interactive interfaces, backend services, and cloud integrations." },
    ],
    skills: ["AI & robotics", "Human-centered design", "Research", "Full-stack engineering"],
  },
];
