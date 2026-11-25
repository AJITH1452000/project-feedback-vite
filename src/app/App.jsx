import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { RefreshCw, ServerCrash } from 'lucide-react';
import PageLoader from '../components/common/PageLoader.jsx';
import { loader, text } from '../styles/common.js';
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
const Goals = lazy(() => import('../pages/goals/Goals.jsx'));
const HrReview = lazy(() => import('../pages/hr/HrReview.jsx'));
const Cycles = lazy(() => import('../pages/cycles/Cycles.jsx'));
const Users = lazy(() => import('../pages/users/Users.jsx'));
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

/** Shown when the API server cannot be reached at start-up. */
function ServerUnavailable({ message, onRetry }) {
  return (
    <Box sx={loader.screen} role="alert">
      <Box sx={loader.inner} maxWidth={440}>
        <Box sx={loader.mark}><ServerCrash size={22} /></Box>
        <Typography variant="h3">Can’t reach the ProFeed server</Typography>
        <Typography variant="body2" color="text.secondary">
          {message || 'The API server is not responding.'} Start everything with <Box component="code" sx={text.code}>npm run dev</Box>, then try again.
        </Typography>
        <Button variant="contained" startIcon={<RefreshCw size={16} />} onClick={onRetry}>Try again</Button>
      </Box>
    </Box>
  );
}

export default function App() {
  const { status, error, retry } = useAuth();
  if (status === 'checking') return <PageLoader fullScreen label="Connecting to the server…" />;
  if (status === 'offline') return <ServerUnavailable message={error} onRetry={retry} />;

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
          <Route path="goals" element={<Goals />} />
          <Route path="goals/:userId" element={<RequireAuth roles={['manager', 'hr']}><Goals /></RequireAuth>} />
          <Route path="hr-review" element={<RequireAuth roles={['hr']}><HrReview /></RequireAuth>} />
          <Route path="cycles" element={<RequireAuth roles={['hr']}><Cycles /></RequireAuth>} />
          <Route path="users" element={<RequireAuth roles={['manager', 'hr']}><Users /></RequireAuth>} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
