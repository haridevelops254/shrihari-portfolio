import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Empty, Spinner } from '../components/ui';
import { api } from '../lib/api';
import { fmtBytes, fmtDate } from '../lib/utils';

export default function Dashboard() {
  const stats = useQuery({ queryKey: ['stats'], queryFn: api.stats });
  const audit = useQuery({ queryKey: ['audit'], queryFn: api.audit });
  if (stats.isLoading) return <Spinner />;
  if (stats.isError || !stats.data) return <p className="error" role="alert">Could not load statistics. <button className="link-btn" onClick={() => stats.refetch()}>Retry</button></p>;
  const s = stats.data;
  return (
    <>
      <h1 className="h2">Overview</h1>
      <div className="grid g4">
        {[['Total', s.total], ['Published', s.by_visibility.published ?? 0], ['Drafts', s.by_visibility.draft ?? 0], ['Archived', s.by_visibility.archived ?? 0]].map(([l, n]) => <div key={l} className="card stat"><span className="display">{n}</span><small className="muted">{l}</small></div>)}
      </div>
      <p className="muted">Storage used by resume files: {fmtBytes(s.total_bytes)}</p>
      <div className="grid g2">
        <section className="card"><h2 className="h3">By category</h2>
          {s.by_category.length === 0 ? <Empty title="No resumes yet"><Link to="/admin/resumes/upload">Upload your first resume</Link></Empty>
            : <ul className="plain">{s.by_category.map((c) => <li key={c.key} className="row between"><span>{c.label}</span><strong>{c.count}</strong></li>)}</ul>}</section>
        <section className="card"><h2 className="h3">Recent activity</h2>
          {audit.data?.length ? <ul className="plain">{audit.data.map((a, i) => <li key={i} className="row between"><span className="mono">{a.action}{a.outcome !== 'success' && ` (${a.outcome})`}</span><span className="muted small">{fmtDate(a.created_at)}</span></li>)}</ul> : <p className="muted">No activity yet.</p>}</section>
      </div>
    </>
  );
}
