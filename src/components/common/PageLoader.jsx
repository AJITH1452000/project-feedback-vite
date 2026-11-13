import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { Sparkles } from 'lucide-react';
import { loader } from '../../styles/common.js';

/** Branded Suspense fallback. `fullScreen` for app boot, otherwise inside the shell. */
export default function PageLoader({ fullScreen = false, label = 'Loading workspace…' }) {
  return (
    <Box sx={fullScreen ? loader.screen : loader.page} role="status" aria-live="polite">
      <Box sx={loader.inner}>
        <Box sx={loader.ringWrap}>
          <Box sx={loader.ring} />
          <Box sx={loader.mark}><Sparkles size={22} /></Box>
        </Box>
        <Box>
          <Typography variant="h4" sx={loader.title}>ProFeed</Typography>
          <Typography variant="caption" sx={loader.caption}>{label}</Typography>
        </Box>
        <LinearProgress sx={loader.bar} />
      </Box>
    </Box>
  );
}
