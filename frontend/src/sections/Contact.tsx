import { useState } from 'react';
import { Field, Section } from '../components/ui';
import { profile } from '../data/profile';
import { contactSchema, fieldErrors, type FieldErrors } from '../lib/schemas';

export function Contact() {
  const [v, setV] = useState({ name: '', email: '', subject: '', message: '' });
  const [err, setErr] = useState<FieldErrors>({});
  const [status, setStatus] = useState('');
  const [copied, setCopied] = useState(false);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = contactSchema.safeParse(v);
    if (!r.success) { setErr(fieldErrors(r.error)); setStatus(''); return; }
    setErr({});
    const body = `${r.data.message}\n\n— ${r.data.name} (${r.data.email})`;
    window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(r.data.subject)}&body=${encodeURIComponent(body)}`;
    setStatus('Your email app should now open with this message prefilled. Nothing has been sent until you press Send there. If nothing opened, copy my address below.');
  };
  const copy = async () => { try { await navigator.clipboard.writeText(profile.email); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { setStatus(`Copy failed. My email is ${profile.email}`); } };
  return (
    <Section id="contact" eyebrow="Contact" title="Get in touch" intro="This form opens your email app; there is no server-side email service.">
      <div className="grid g2">
        <form className="card" onSubmit={submit} noValidate>
          <Field label="Name" error={err.name}>{(p) => <input {...p} autoComplete="name" value={v.name} onChange={set('name')} />}</Field>
          <Field label="Email" error={err.email}>{(p) => <input {...p} type="email" autoComplete="email" value={v.email} onChange={set('email')} />}</Field>
          <Field label="Subject" error={err.subject}>{(p) => <input {...p} value={v.subject} onChange={set('subject')} />}</Field>
          <Field label="Message" error={err.message}>{(p) => <textarea {...p} rows={5} value={v.message} onChange={set('message')} />}</Field>
          <button type="submit" className="btn btn-primary">Open in email app</button>
          {status && <p className="notice" role="status">{status}</p>}
        </form>
        <div className="card"><h3 className="h3">Direct links</h3>
          <ul className="plain"><li><a href={`mailto:${profile.email}`}>{profile.email}</a> <button type="button" className="link-btn" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button></li>
            <li><a href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn</a></li><li><a href={profile.github} target="_blank" rel="noreferrer">GitHub</a></li></ul></div>
      </div>
    </Section>
  );
}
