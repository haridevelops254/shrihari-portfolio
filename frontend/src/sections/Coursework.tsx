import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Empty, Section } from '../components/ui';
import { coursework } from '../data/coursework';
import { projects } from '../data/projects';
import { streams } from '../data/streams';
import { cx, norm } from '../lib/utils';

export function Coursework() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const n = norm(q);
  const groups = useMemo(() => coursework.filter((g) => cat === 'all' || g.id === cat).map((g) => {
    const uniq = Array.from(new Set(g.courses));
    return { ...g, shown: n ? uniq.filter((c) => norm(c).includes(n) || norm(g.title).includes(n)) : uniq };
  }).filter((g) => g.shown.length > 0), [n, cat]);
  const setAll = (v: boolean) => setOpen(Object.fromEntries(coursework.map((g) => [g.id, v])));
  return (
    <Section id="coursework" eyebrow="Coursework" title="Coursework across semesters 1–8" intro="Grouped by subject area. A verified semester-wise transcript has not been supplied, so subjects are not mapped to individual semesters.">
      <div className="toolbar">
        <div className="search"><label className="sr" htmlFor="course-q">Search courses</label><input id="course-q" type="search" placeholder="Search courses, e.g. Deep Learning" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="chips" role="group" aria-label="Filter by group">
          {[{ id: 'all', title: 'All' }, ...coursework].map((g) => <button key={g.id} type="button" className={cx('chip btn-chip', cat === g.id && 'active')} aria-pressed={cat === g.id} onClick={() => setCat(g.id)}>{g.title}</button>)}
        </div>
        <div className="row gap"><button type="button" className="btn btn-ghost btn-sm" onClick={() => setAll(true)}>Expand all</button><button type="button" className="btn btn-ghost btn-sm" onClick={() => setAll(false)}>Collapse all</button></div>
      </div>
      {groups.length === 0 ? <Empty title="No courses match">Try another search or filter.</Empty> : (
        <div className="stack">
          {groups.map((g) => (
            <details key={g.id} className="card details" open={n ? true : !!open[g.id]} onToggle={(e) => { const o = (e.currentTarget as HTMLDetailsElement).open; setOpen((s) => (s[g.id] === o ? s : { ...s, [g.id]: o })); }}>
              <summary><span className="h3">{g.title}</span><span className="muted">{g.shown.length} subjects</span></summary>
              <ul className="plain cols">{g.shown.map((c) => <li key={c}>{c}</li>)}</ul>
              {(g.projects.length > 0 || g.streams.length > 0) && (
                <p className="muted">Related: {g.projects.map((p) => <Link key={p} to={`/projects/${p}`} className="rel">{projects.find((x) => x.slug === p)?.name}</Link>)}
                  {g.streams.map((s) => <Link key={s} to="/#domains" className="rel">{streams.find((x) => x.id === s)?.name}</Link>)}</p>
              )}
            </details>
          ))}
        </div>
      )}
    </Section>
  );
}
