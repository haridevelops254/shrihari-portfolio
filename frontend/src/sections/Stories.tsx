import { Link } from 'react-router-dom';
import { Accordion, Badge, Section } from '../components/ui';
import { stories } from '../data/stories';

export function Stories() {
  return (
    <Section id="stories" eyebrow="Engineering stories" title="Decisions, not just outcomes" intro="Problem → Constraints → Alternatives → Decision → Experiment → Result → Limitations → Next step. Alternatives marked conceptual were not tested.">
      <div className="stack">
        {stories.map((s) => (
          <Accordion key={s.id} title={s.title} meta={<Badge>{s.label}</Badge>}>
            <dl className="story">
              {([['Problem', s.problem], ['Constraints', s.constraints], ['Alternatives', s.alternatives], ['Decision', s.decision], ['Experiment', s.experiment], ['Result', s.result], ['Limitations', s.limitations], ['Next step', s.next]] as const).map(([k, v]) => (
                <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
            {s.projects.length > 0 && <p className="muted">Evidence: {s.projects.map((p, i) => <span key={p}>{i > 0 && ', '}<Link to={`/projects/${p}`}>{p}</Link></span>)}</p>}
          </Accordion>
        ))}
      </div>
    </Section>
  );
}
