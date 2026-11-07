import { portfolio as p } from "../data/portfolio";
import { showcases, type Showcase } from "../data/showcases";
export function ConfigLink({
  url,
  children,
}: {
  url: string;
  children: React.ReactNode;
}) {
  return url ? (
    <a href={url} target="_blank" rel="noreferrer">
      {children} ↗
    </a>
  ) : (
    <span className="unconfigured">{children} · coming soon</span>
  );
}
export function ProjectDetails({ project: s }: { project: Showcase }) {
  return (
    <>
      <div className="project-image">
        {s.image ? (
          <img src={s.image} alt={`${s.title} preview`} />
        ) : (
          <>
            <span>⌘</span>
            <small>
              {s.status
                ? "WORK IN PROGRESS"
                : s.title === "Cram-Cam"
                  ? "FOCUS. STUDY. LEVEL UP."
                  : "STUDYDAY · PLAN YOUR STUDY TIME"}
            </small>
          </>
        )}
      </div>
      <h2>{s.title}</h2>
      <p>{s.description}</p>
      <div className="tags">
        {s.technologies.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      {s.technicalDetails && (
        <>
          <h3>Under the hood</h3>
          <p>{s.technicalDetails}</p>
        </>
      )}
      {s.challenges && (
        <>
          <h3>The engineering challenge</h3>
          <p>{s.challenges}</p>
        </>
      )}
      {s.videoUrl && <video controls src={s.videoUrl} />}
      {!s.status && (
        <div className="link-row">
          <ConfigLink url={s.githubUrl}>GitHub</ConfigLink>
          {s.liveUrl && <ConfigLink url={s.liveUrl}>Live demo</ConfigLink>}
        </div>
      )}
    </>
  );
}
export function AboutDetails() {
  return (
    <>
      <div className="avatar">
        {p.photo ? <img src={p.photo} alt={p.name} /> : p.initials}
      </div>
      <span className="eyebrow">A LITTLE ABOUT ME</span>
      <h2>Hi, I’m {p.name}.</h2>
      <p>{p.introduction}</p>
      <p><strong>Fun fact:</strong> {p.funFact}</p>
      <h3>Education</h3>
      <p>{p.education}</p>
      <div className="tags">
        {p.interests.map((x) => (
          <span key={x}>{x}</span>
        ))}
      </div>
      <div className="link-row">
        <ConfigLink url={p.resumeUrl}>Resume</ConfigLink>
        <ConfigLink url={p.githubUrl}>GitHub</ConfigLink>
        <ConfigLink url={p.sourceUrl}>Portfolio source</ConfigLink>
        <ConfigLink url={p.linkedinUrl}>LinkedIn</ConfigLink>
      </div>
    </>
  );
}
export function Portfolio() {
  return (
    <main className="portfolio">
      <section id="about">
        <span className="eyebrow">THE PERSON BEHIND THE PIXELS</span>
        <AboutDetails />
      </section>
      <section id="experience">
        <span className="eyebrow">WHERE I’VE BEEN</span>
        <h2>Good teams. Meaningful work.</h2>
        {p.experience.map((e) => (
          <article className="experience" key={e.company}>
            <div className="company-mark">{e.company.charAt(0)}</div>
            <div>
              <h3>{e.company}</h3>
              <strong>{e.role}</strong>
              <p>{e.description}</p>
            </div>
          </article>
        ))}
      </section>
      <section id="projects">
        <span className="eyebrow">SELECTED WORK</span>
        <h2>Ideas, brought to life.</h2>
        <div className="project-grid">
          {showcases.map((s) => (
            <article className="project-card" key={s.id}>
              <ProjectDetails project={s} />
            </article>
          ))}
        </div>
      </section>
      <section id="contact">
        <span className="eyebrow">LET’S BUILD SOMETHING</span>
        <h2>A good conversation starts here.</h2>
        <div className="link-row">
          <ConfigLink url={p.email ? `mailto:${p.email}` : ""}>
            Email me
          </ConfigLink>
          <ConfigLink url={p.githubUrl}>GitHub</ConfigLink>
          <ConfigLink url={p.linkedinUrl}>LinkedIn</ConfigLink>
          <ConfigLink url={p.resumeUrl}>Resume</ConfigLink>
        </div>
        {!p.email && !p.githubUrl && !p.linkedinUrl && (
          <p className="muted">Contact details are awaiting configuration.</p>
        )}
      </section>
    </main>
  );
}
