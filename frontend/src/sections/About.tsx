import { approach } from '../data/profile';
import { Section } from '../components/ui';

export function About() {
  return (
    <>
      <Section id="about" eyebrow="About me" title="Curious by nature. Practical by approach." intro="I’m a Computer Science and Engineering (Data Science) graduate focused on building useful software across applied machine learning, computer vision, generative AI, and full-stack engineering. I like understanding the whole journey: the data, the model or logic, the API, the interface, and how the result is evaluated. I value clear communication, thoughtful collaboration, and steady iteration—and I’m transparent about the difference between a working prototype and a production-ready system." />
      <Section id="approach" eyebrow="Engineering approach" title="How I work">
        <div className="grid g3">
          {approach.map((a, i) => (
            <article key={a.h} className="card"><p className="mono muted">0{i + 1}</p><h3 className="h3">{a.h}</h3><p>{a.p}</p></article>
          ))}
        </div>
      </Section>
    </>
  );
}
