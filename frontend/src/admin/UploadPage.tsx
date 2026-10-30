import { useQueryClient } from '@tanstack/react-query';
import { UploadCloud } from 'lucide-react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Field, useToast } from '../components/ui';
import { createResume } from '../lib/api';
import { CATEGORIES } from '../lib/categories';
import { fieldErrors, uploadSchema, type FieldErrors } from '../lib/schemas';
import { cx, fmtBytes } from '../lib/utils';

const MAX = 10 * 1024 * 1024;
const empty = { title: '', category: 'general_software', customCategory: '', version: 'v1', description: '' };

export default function UploadPage() {
  const [v, setV] = useState(empty);
  const [file, setFile] = useState<File | null>(null);
  const [isDefault, setDefault] = useState(false);
  const [err, setErr] = useState<FieldErrors>({});
  const [progress, setProgress] = useState<number | null>(null);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const busy = useRef(false);
  const nav = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const isPdf = file?.name.toLowerCase().endsWith('.pdf') ?? false;

  const pick = (f: File | undefined | null) => {
    if (!f) return;
    const ext = f.name.toLowerCase().split('.').pop();
    if (ext !== 'pdf' && ext !== 'docx') { setErr((e) => ({ ...e, file: 'Only .pdf and .docx files are accepted.' })); setFile(null); return; }
    if (f.size > MAX) { setErr((e) => ({ ...e, file: `File is ${fmtBytes(f.size)}; the limit is 10 MB.` })); setFile(null); return; }
    if (f.size === 0) { setErr((e) => ({ ...e, file: 'That file is empty.' })); setFile(null); return; }
    setErr((e) => { const { file: _f, ...rest } = e; return rest; });
    setFile(f);
    if (!v.title) setV((p) => ({ ...p, title: f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ') }));
  };

  const submit = async (publish: boolean) => {
    if (busy.current) return;
    const r = uploadSchema.safeParse(v);
    const errs: FieldErrors = r.success ? {} : fieldErrors(r.error);
    if (!file) errs.file = errs.file ?? 'Choose a file to upload.';
    if (publish && file && !isPdf) errs.file = 'Only PDF files can be published. Save the DOCX as a draft instead.';
    setErr(errs);
    if (Object.keys(errs).length || !r.success || !file) return;
    busy.current = true; setProgress(0);
    const f = new FormData();
    f.set('title', r.data.title); f.set('category', r.data.category); f.set('version', r.data.version);
    if (r.data.category === 'custom') f.set('custom_category', r.data.customCategory ?? '');
    if (r.data.description) f.set('description', r.data.description);
    f.set('publish', String(publish)); f.set('is_default_for_category', String(publish && isDefault)); f.set('file', file);
    try {
      await createResume(f, setProgress);
      await qc.invalidateQueries({ queryKey: ['admin-resumes'] }); qc.invalidateQueries({ queryKey: ['stats'] }); qc.invalidateQueries({ queryKey: ['public-resumes'] });
      toast('ok', publish ? 'Resume published.' : 'Draft saved.');
      nav('/admin/resumes');
    } catch (x) { toast('err', (x as Error).message); setErr((e) => ({ ...e, form: (x as Error).message })); }
    finally { busy.current = false; setProgress(null); }
  };
  const disabled = progress !== null;
  return (
    <>
      <h1 className="h2">Upload a resume</h1>
      <form className="card narrow" onSubmit={(e) => e.preventDefault()} noValidate>
        <div className={cx('drop', drag && 'drag', err.file && 'bad')} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}>
          <UploadCloud aria-hidden />
          <p>{file ? <><strong>{file.name}</strong> · {fmtBytes(file.size)} · {isPdf ? 'PDF' : 'DOCX (private archive only)'}</> : 'Drag a file here, or choose one'}</p>
          <label className="btn btn-secondary btn-sm" htmlFor="file-in">Choose file</label>
          <input id="file-in" ref={input} className="sr" type="file" accept=".pdf,.docx,application/pdf" disabled={disabled} onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
          <p className="hint">PDF (publishable) or DOCX (private archive). Max 10 MB. Files are validated again on the server.</p>
          {err.file && <p className="error" role="alert">{err.file}</p>}
        </div>
        <Field label="Display title" error={err.title}>{(p) => <input {...p} value={v.title} maxLength={150} onChange={(e) => setV({ ...v, title: e.target.value })} />}</Field>
        <div className="grid g2">
          <Field label="Career category" error={err.category}>{(p) => <select {...p} value={v.category} onChange={(e) => setV({ ...v, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</select>}</Field>
          <Field label="Version" error={err.version} hint="e.g. v1, v2, 2026-10">{(p) => <input {...p} value={v.version} maxLength={40} onChange={(e) => setV({ ...v, version: e.target.value })} />}</Field>
        </div>
        {v.category === 'custom' && <Field label="Custom category name" error={err.customCategory}>{(p) => <input {...p} value={v.customCategory} maxLength={80} onChange={(e) => setV({ ...v, customCategory: e.target.value })} />}</Field>}
        <Field label="Short description (optional)" error={err.description}>{(p) => <textarea {...p} rows={3} maxLength={1000} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} />}</Field>
        <label className="check"><input type="checkbox" checked={isDefault} onChange={(e) => setDefault(e.target.checked)} /> Make this the default for its category (applies when published)</label>
        {progress !== null && <div className="progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress"><div style={{ width: `${progress}%` }} /></div>}
        {err.form && <p className="error" role="alert">{err.form}</p>}
        <div className="row gap wrap">
          <button type="button" className="btn btn-secondary" disabled={disabled} onClick={() => submit(false)}>Save draft</button>
          <button type="button" className="btn btn-primary" disabled={disabled} onClick={() => submit(true)}>Publish</button>
          <button type="button" className="btn btn-ghost" disabled={disabled} onClick={() => nav('/admin/resumes')}>Cancel</button>
        </div>
      </form>
    </>
  );
}
