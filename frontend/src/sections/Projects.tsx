import { ExternalLink, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Chip, Empty, Section } from '../components/ui';
import { categoriesOfProjects, projects, tourism } from '../data/projects';
import { cx, norm } from '../lib/utils';

export function Projects() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const list = useMemo(() => {
    const n = norm(q);
    return projects.filter((p) => (cat === 'All' || p.categories.includes(cat)) &&
      (!n || norm([p.name, p.tagline, p.overview, ...p.tools, ...p.categories].join(' ')).includes(n)));
  }, [q, cat]);
  return (
    <Section id="projects" eyebrow="Projects" title="Six core projects" intro="Search by name, tool or concept. Each project page covers problem, architecture, experiments, results, failure modes and alternatives, with every claim labelled by evidence.">
      <div className="toolbar">
        <div className="search"><Search size={16} aria-hidden /><label className="sr" htmlFor="proj-q">Search projects</label>
          <input id="proj-q" type="search" placeholder="Search e.g. XGBoost, RAG, Power BI" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="chips" role="group" aria-label="Filter by category">
          {['All', ...categoriesOfProjects].map((c) => <button key={c} type="button" className={cx('chip btn-chip', cat === c && 'active')} aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>)}
        </div>
      </div>
      <p className="muted" aria-live="polite">{list.length} of {projects.length} projects shown</p>
      {list.length === 0 ? (
        <Empty title="No projects match your search">Try a different term or <button className="link-btn" onClick={() => { setQ(''); setCat('All'); }}>clear filters</button>.</Empty>
      ) : (
        <div className="grid g2">
          {list.map((p) => (
            <article key={p.slug} className="card project-card">
              <div className="row gap wrap">{p.categories.slice(0, 2).map((c) => <Badge key={c} tone="info">{c}</Badge>)}{p.achievement && <Badge tone="ok">Award</Badge>}</div>
              <h3 className="h3"><Link to={`/projects/${p.slug}`}>{p.name}</Link></h3>
              <p>{p.tagline}</p>
              <div className="chips">{p.tools.slice(0, 6).map((t) => <Chip key={t}>{t}</Chip>)}{p.tools.length > 6 && <Chip>+{p.tools.length - 6}</Chip>}</div>
              <div className="row gap wrap card-actions">
                <Link className="btn btn-secondary btn-sm" to={`/projects/${p.slug}`}>Read the case study</Link>
                {p.repo && <a className="btn btn-ghost btn-sm" href={p.repo} target="_blank" rel="noreferrer">Repository <ExternalLink size={14} aria-hidden /></a>}
                {p.demo && <a className="btn btn-ghost btn-sm" href={p.demo} target="_blank" rel="noreferrer">Live demo <ExternalLink size={14} aria-hidden /></a>}
              </div>
            </article>
          ))}
        </div>
      )}
      <aside className="card exploratory" aria-label="Exploration">
        <Badge tone="info">Exploratory concept</Badge>
        <h3 className="h3">{tourism.name}</h3>
        <p>{tourism.summary}</p>
        <p><strong>Design principle:</strong> {tourism.principle}</p>
        <ul className="plain">{tourism.items.map((i) => <li key={i.t}><Badge>{i.s}</Badge> {i.t}</li>)}</ul>
      </aside>
    </Section>
  );
}
