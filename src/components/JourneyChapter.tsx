import { journeyChapters } from "../data/journey";
export function JourneyChapter({ stage }: { stage: number }) {
  const chapter = journeyChapters[stage];
  return <section className="journey-chapter" aria-label={`My journey, chapter ${stage + 1}`}>
    <span className="eyebrow">MY JOURNEY · CHAPTER {stage + 1} OF 5</span>
    <h3>{chapter.title}</h3>
    <p>{chapter.connection}</p>
    <p className="journey-thought">{chapter.thought}</p>
    <ol className="journey-moments">
      {chapter.moments.map((moment) => <li key={moment.company}>
        <strong>{moment.company}</strong>
        <small>{moment.role}</small>
        <p>{moment.detail}</p>
      </li>)}
    </ol>
    <div className="tags" aria-label="Skills in this chapter">{chapter.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
  </section>;
}
