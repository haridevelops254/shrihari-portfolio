import { useMemo, useState } from 'react';
import { Badge, Empty, Section } from '../components/ui';
import { skillLevels, skills } from '../data/skills';
import { cx, norm } from '../lib/utils';

export function Skills() {
  const [lvl, setLvl] = useState('All');
  const [q, setQ] = useState('');
  const groups = useMemo(() => {
    const n = norm(q);
    const f = skills.filter((s) => (lvl === 'All' || s.level === lvl) && (!n || norm(`${s.name} ${s.evidence} ${s.group}`).includes(n)));
    return Array.from(new Set(f.map((s) => s.group))).map((g) => ({ g, items: f.filter((s) => s.group === g) }));
  }, [lvl, q]);
  return (
    <Section id="skills" eyebrow="Skills" title="Evidence-labelled skills" intro="Labels describe how I have used each skill. There are no proficiency percentages.">
      <div className="toolbar">
        <div className="search"><label className="sr" htmlFor="skill-q">Search skills</label><input id="skill-q" type="search" placeholder="Search skills" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="chips" role="group" aria-label="Filter by label">
          {['All', ...skillLevels].map((l) => <button key={l} type="button" className={cx('chip btn-chip', lvl === l && 'active')} aria-pressed={lvl === l} onClick={() => setLvl(l)}>{l}</button>)}
        </div>
      </div>
      {groups.length === 0 ? <Empty title="No skills match" /> : (
        <div className="grid g3">
          {groups.map(({ g, items }) => (
            <article key={g} className="card"><h3 className="h3">{g}</h3>
              <ul className="plain skill-list">{items.map((s) => <li key={s.name}><span>{s.name}<small className="muted"> — {s.evidence}</small></span><Badge>{s.level}</Badge></li>)}</ul></article>
          ))}
        </div>
      )}
    </Section>
  );
}
