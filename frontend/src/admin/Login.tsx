import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Field } from '../components/ui';
import { api } from '../lib/api';
import { fieldErrors, loginSchema, type FieldErrors } from '../lib/schemas';
import { useMe } from './AdminApp';

export default function Login() {
  const [v, setV] = useState({ email: '', password: '' });
  const [err, setErr] = useState<FieldErrors>({});
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const nav = useNavigate();
  const me = useMe();
  useEffect(() => { document.title = 'Admin login'; if (me.data) nav('/admin', { replace: true }); }, [me.data, nav]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const r = loginSchema.safeParse(v);
    if (!r.success) { setErr(fieldErrors(r.error)); return; }
    setErr({}); setMsg(''); setBusy(true);
    try { const s = await api.login(r.data.email, r.data.password); qc.setQueryData(['me'], s); nav('/admin', { replace: true }); }
    catch (x) { setMsg((x as Error).message); setV((p) => ({ ...p, password: '' })); }
    finally { setBusy(false); }
  };
  return (
    <div className="login-wrap">
      <form className="card login" onSubmit={submit} noValidate>
        <p className="eyebrow">Private area</p><h1 className="h2">Admin login</h1>
        <Field label="Email" error={err.email}>{(p) => <input {...p} type="email" autoComplete="username" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} />}</Field>
        <Field label="Password" error={err.password}>{(p) => <input {...p} type="password" autoComplete="current-password" value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} />}</Field>
        {msg && <p className="error" role="alert">{msg}</p>}
        <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <p className="small"><Link to="/">← Back to portfolio</Link></p>
      </form>
    </div>
  );
}
