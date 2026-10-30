import { Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Accordion, Section } from '../components/ui';
import { achievements, exploration, internships } from '../data/profile';

export function Achievements() {
  return (
    <>
      <Section id="achievements" eyebrow="Achievements" title="Recognition">
        <div className="grid g2">
          {achievements.map((a) => (
            <article key={a.id} className="card award">
              <Award aria-hidden /><p className="eyebrow">{a.place}</p><h3 className="h3">{a.name}</h3><p className="muted">{a.context}</p>
              <Accordion title="Supporting project evidence"><ul className="plain">{a.evidence.map((e) => <li key={e}>{e}</li>)}</ul><Link to={`/projects/${a.project}`}>Read the case study →</Link></Accordion>
            </article>
          ))}
        </div>
      </Section>
      <Section id="internship" eyebrow="Internship and exploration" title="Internship Experience" intro="Applied AI, computer vision, and product prototyping">
        <div className="stack">
          {internships.map((item) => (
            <article className="card" key={item.id}>
              <p className="eyebrow">{item.period}</p>
              <h3 className="h3">{item.role}</h3>
              <p className="muted">{item.org}</p>
              <ul className="plain">{item.points.map((p) => <li key={p}>{p}</li>)}</ul>
            </article>
          ))}
        </div>
        <h3 className="h3">Independent exploration</h3>
        <p className="muted">Exploration is not the same as production implementation; each row says which.</p>
        <div className="table-wrap"><table className="table"><thead><tr><th scope="col">Area</th><th scope="col">What</th><th scope="col">Evidence level</th></tr></thead>
          <tbody>{exploration.map((e) => <tr key={e.area}><th scope="row">{e.area}</th><td>{e.items}</td><td>{e.label}</td></tr>)}</tbody></table></div>
      </Section>
    </>
  );
}
