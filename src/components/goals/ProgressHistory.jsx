import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { formatDate } from '../../data/selectors.js';
import { goals as s } from '../../styles/pages.js';

/** Progress updates and manager feedback for one goal, newest first. */
export default function ProgressHistory({ updates, max }) {
  const list = [...updates].reverse().slice(0, max || updates.length);
  return (
    <Box>
      <Typography variant="subtitle2" mb={1}>Progress updates</Typography>
      <Box sx={s.history}>
        {list.map((u) => (
          <Box key={u.id} sx={s.historyItem(u.by === 'manager')}>
            <Typography variant="caption" color="text.secondary">
              {formatDate(u.d)} · {u.by === 'manager' ? 'Manager feedback' : `${u.status} · ${u.progress}%`}
            </Typography>
            <Typography variant="body2">{u.note}</Typography>
            {u.evidence && <Typography variant="caption" color="text.secondary" component="div">Evidence: {u.evidence}</Typography>}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
