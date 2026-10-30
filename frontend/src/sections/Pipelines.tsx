import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Accordion, Badge, Section, Tabs } from '../components/ui';
import { pipelines } from '../data/pipelines';
import { cx } from '../lib/utils';

export function Pipelines() {
  const [params, setParams] = useSearchParams();
  const wanted = params.get('pipeline');
  const [pid, setPid] = useState(pipelines.find((p) => p.id === wanted)?.id ?? pipelines[0].id);
  const [step, setStep] = useState(0);
  const [alt, setAlt] = useState(0);
  useEffect(() => { const p = pipelines.find((x) => x.id === wanted); if (p) { setPid(p.id); setStep(0); setAlt(0); } }, [wanted]);
  const pipe = pipelines.find((p) => p.id === pid) ?? pipelines[0];
  const cur = pipe.steps[Math.min(step, pipe.steps.length - 1)];
  const a = pipe.alternatives[Math.min(alt, pipe.alternatives.length - 1)];
  const last = pipe.steps.length - 1;
  return (
    <Section id="pipelines" eyebrow="Pipeline explorer" title="How these systems flow" intro="Click a step, drag the slider, or use the arrow buttons. Status labels show whether a step was implemented, experimented with, or is conceptual.">
      <Tabs label="Pipelines" tabs={pipelines.map((p) => ({ id: p.id, label: p.name }))} value={pid} onChange={(id) => { setPid(id); setStep(0); setAlt(0); const n = new URLSearchParams(params); n.set('pipeline', id); setParams(n, { replace: true, preventScrollReset: true }); }} />
      <p className="muted">{pipe.evidence}</p>
      <ol className="stepper" aria-label={`${pipe.name} steps`}>
        {pipe.steps.map((s, i) => (
          <li key={s.name}><button type="button" className={cx('step', i === step && 'active', i < step && 'done')} aria-current={i === step ? 'step' : undefined} onClick={() => setStep(i)}><span className="mono">{String(i + 1).padStart(2, '0')}</span>{s.name}</button></li>
        ))}
      </ol>
      <div className="slider-row">
        <button type="button" className="icon-btn" aria-label="Previous step" disabled={step === 0} onClick={() => setStep(step - 1)}><ChevronLeft /></button>
        <label className="sr" htmlFor="step-range">Pipeline step</label>
        <input id="step-range" type="range" min={0} max={last} step={1} value={step} aria-valuetext={`Step ${step + 1} of ${last + 1}: ${cur.name}`} onChange={(e) => setStep(Number(e.target.value))} />
        <button type="button" className="icon-btn" aria-label="Next step" disabled={step === last} onClick={() => setStep(step + 1)}><ChevronRight /></button>
      </div>
      <div className="card panel" aria-live="polite">
        <div className="row between wrap gap"><h3 className="h3">{step + 1}. {cur.name}</h3><Badge>{cur.status}</Badge></div>
        <p>{cur.does}</p>
        <Accordion title="Failure modes"><p>{cur.fail}</p></Accordion>
        <Accordion title="Evaluation criteria"><p>{cur.evaluate}</p></Accordion>
      </div>
      <div className="card panel">
        <h3 className="h3">Alternatives and trade-offs</h3>
        <div className="field"><label htmlFor="alt-sel">Decision point</label>
          <select id="alt-sel" value={alt} onChange={(e) => setAlt(Number(e.target.value))}>{pipe.alternatives.map((x, i) => <option key={x.topic} value={i}>{x.topic}</option>)}</select></div>
        <div className="chips">{a.options.map((o) => <span key={o} className="chip">{o}</span>)}</div>
        <p>{a.note}</p>
      </div>
    </Section>
  );
}
