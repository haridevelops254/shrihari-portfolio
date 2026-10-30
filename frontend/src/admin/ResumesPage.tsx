import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, ChevronDown, Download, Edit3, Eye, EyeOff, History as HistoryIcon, RefreshCw, Star, Trash2 } from 'lucide-react';
import { Fragment, useDeferredValue, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, ConfirmDialog, Dialog, Empty, Field, Spinner, useToast } from '../components/ui';
import { api, replaceResume } from '../lib/api';
import { CATEGORIES } from '../lib/categories';
import { fieldErrors, uploadSchema, type AdminResume, type FieldErrors } from '../lib/schemas';
import { fmtBytes, fmtDate } from '../lib/utils';

function EditDialog({ r, onClose }: { r: AdminResume; onClose: () => void }) {
  const [v, setV] = useState({ title: r.title, category: r.category, customCategory: r.custom_category ?? '', version: r.version, description: r.description ?? '' });
  const [err, setErr] = useState<FieldErrors>({});
  const qc = useQueryClient(); const toast = useToast();
  const m = useMutation({
    mutationFn: () => api.patch(r.id, { title: v.title.trim(), category: v.category, custom_category: v.category === 'custom' ? v.customCategory.trim() : null, version: v.version.trim(), description: v.description.trim() || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-resumes'] }); qc.invalidateQueries({ queryKey: ['stats'] }); qc.invalidateQueries({ queryKey: ['public-resumes'] }); toast('ok', 'Details saved.'); onClose(); },
    onError: (e) => toast('err', (e as Error).message),
  });
  const save = (e: React.FormEvent) => { e.preventDefault(); const p = uploadSchema.safeParse(v); if (!p.success) return setErr(fieldErrors(p.error)); setErr({}); m.mutate(); };
  return (
    <form onSubmit={save} noValidate>
      <Field label="Title" error={err.title}>{(p) => <input {...p} value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} />}</Field>
      <div className="grid g2">
        <Field label="Category" error={err.category}>{(p) => <select {...p} value={v.category} onChange={(e) => setV({ ...v, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</select>}</Field>
        <Field label="Version" error={err.version}>{(p) => <input {...p} value={v.version} onChange={(e) => setV({ ...v, version: e.target.value })} />}</Field>
      </div>
      {v.category === 'custom' && <Field label="Custom category" error={err.customCategory}>{(p) => <input {...p} value={v.customCategory} onChange={(e) => setV({ ...v, customCategory: e.target.value })} />}</Field>}
      <Field label="Description">{(p) => <textarea {...p} rows={3} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} />}</Field>
      {v.category !== r.category && r.is_default_for_category && <p className="hint">Changing the category removes the default flag.</p>}
      <div className="row end gap"><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={m.isPending}>{m.isPending ? 'Saving…' : 'Save'}</button></div>
    </form>
  );
}

function ReplaceDialog({ r, onClose }: { r: AdminResume; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [keep, setKeep] = useState(true);
  const [version, setVersion] = useState('');
  const [msg, setMsg] = useState('');
  const [pct, setPct] = useState<number | null>(null);
  const qc = useQueryClient(); const toast = useToast();
  const go = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pct !== null) return;
    if (!file) return setMsg('Choose a replacement file.');
    if (keep && (!version.trim() || version.trim() === r.version)) return setMsg('Enter a new version identifier to keep the previous file.');
    setMsg(''); setPct(0);
    const f = new FormData(); f.set('file', file); f.set('keep_previous', String(keep)); if (version.trim()) f.set('version', version.trim());
    try {
      await replaceResume(r.id, f, setPct);
      ['admin-resumes', 'stats', 'public-resumes', 'history'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      toast('ok', keep ? 'New version saved as a draft.' : 'File replaced.'); onClose();
    } catch (x) { setMsg((x as Error).message); } finally { setPct(null); }
  };
  return (
    <form onSubmit={go} noValidate>
      <Field label="Replacement file (.pdf or .docx, max 10 MB)">{(p) => <input {...p} type="file" accept=".pdf,.docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />}</Field>
      <label className="check"><input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} /> Keep the previous file as its own version (recommended)</label>
      {!keep && <p className="notice">The current file will be permanently overwritten.</p>}
      <Field label={keep ? 'New version identifier (required)' : 'Version identifier (optional)'}>{(p) => <input {...p} value={version} placeholder={`current: ${r.version}`} onChange={(e) => setVersion(e.target.value)} />}</Field>
      {pct !== null && <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress"><div style={{ width: `${pct}%` }} /></div>}
      {msg && <p className="error" role="alert">{msg}</p>}
      <div className="row end gap"><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={pct !== null}>Upload</button></div>
    </form>
  );
}

function History({ id }: { id: string }) {
  const h = useQuery({ queryKey: ['history', id], queryFn: () => api.history(id) });
  if (h.isLoading) return <Spinner />;
  return <ul className="plain history">{h.data?.map((x) => <li key={x.id} className="row between wrap gap"><span><strong>{x.version}</strong> <Badge>{x.visibility}</Badge> <span className="muted small">{x.original_filename} · {fmtBytes(x.file_size_bytes)} · {fmtDate(x.created_at)}</span></span><a className="btn btn-ghost btn-sm" href={api.adminDownloadUrl(x.id)}>Download</a></li>)}</ul>;
}

export default function ResumesPage() {
  const [q, setQ] = useState(''); const [category, setCategory] = useState(''); const [visibility, setVis] = useState(''); const [sort, setSort] = useState('updated');
  const dq = useDeferredValue(q);
  const [edit, setEdit] = useState<AdminResume | null>(null);
  const [rep, setRep] = useState<AdminResume | null>(null);
  const [del, setDel] = useState<AdminResume | null>(null);
  const [hist, setHist] = useState<string | null>(null);
  const qc = useQueryClient(); const toast = useToast();
  const list = useQuery({ queryKey: ['admin-resumes', dq, category, visibility, sort], queryFn: () => api.list({ q: dq, category, visibility, sort }), placeholderData: (p) => p });
  const stats = useQuery({ queryKey: ['stats'], queryFn: api.stats });
  const refresh = () => ['admin-resumes', 'stats', 'public-resumes', 'history', 'audit'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
  const act = useMutation({
    mutationFn: ({ id, name, query }: { id: string; name: 'publish' | 'unpublish' | 'archive' | 'default'; query?: string }) => api.action(id, name, query),
    onSuccess: (_d, v) => { refresh(); toast('ok', { publish: 'Published.', unpublish: 'Unpublished; no longer public.', archive: 'Archived.', default: 'Set as default.' }[v.name]); },
    onError: (e) => toast('err', (e as Error).message),
  });
  const rm = useMutation({ mutationFn: (id: string) => api.remove(id), onSuccess: () => { refresh(); toast('ok', 'Resume deleted.'); setDel(null); }, onError: (e) => toast('err', (e as Error).message) });
  const run = (r: AdminResume, name: 'publish' | 'unpublish' | 'archive' | 'default', query = '') => !act.isPending && act.mutate({ id: r.id, name, query });
  const rows = list.data ?? [];
  const filtered = !!(q || category || visibility);
  return (
    <>
      <div className="row between wrap gap"><h1 className="h2">Resumes</h1><Link className="btn btn-primary" to="/admin/resumes/upload">Upload new</Link></div>
      <div className="toolbar">
        <div className="search"><label className="sr" htmlFor="r-q">Search by title or filename</label><input id="r-q" type="search" placeholder="Search title or filename" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <label className="sr" htmlFor="r-cat">Category</label>
        <select id="r-cat" value={category} onChange={(e) => setCategory(e.target.value)}><option value="">All categories</option>{stats.data?.by_category.map((c) => <option key={c.key} value={c.key}>{c.label} ({c.count})</option>)}</select>
        <label className="sr" htmlFor="r-vis">Status</label>
        <select id="r-vis" value={visibility} onChange={(e) => setVis(e.target.value)}><option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select>
        <label className="sr" htmlFor="r-sort">Sort</label>
        <select id="r-sort" value={sort} onChange={(e) => setSort(e.target.value)}><option value="updated">Recently updated</option><option value="oldest">Oldest first</option><option value="title">Title A–Z</option></select>
      </div>
      {list.isLoading ? <Spinner /> : list.isError ? <p className="error" role="alert">{(list.error as Error).message} <button className="link-btn" onClick={() => list.refetch()}>Retry</button></p>
        : rows.length === 0 ? <Empty title={filtered ? 'No resumes match these filters' : 'No resumes yet'}>{filtered ? <button className="link-btn" onClick={() => { setQ(''); setCategory(''); setVis(''); }}>Clear filters</button> : <Link to="/admin/resumes/upload">Upload your first resume</Link>}</Empty> : (
          <div className="table-wrap"><table className="table">
            <thead><tr><th scope="col">Resume</th><th scope="col">Category</th><th scope="col">File</th><th scope="col">Dates</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead>
            <tbody>{rows.map((r) => (
              <Fragment key={r.id}>
                <tr>
                  <td><strong>{r.title}</strong><br /><span className="mono muted">{r.version}</span></td>
                  <td>{r.category_label}</td>
                  <td className="small">{r.original_filename}<br /><span className="muted">{r.file_type.toUpperCase()} · {fmtBytes(r.file_size_bytes)}</span></td>
                  <td className="small">Uploaded {fmtDate(r.created_at)}<br /><span className="muted">Updated {fmtDate(r.updated_at)}</span></td>
                  <td><Badge>{r.visibility}</Badge>{r.is_default_for_category && <><br /><Badge tone="info">default</Badge></>}</td>
                  <td><div className="actions">
                    <a className="icon-btn" href={api.adminDownloadUrl(r.id)} aria-label={`Download ${r.title}`} title="Download"><Download size={16} /></a>
                    {r.visibility === 'published' ? <button className="icon-btn" aria-label={`Unpublish ${r.title}`} title="Unpublish" onClick={() => run(r, 'unpublish')}><EyeOff size={16} /></button>
                      : <button className="icon-btn" aria-label={`Publish ${r.title}`} title={r.file_type === 'pdf' ? 'Publish' : 'Only PDFs can be published'} disabled={r.file_type !== 'pdf'} onClick={() => run(r, 'publish')}><Eye size={16} /></button>}
                    {r.visibility === 'published' && !r.is_default_for_category && <button className="icon-btn" aria-label={`Make ${r.title} the default for its category`} title="Make default" onClick={() => run(r, 'default')}><Star size={16} /></button>}
                    <button className="icon-btn" aria-label={`Edit ${r.title}`} title="Edit details" onClick={() => setEdit(r)}><Edit3 size={16} /></button>
                    <button className="icon-btn" aria-label={`Replace file for ${r.title}`} title="Upload replacement" onClick={() => setRep(r)}><RefreshCw size={16} /></button>
                    <button className="icon-btn" aria-expanded={hist === r.id} aria-label={`Version history for ${r.title}`} title="Version history" onClick={() => setHist(hist === r.id ? null : r.id)}>{hist === r.id ? <ChevronDown size={16} /> : <HistoryIcon size={16} />}</button>
                    {r.visibility !== 'archived' && <button className="icon-btn" aria-label={`Archive ${r.title}`} title="Archive" onClick={() => run(r, 'archive')}><Archive size={16} /></button>}
                    <button className="icon-btn danger" aria-label={`Delete ${r.title}`} title="Delete" onClick={() => setDel(r)}><Trash2 size={16} /></button>
                  </div></td>
                </tr>
                {hist === r.id && <tr key={`${r.id}-h`}><td colSpan={6}><History id={r.id} /></td></tr>}
              </Fragment>
            ))}</tbody></table></div>
        )}
      <Dialog open={!!edit} onClose={() => setEdit(null)} title="Edit details">{edit && <EditDialog r={edit} onClose={() => setEdit(null)} />}</Dialog>
      <Dialog open={!!rep} onClose={() => setRep(null)} title="Upload replacement">{rep && <ReplaceDialog r={rep} onClose={() => setRep(null)} />}</Dialog>
      <ConfirmDialog open={!!del} danger busy={rm.isPending} title="Delete this resume?" confirmLabel="Delete permanently" message={del ? `“${del.title}” (${del.version}) and its file will be permanently deleted. This cannot be undone. Consider archiving instead.` : ''} onClose={() => setDel(null)} onConfirm={() => del && rm.mutate(del.id)} />
    </>
  );
}
