import { useState } from 'react';
import { Field, useToast } from '../components/ui';
import { api } from '../lib/api';
import { fieldErrors, passwordSchema, type FieldErrors } from '../lib/schemas';
import { useMe } from './AdminApp';

export default function SettingsPage() {
  const me = useMe();
  const toast = useToast();
  const [v, setV] = useState({ current: '', next: '', confirm: '' });
  const [err, setErr] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const r = passwordSchema.safeParse(v);
    if (!r.success) { setErr(fieldErrors(r.error)); return; }
    setErr({}); setBusy(true);
    try { await api.changePassword(r.data.current, r.data.next); setV({ current: '', next: '', confirm: '' }); toast('ok', 'Password changed. Other sessions were signed out.'); }
    catch (x) { toast('err', (x as Error).message); } finally { setBusy(false); }
  };
  return (
    <>
      <h1 className="h2">Settings</h1>
      <p className="muted">Signed in as {me.data?.email}. There is no public registration; additional admins are created only with the server CLI.</p>
      <form className="card narrow" onSubmit={submit} noValidate>
        <h2 className="h3">Change password</h2>
        <Field label="Current password" error={err.current}>{(p) => <input {...p} type="password" autoComplete="current-password" value={v.current} onChange={(e) => setV({ ...v, current: e.target.value })} />}</Field>
        <Field label="New password" error={err.next} hint="At least 12 characters.">{(p) => <input {...p} type="password" autoComplete="new-password" value={v.next} onChange={(e) => setV({ ...v, next: e.target.value })} />}</Field>
        <Field label="Confirm new password" error={err.confirm}>{(p) => <input {...p} type="password" autoComplete="new-password" value={v.confirm} onChange={(e) => setV({ ...v, confirm: e.target.value })} />}</Field>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Update password'}</button>
      </form>
    </>
  );
}
