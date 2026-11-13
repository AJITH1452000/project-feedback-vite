import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import PageLoader from '../components/common/PageLoader.jsx';
import AppLayout from '../components/layout/AppLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { homePathFor } from '../config/navigation.js';

// Every page is code-split and loaded on demand behind a Suspense loader.
const Login = lazy(() => import('../pages/auth/Login.jsx'));
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard.jsx'));
const Projects = lazy(() => import('../pages/projects/Projects.jsx'));
const Feedback = lazy(() => import('../pages/feedback/Feedback.jsx'));
const People = lazy(() => import('../pages/people/People.jsx'));
const Reports = lazy(() => import('../pages/reports/Reports.jsx'));
const Settings = lazy(() => import('../pages/settings/Settings.jsx'));
const MyPerformance = lazy(() => import('../pages/profile/MyPerformance.jsx'));
const NotFound = lazy(() => import('../pages/NotFound.jsx'));

function RequireAuth({ roles, children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homePathFor(user)} replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to={homePathFor(user)} replace /> : children;
}

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? homePathFor(user) : '/login'} replace />;
}

const manager = ['manager'];

export default function App() {
  const { status } = useAuth();
  if (status === 'checking') return <PageLoader fullScreen label="Checking your session…" />;

  return (
    <Suspense fallback={<PageLoader fullScreen />}>
      <Routes>
        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route index element={<HomeRedirect />} />
          <Route path="dashboard" element={<RequireAuth roles={manager}><Dashboard /></RequireAuth>} />
          <Route path="projects" element={<RequireAuth roles={manager}><Projects /></RequireAuth>} />
          <Route path="feedback" element={<RequireAuth roles={manager}><Feedback /></RequireAuth>} />
          <Route path="people" element={<RequireAuth roles={manager}><People /></RequireAuth>} />
          <Route path="reports" element={<RequireAuth roles={manager}><Reports /></RequireAuth>} />
          <Route path="me" element={<RequireAuth roles={['employee']}><MyPerformance /></RequireAuth>} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
