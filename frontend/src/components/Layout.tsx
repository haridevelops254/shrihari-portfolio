import { ChevronDown, Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { profile } from '../data/profile';

const main = [['Projects', '/#projects'], ['Stories', '/#stories'], ['Domains', '/#domains'], ['Education', '/#education'], ['Resumes', '/#resumes'], ['Contact', '/#contact']];
const more = [['About', '/#about'], ['Engineering approach', '/#approach'], ['Pipeline explorer', '/#pipelines'], ['Skills', '/#skills'], ['Coursework', '/#coursework'], ['Achievements', '/#achievements'], ['Internship', '/#internship']];

function ScrollToHash() {
  const { hash, pathname, key } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) { el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); return; }
    }
    window.scrollTo(0, 0);
  }, [hash, pathname, key]);
  return null;
}

function MoreMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', off); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', off); document.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <div className="dropdown" ref={ref}>
      <button type="button" className="nav-link" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen(!open)}>More <ChevronDown size={16} aria-hidden /></button>
      {open && <ul className="dropdown-menu">{more.map(([l, to]) => <li key={to}><Link to={to} onClick={() => setOpen(false)}>{l}</Link></li>)}</ul>}
    </div>
  );
}

export function PublicLayout() {
  const [menu, setMenu] = useState(false);
  const { pathname, hash } = useLocation();
  useEffect(() => setMenu(false), [pathname, hash]);
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className="header">
        <div className="container row between">
          <Link to="/" className="brand" aria-label="Shrihari M V — home">Shrihari <span>M V</span></Link>
          <nav aria-label="Primary" className="nav-desktop">
            {main.map(([l, to]) => <Link key={to} className="nav-link" to={to}>{l}</Link>)}
            <MoreMenu />
          </nav>
          <button type="button" className="icon-btn nav-toggle" aria-expanded={menu} aria-controls="mobile-nav" aria-label={menu ? 'Close menu' : 'Open menu'} onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button>
        </div>
        {menu && (
          <nav id="mobile-nav" aria-label="Mobile" className="nav-mobile">
            {[...main, ...more].map(([l, to]) => <Link key={to} className="nav-link" to={to}>{l}</Link>)}
          </nav>
        )}
      </header>
      <ScrollToHash />
      <main id="main" tabIndex={-1}><Outlet /></main>
      <footer className="footer">
        <div className="container row between wrap gap">
          <p>© {new Date().getFullYear()} {profile.name}. Built with Vite, React, TypeScript and FastAPI.</p>
          <p className="row gap"><a href={profile.github} target="_blank" rel="noreferrer">GitHub</a><a href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn</a><a href={`mailto:${profile.email}`}>Email</a></p>
        </div>
      </footer>
    </>
  );
}
