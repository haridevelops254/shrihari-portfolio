import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { PublicLayout } from './components/Layout';
import { Spinner } from './components/ui';
import Home from './pages/Home';
import ProjectPage from './pages/ProjectPage';

const AdminApp = lazy(() => import('./admin/AdminApp'));

export default function App() {
  return (
    <Suspense fallback={<div className="container section"><Spinner /></div>}>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="projects/:slug" element={<ProjectPage />} />
          <Route path="*" element={<div className="container section"><h1 className="display">Page not found</h1><p><a href="/">Go home</a></p></div>} />
        </Route>
      </Routes>
    </Suspense>
  );
}
