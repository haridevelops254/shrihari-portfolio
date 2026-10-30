import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, LayoutDashboard, LogOut, Settings, Upload } from 'lucide-react';
import { useEffect } from 'react';
import { Link, NavLink, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import { Spinner, ToastProvider } from '../components/ui';
import { ApiError, api } from '../lib/api';
import Dashboard from './Dashboard';
import Login from './Login';
import ResumesPage from './ResumesPage';
import SettingsPage from './SettingsPage';
import UploadPage from './UploadPage';

export const useMe = () => useQuery({
  queryKey: ['me'], retry: false, staleTime: 60_000,
  queryFn: async () => { try { return await api.me(); } catch (e) { if (e instanceof ApiError && e.status === 401) return null; throw e; } },
});

function Shell() {
  const me = useMe();
  const qc = useQueryClient();
  const nav = useNavigate();
  useEffect(() => {
    const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex,nofollow'; document.head.appendChild(m);
    document.title = 'Admin — Shrihari portfolio';
    return () => { m.remove(); };
  }, []);
  if (me.isLoading) return <div className="container section"><Spinner label="Checking session…" /></div>;
  if (me.isError) return <div className="container section"><p className="notice">Cannot reach the API. {(me.error as Error).message}</p><button className="btn btn-secondary" onClick={() => me.refetch()}>Retry</button></div>;
  if (!me.data) return <Navigate to="/admin/login" replace />;
  const logout = async () => { try { await api.logout(); } finally { qc.clear(); nav('/admin/login'); } };
  const link = ({ isActive }: { isActive: boolean }) => (isActive ? 'side-link active' : 'side-link');
  return (
    <div className="admin">
      <aside className="sidebar" aria-label="Admin navigation">
        <p className="brand">Admin <span className="badge badge-warn">private</span></p>
        <nav>
          <NavLink end to="/admin" className={link}><LayoutDashboard size={16} aria-hidden /> Overview</NavLink>
          <NavLink to="/admin/resumes" end className={link}><FileText size={16} aria-hidden /> Resumes</NavLink>
          <NavLink to="/admin/resumes/upload" className={link}><Upload size={16} aria-hidden /> Upload</NavLink>
          <NavLink to="/admin/settings" className={link}><Settings size={16} aria-hidden /> Settings</NavLink>
        </nav>
        <div className="side-foot"><p className="muted small">{me.data.email}</p><Link to="/" className="small">View public site</Link>
          <button type="button" className="btn btn-ghost btn-sm" onClick={logout}><LogOut size={14} aria-hidden /> Log out</button></div>
      </aside>
      <div className="admin-main"><Outlet /></div>
    </div>
  );
}

export default function AdminApp() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route element={<Shell />}>
          <Route index element={<Dashboard />} />
          <Route path="resumes" element={<ResumesPage />} />
          <Route path="resumes/upload" element={<UploadPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}
