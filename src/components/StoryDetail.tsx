import { portfolio } from "../data/portfolio";
import { ConfigLink } from "./Portfolio";
import { storyStops } from "../data/storyStops";
import { journeySigns } from "../data/journeySigns";
import { levels } from "../data/levels";
export function StoryDetail({ index }: { index: number }) {
  const stop = storyStops[index], example = journeySigns[stop.id];
  const [name, ...context] = example.source.split(" · ");
  return <article className="story-detail">
    <span className="eyebrow">MY JOURNEY / {levels[stop.stage].name}</span>
    <h2>{name}</h2>
    <p className="eyebrow">{context.join(" · ")}</p>
    <section className="story-example"><h3>{example.title}</h3>{example.text.split("\n\n").map((paragraph, i) => <p key={i}>{paragraph}</p>)}</section>
    <div className="link-row"><ConfigLink url={portfolio.resumeUrl}>View my resume</ConfigLink></div>
  </article>;
}
