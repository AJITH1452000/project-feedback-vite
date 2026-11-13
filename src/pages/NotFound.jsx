import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { homePathFor } from '../config/navigation.js';
import { notFound as s } from '../styles/pages.js';

export default function NotFound() {
  const navigate = useNavigate();
  const { user } = useAuth();
  return (
    <Box sx={s.root}>
      <Box>
        <Typography sx={s.code}>404</Typography>
        <Typography variant="h2" mt={1}>Page not found</Typography>
        <Typography variant="body2" color="text.secondary" mt={1} mb={3}>The page you’re looking for doesn’t exist or you don’t have access.</Typography>
        <Button variant="contained" startIcon={<ArrowLeft size={16} />} onClick={() => navigate(homePathFor(user))}>Back to workspace</Button>
      </Box>
    </Box>
  );
}
