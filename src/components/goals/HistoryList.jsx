import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { History } from 'lucide-react';
import { EmptyState } from '../common/index.jsx';
import { formatDate } from '../../data/selectors.js';
import { goals as s } from '../../styles/pages.js';

const ROLE_LABEL = { employee: 'Employee', manager: 'Manager', hr: 'HR' };

/** Audit trail: every goal change, approval and piece of feedback. entries: [{ id, d, by, actor, action, note, goal? }] */
export default function HistoryList({ entries, emptyText = 'No activity yet.' }) {
  if (!entries.length) return <EmptyState icon={History} title="No history" description={emptyText} />;
  return (
    <Box component="ol" sx={s.audit}>
      {entries.map((e) => (
        <Box component="li" key={`${e.goal || 'plan'}-${e.id}`} sx={s.auditItem(e.by)}>
          <Box sx={s.auditDot(e.by)} />
          <Box minWidth={0}>
            <Typography variant="subtitle2">
              {e.action}{e.goal ? <Typography component="span" variant="body2" color="text.secondary"> · {e.goal}</Typography> : null}
            </Typography>
            {e.note && <Typography variant="body2" color="text.secondary">{e.note}</Typography>}
            <Typography variant="caption" color="text.secondary">{formatDate(e.d)} · {e.actor || ROLE_LABEL[e.by] || e.by}{e.actor ? ` (${ROLE_LABEL[e.by] || e.by})` : ''}</Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
