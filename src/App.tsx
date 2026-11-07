import { storyStops, storyReads, STORY_BASE } from "./data/storyStops";
import { journeySigns } from "./data/journeySigns";
import { StoryDetail } from "./components/StoryDetail";
import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import StackLogo from "./components/StackLogo";
import { AnimatePresence, motion } from "framer-motion";
import { audioPreference, enableAudio, playCue } from "./hooks/gameAudio";
import {
  levels,
  readCheckpoint,
  SAVE_KEY,
  saveCheckpoint,
} from "./data/levels";
import { portfolio as p } from "./data/portfolio";
import { showcases } from "./data/showcases";
import {
  AboutDetails,
  ConfigLink,
  Portfolio,
  ProjectDetails,
} from "./components/Portfolio";
const Game = lazy(() => import("./components/Game"));
type Menu =
  "teleport" | "help" | "settings" | "resume" | "complete" | number | null;
class WebGLBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
export default function App() {
  const [stage, setStage] = useState(readCheckpoint);
  const [sound, setSound] = useState(audioPreference);
  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    void enableAudio(next);
  };
  useEffect(() => {
    const unlock = () => {
      if (audioPreference()) void enableAudio(true);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);
  const [teleport, setTeleport] = useState(0);
  const [mode, setMode] = useState<"game" | "portfolio">(() =>
    window.innerWidth < 760 ? "portfolio" : "game",
  );
  const [menu, setMenu] = useState<Menu>(null);
  const [near, setNear] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    setReady(false);
  }, [mode]);
  const [launch, setLaunch] = useState(0);
  const [count, setCount] = useState(3);
  const notification = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modal = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const touched = useRef(new Set<number>());
  const notify = useCallback((s: string) => {
    setNotice(s);
    if (notification.current) clearTimeout(notification.current);
    notification.current = setTimeout(() => setNotice(""), 2800);
  }, []);
  const checkpoint = useCallback(
    (n: number) => {
      setStage(n);
      saveCheckpoint(n);
      if (!touched.current.has(n)) {
        touched.current.add(n);
        notify(
          `Checkpoint Saved! · ${["UI Rendered!", "API Connected!", "Data Saved!", "Build Deployed!", "Successfully Shipped!"][n]}`,
        );
      }
    },
    [notify],
  );
  const go = (n: number) => {
    touched.current.add(n);
    setStage(n);
    saveCheckpoint(n);
    setTeleport((v) => v + 1);
    setMenu(null);
    setNear(null);
    setLaunch(0);
    notify(`${levels[n].name} · you’re here`);
  };
  const restart = () => {
    touched.current.clear();
    touched.current.add(0);
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {}
    setStage(0);
    setTeleport((v) => v + 1);
    setLaunch(0);
    setMenu(null);
    setNear(null);
    notify("A fresh start. Let’s build something!");
  };
  const interact = () => {
    if (!started || !ready || near === null || menu !== null || launch) return;
    playCue("interact");
    if (near === 4) {
      setCount(3);
      setLaunch((v) => v + 1);
    } else {
      if (near >= STORY_BASE) storyReads.add(storyStops[near - STORY_BASE].id);
      setMenu(near);
    }
  };
  useEffect(() => {
    if (!launch) return;
    const a = setInterval(() => setCount((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(a);
  }, [launch]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.code === "Escape" && menu !== "complete") setMenu(null);
      if (e.code === "KeyE" && !e.repeat) interact();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [near, menu, launch, started, ready]);
  useEffect(() => {
    if (menu === null) return;
    previousFocus.current = document.activeElement as HTMLElement;
    const timer = setTimeout(
      () => modal.current?.querySelector<HTMLButtonElement>("button")?.focus(),
      50,
    );
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = modal.current?.querySelectorAll<HTMLElement>(
        "button,a[href],video",
      );
      if (!items?.length) return;
      const first = items[0],
        last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", trap);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", trap);
      previousFocus.current?.focus();
    };
  }, [menu]);
  const nav = (section: string) => {
    setMode("portfolio");
    setMenu(null);
    setTimeout(
      () =>
        document.getElementById(section)?.scrollIntoView({
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "instant"
            : "smooth",
        }),
      100,
    );
  };
  const fallback = (
    <div className="fallback">
      <h2>Your work, without the wait.</h2>
      <p>The 3D world couldn’t load on this device.</p>
      <button className="primary" onClick={() => setMode("portfolio")}>
        Explore the portfolio ↗
      </button>
    </div>
  );
  return (
    <>
      <header className={`header${mode === "game" ? " header--overlay" : ""}`}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setMode("game");
          }}
        >
          <StackLogo className="brand-icon" />
          <span>
            Stack Hop
            <span className="brand-sub">MY INTERACTIVE PORTFOLIO JOURNEY</span>
          </span>
        </a>
        <nav aria-label="Main navigation">
          <button
            onClick={() => {
              setMode("game");
              setMenu(null);
            }}
            className={mode === "game" ? "active" : ""}
          >
            Home
          </button>
          <button onClick={() => nav("about")}>About</button>
          <button onClick={() => nav("experience")}>Experience</button>
          <button onClick={() => nav("projects")}>Projects</button>
          <button onClick={() => setMenu("resume")}>Resume ↗</button>
        </nav>
        <button className="contact-button" onClick={() => nav("contact")}>
          Let’s connect <span>↗</span>
        </button>
      </header>
      {mode === "game" ? (
        <main className="game-shell">
          <section
            className="game-window"
            aria-label="Interactive 3D portfolio game"
          >
            <div className="game-canvas">
              <WebGLBoundary fallback={fallback}>
                <Suspense
                  fallback={
                    <div className="loading">Building your little world…</div>
                  }
                >
                  <Game
                    stage={stage}
                    teleport={teleport}
                    paused={menu !== null || launch > 0 || !ready || !started}
                    launch={launch}
                    onCheckpoint={checkpoint}
                    onNear={setNear}
                    onFall={() =>
                      notify("A little tumble. Back to your checkpoint!")
                    }
                    onReady={() => setReady(true)}
                    onComplete={() => setMenu("complete")}
                  />
                </Suspense>
              </WebGLBoundary>
            </div>
            <div className="world-top">
              <div className="world-tools">
                <button
                  className="portfolio-shortcut"
                  onClick={() => nav("about")}
                >
                  View portfolio without playing <span>↗</span>
                </button>
                <button
                  className="icon-button"
                  aria-label={sound ? "Mute sound" : "Enable sound"}
                  aria-pressed={sound}
                  onClick={toggleSound}
                >
                  {sound ? "♫" : "♪"}
                </button>
                <button
                  className="icon-button"
                  aria-label="Settings"
                  onClick={() => setMenu("settings")}
                >
                  ⚙
                </button>
              </div>
            </div>
            <div className="stage-title">
              <span className="eyebrow">WORLD 0{stage + 1} / 05</span>
              <h2>{levels[stage].theme}</h2>
            </div>
            <div className="world-bottom">
              {started &&
                near !== null &&
                ready &&
                !launch &&
                menu === null && (
                  <button
                    className="interaction"
                    aria-label={
                      near === 4 ? "E Deploy!" : near >= STORY_BASE ? "Press E: " + journeySigns[storyStops[near - STORY_BASE].id].prompt : "Press E to read more"
                    }
                    onClick={interact}
                  >
                    <kbd>E</kbd>
                    <span>
                      {near === 4 ? "Deploy!" : near >= STORY_BASE ? journeySigns[storyStops[near - STORY_BASE].id].prompt : "Press E to read more"}
                      <small>
                        {near === 4
                          ? "Launch your next chapter"
                          : near === 0
                            ? "About me"
                            : near >= STORY_BASE ? journeySigns[storyStops[near - STORY_BASE].id].topic + " · " + journeySigns[storyStops[near - STORY_BASE].id].source.split(" · ")[0] : showcases[near - 1].title}
                      </small>
                    </span>
                    <span className="interaction-arrow">↗</span>
                  </button>
                )}
              <button className="help-button" onClick={() => setMenu("help")}>
                <span>?</span> How to play
              </button>
            </div>
            {!ready && (
              <div className="startup-screen" role="status" aria-live="polite">
                <StackLogo className="startup-mark" />
                <strong>Stack Hop</strong>
                <p>Preparing physics & scenery…</p>
                <div className="startup-track" aria-hidden="true">
                  <span />
                </div>
              </div>
            )}
            {!started && (
              <section
                className="title-screen"
                aria-label="Stack Hop title screen"
              >
                <StackLogo className="title-stack" />
                <h1>My Journey Through the Tech Stack</h1>
                <p className="title-intro">
                  Hi, I'm Lily! Welcome to my interactive portfolio inspired by Roblox obbies.
                  Jump through my journey in tech and discover the projects, experiences,
                  and skills that brought me here.
                </p>
                <div className="title-instructions" aria-label="How to play">
                  <h2>How to play</h2>
                  <div>
                    <div className="control-keys"><kbd>W A S D</kbd><kbd aria-label="Arrow keys">↑ ← ↓ →</kbd></div>
                    <span>Move</span>
                  </div>
                  <div>
                    <div className="control-keys"><kbd>SPACE</kbd></div>
                    <span>Jump</span>
                  </div>
                  <div>
                    <div className="control-keys"><kbd>E</kbd></div>
                    <span>Explore</span>
                  </div>
                  <div>
                    <div className="control-keys"><kbd>Mouse drag</kbd></div>
                    <span>Change view · scroll to zoom</span>
                  </div>
                </div>
                <button
                  className="title-play"
                  autoFocus
                  aria-label="Enter the Stack"
                  onClick={() => setStarted(true)}
                >
                  Enter the Stack <span aria-hidden="true">↗</span>
                </button>
              </section>
            )}
            {launch > 0 && menu !== "complete" && (
              <div className="countdown" aria-live="polite">
                {count > 0 ? (
                  <>
                    <small>READY FOR LIFTOFF</small>
                    {count}
                  </>
                ) : (
                  <>
                    <small>SHIPPING SOMETHING GREAT</small>Deploying ✦
                  </>
                )}
              </div>
            )}
            <AnimatePresence>
              {notice && (
                <motion.div
                  role="status"
                  className="toast"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  ✦ {notice}
                </motion.div>
              )}
            </AnimatePresence>
          </section>
          <nav className="progress" aria-label="Teleport to a world">
            {levels.map((l, i) => (
              <button
                key={l.name}
                className={stage === i ? "current" : ""}
                onClick={() => go(i)}
                aria-current={stage === i ? "step" : undefined}
                aria-label={`Teleport to ${i === 4 ? "Launch" : l.name}`}
                title={`Teleport to ${i === 4 ? "Launch" : l.name}`}
              >
                <span
                  className="progress-icon"
                  style={{ "--stage-color": l.color } as React.CSSProperties}
                >
                  {l.icon}
                </span>
                <span>
                  <strong>{i === 4 ? "Launch" : l.name}</strong>
                  <small>{stage === i ? "You are here" : "Teleport ↗"}</small>
                </span>
                <span className="step-number">0{i + 1}</span>
              </button>
            ))}
          </nav>
        </main>
      ) : (
        <>
          <div className="portfolio-banner">
            <span>A LITTLE LESS JUMPING. THE SAME STORY.</span>
            <button onClick={() => setMode("game")}>
              Enter the 3D journey ↗
            </button>
          </div>
          <Portfolio />
        </>
      )}
      <AnimatePresence>
        {menu !== null && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => menu !== "complete" && setMenu(null)}
          >
            <motion.div
              className={`modal ${menu === "teleport" ? "wide" : ""}`}
              role="dialog"
              aria-modal="true"
              aria-label={
                typeof menu === "number"
                  ? menu >= STORY_BASE ? journeySigns[storyStops[menu - STORY_BASE].id].source.split(" · ")[0] : menu === 0
                    ? "About me"
                    : showcases[menu - 1].title
                  : `${menu} menu`
              }
              ref={modal}
              initial={{ y: 18, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="close"
                aria-label="Close menu"
                onClick={() => setMenu(null)}
              >
                ×
              </button>
              {typeof menu === "number" ? (
                menu >= STORY_BASE ? <StoryDetail index={menu - STORY_BASE} /> : menu === 0 ? (
                  <AboutDetails />
                ) : (
                  <ProjectDetails project={showcases[menu - 1]} />
                )
              ) : menu === "teleport" ? (
                <>
                  <span className="eyebrow">SKIP TO THE GOOD PART</span>
                  <h2>Where to next?</h2>
                  <p>Every world is open. Make this journey your own.</p>
                  <div className="teleport-grid">
                    {levels.map((l, i) => (
                      <button key={l.name} onClick={() => go(i)}>
                        <span style={{ background: l.accent }}>{l.icon}</span>
                        <strong>
                          0{i + 1} · {l.name}
                        </strong>
                        <small>{l.label} ↗</small>
                      </button>
                    ))}
                  </div>
                </>
              ) : menu === "help" ? (
                <>
                  <span className="eyebrow">A QUICK FIELD GUIDE</span>
                  <h2>Small steps. Big ideas.</h2>
                  <p>
                    Follow the floating platforms toward the next island.
                    Glowing pads save your place automatically.
                  </p>
                  <dl>
                    <dt>W A S D / Arrow keys</dt>
                    <dd>Move around the world</dd>
                    <dt>Space</dt>
                    <dd>Jump to the next platform</dd>
                    <dt>E</dt>
                    <dd>Explore a nearby display or launch</dd>
                    <dt>Mouse</dt>
                    <dd>Hold the left or right mouse button and drag to change your view. Scroll to zoom in or out.</dd>
                  </dl>
                  <p>
                    Fell off? You’ll return to your latest checkpoint. Use
                    Teleport anytime to visit any stage.
                  </p>
                </>
              ) : menu === "settings" ? (
                <>
                  <h2>A journey at your pace.</h2>
                  <p>
                    Your latest checkpoint is saved on this device. Restart
                    clears your progress and resets the rocket.
                  </p>
                  <button className="primary" onClick={restart}>
                    Restart journey ↻
                  </button>
                  <button className="secondary" onClick={() => nav("projects")}>
                    View portfolio without playing ↗
                  </button>
                </>
              ) : menu === "resume" ? (
                <>
                  <h2>The story, on one page.</h2>
                  {p.resumeUrl ? (
                    <p>Education, experience, and the work in between.</p>
                  ) : (
                    <p>
                      Add a resume URL in <code>src/data/portfolio.ts</code> to
                      make it available here.
                    </p>
                  )}
                  <ConfigLink url={p.resumeUrl}>View resume</ConfigLink>
                </>
              ) : (
                <>
                  <div className="completion-star">✦</div>
                  <span className="eyebrow">FROM HELLO WORLD TO LIFTOFF</span>
                  <h2>Successfully deployed!</h2>
                  <p>
                    Thanks for taking the scenic route through my world. Let’s
                    build what comes next.
                  </p>
                  <button className="primary" onClick={restart}>
                    Restart journey ↻
                  </button>
                  <button className="secondary" onClick={() => nav("projects")}>
                    Explore projects ↗
                  </button>
                  <div className="link-row">
                    <ConfigLink url={p.resumeUrl}>View resume</ConfigLink>
                    <button onClick={() => nav("contact")}>Contact me ↗</button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
