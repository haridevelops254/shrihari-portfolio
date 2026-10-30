import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Badge, Chip } from '../components/ui';
import { projects } from '../data/projects';
import type { Item } from '../types';

const Items = ({ items }: { items: Item[] }) => <ul className="plain">{items.map((i) => <li key={i.t}><Badge>{i.s}</Badge> {i.t}</li>)}</ul>;

export default function ProjectPage() {
  const { slug } = useParams();
  const p = projects.find((x) => x.slug === slug);
  if (!p) return <div className="container section"><h1 className="display">Project not found</h1><p><Link to="/#projects">← Back to projects</Link></p></div>;
  document.title = `${p.name} — Shrihari M V`;
  const idx = projects.indexOf(p);
  const next = projects[(idx + 1) % projects.length];
  return (
    <article className="container section project">
      <Link to="/#projects" className="back"><ArrowLeft size={16} aria-hidden /> All projects</Link>
      <div className="row gap wrap">{p.categories.map((c) => <Badge key={c} tone="info">{c}</Badge>)}</div>
      <h1 className="display">{p.name}</h1><p className="lede">{p.tagline}</p>
      <div className="row gap wrap">
        {p.repo ? <a className="btn btn-primary" href={p.repo} target="_blank" rel="noreferrer">Repository <ExternalLink size={14} aria-hidden /></a> : <span className="notice">{p.noRepoNote}</span>}
        {p.demo && <a className="btn btn-secondary" href={p.demo} target="_blank" rel="noreferrer">Live demo <ExternalLink size={14} aria-hidden /></a>}
      </div>
      {p.achievement && <p className="card award-inline"><strong>Achievement:</strong> {p.achievement}</p>}
      <div className="chips">{p.tools.map((t) => <Chip key={t}>{t}</Chip>)}</div>
      <h2 className="h2">Overview</h2><p>{p.overview}</p>
      <h2 className="h2">Problem</h2><p>{p.problem}</p>
      <h2 className="h2">Architecture and data flow</h2><ol className="flow">{p.architecture.map((a) => <li key={a}>{a}</li>)}</ol>
      <h2 className="h2">Implementation</h2><Items items={p.implementation} />
      <h2 className="h2">Experiments and decisions</h2><Items items={p.experiments} />
      <h2 className="h2">Evaluation and results</h2>
      <div className="grid g3">{p.results.map((r) => <div key={r.label} className="card stat"><span className="display">{r.value}</span><small className="muted">{r.label}</small></div>)}</div>
      <p className="muted">{p.resultsNote}</p>
      <h2 className="h2">Failure modes and limitations</h2><ul className="plain">{p.failureModes.map((f) => <li key={f}>{f}</li>)}</ul>
      <h2 className="h2">Alternatives</h2><Items items={p.alternatives} />
      <h2 className="h2">What I learned</h2><ul className="plain">{p.learned.map((f) => <li key={f}>{f}</li>)}</ul>
      <h2 className="h2">Future improvements</h2><Items items={p.future} />
      <p className="row between"><Link to="/#projects">← All projects</Link><Link to={`/projects/${next.slug}`}>Next: {next.name} →</Link></p>
    </article>
  );
}
