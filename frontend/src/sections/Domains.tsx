import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Accordion, Chip, Empty, Section, Tabs } from '../components/ui';
import { streams } from '../data/streams';
import { projects } from '../data/projects';
import { norm } from '../lib/utils';

export function Domains() {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(streams[0].id);
  const visible = useMemo(() => {
    const n = norm(q);
    return n ? streams.filter((s) => norm(JSON.stringify(s)).includes(n)) : streams;
  }, [q]);
  const cur = visible.find((s) => s.id === sel) ?? visible[0];
  const Block = ({ title, items }: { title: string; items: string[] }) => <div><h4 className="h4">{title}</h4><ul className="plain">{items.map((i) => <li key={i}>{i}</li>)}</ul></div>;
  return (
    <Section id="domains" eyebrow="Technical domains" title="Career streams explorer" intro="Pick a stream to see the projects, tools, coursework and evidence behind it, plus trade-offs and what I am still learning.">
      <div className="search"><label className="sr" htmlFor="dom-q">Search skills or tools</label><input id="dom-q" type="search" placeholder="Search a skill or tool, e.g. LangGraph" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {!cur ? <Empty title="No stream mentions that skill">Try another term.</Empty> : (
        <>
          <div className="tabs-scroll"><Tabs label="Career streams" tabs={visible.map((s) => ({ id: s.id, label: s.name }))} value={cur.id} onChange={setSel} /></div>
          <div role="tabpanel" id={`panel-${cur.id}`} aria-labelledby={`tab-${cur.id}`} className="card panel">
            <h3 className="h3">{cur.name}</h3>
            <p>{cur.overview}</p>
            <div className="grid g2">
              <div><h4 className="h4">Relevant projects</h4><ul className="plain">{cur.projects.map((p) => <li key={p}><Link to={`/projects/${p}`}>{projects.find((x) => x.slug === p)?.name ?? p}</Link></li>)}</ul></div>
              <div><h4 className="h4">Tools and libraries</h4><div className="chips">{cur.tools.map((t) => <Chip key={t}>{t}</Chip>)}</div></div>
              <Block title="Relevant coursework" items={cur.coursework} />
              <Block title="Implementation evidence" items={cur.evidence} />
              <Block title="Experiments" items={cur.experiments} />
              <div><h4 className="h4">Pipeline overview</h4><p><Link to={`/?pipeline=${cur.pipeline}#pipelines`}>Open the {cur.pipeline} pipeline explorer →</Link></p></div>
            </div>
            <Accordion title="Alternative approaches and trade-offs"><Block title="Alternatives" items={cur.alternatives} /><Block title="Trade-offs" items={cur.tradeoffs} /></Accordion>
            <Accordion title="Failure modes"><ul className="plain">{cur.failureModes.map((f) => <li key={f}>{f}</li>)}</ul></Accordion>
            <Accordion title="Skills still being explored"><ul className="plain">{cur.exploring.map((f) => <li key={f}>{f}</li>)}</ul></Accordion>
          </div>
        </>
      )}
    </Section>
  );
}
