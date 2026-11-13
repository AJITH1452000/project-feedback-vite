import { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';
import PageLoader from '../common/PageLoader.jsx';
import { useData } from '../../context/DataContext.jsx';
import { isDemoMode } from '../../services/api.js';
import { shell } from '../../styles/layout.js';

export default function AppLayout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'), { noSsr: true });
  const [navOpen, setNavOpen] = useState(false);
  const { pathname } = useLocation();
  const { status, error, reload, live } = useData();

  useEffect(() => { setNavOpen(false); window.scrollTo({ top: 0 }); }, [pathname]);

  let body;
  if (status === 'error') {
    body = (
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={reload}>Retry</Button>}>
        {error}
      </Alert>
    );
  } else if (status !== 'ready') {
    body = <PageLoader label="Syncing projects, people and reviews…" />;
  } else {
    body = (
      <Suspense fallback={<PageLoader label="Loading page…" />}>
        <Outlet />
      </Suspense>
    );
  }

  return (
    <Box sx={shell.root}>
      <Sidebar isDesktop={isDesktop} mobileOpen={navOpen} onClose={() => setNavOpen(false)} />
      <Box sx={shell.main}>
        <TopBar onOpenNav={() => setNavOpen(true)} />
        <Box component="main" sx={shell.content}>{body}</Box>
        <Box component="footer" sx={shell.footer}>
          <Typography variant="caption">© 2026 ProFeed · Project feedback system</Typography>
          <Typography variant="caption" sx={shell.liveStatus}>
            {!isDemoMode && <Box component="span" sx={shell.liveDot(live === 'live' ? 'success' : 'warning')} />}
            {isDemoMode ? 'Demo mode · sample data' : live === 'live' ? 'Live · real-time updates on' : 'Reconnecting to server…'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
