import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { ChevronDown, ChevronUp, GitPullRequestArrow } from 'lucide-react';
import { Pill, ScoreBadge, UserAvatar } from '../common/index.jsx';
import { PRIORITY_TONE, STATUS_TONE, isActive } from '../../data/goals.js';
import { daysUntil, formatDate, ratingLabel } from '../../data/selectors.js';
import { text } from '../../styles/common.js';
import { goals as s } from '../../styles/pages.js';
import HistoryList from './HistoryList.jsx';
import ProgressHistory from './ProgressHistory.jsx';

const FIELD_LABEL = { title: 'Title', category: 'Category', desc: 'Description', metric: 'KPI', target: 'Target', priority: 'Priority', weight: 'Weightage', start: 'Start', due: 'Target date', notes: 'Comments' };
const fmt = (key, value) => (key === 'weight' ? `${value}%` : key === 'start' || key === 'due' ? formatDate(value) : value || '—');
const progressTone = (p) => (p >= 70 ? 'success' : p >= 40 ? 'info' : 'warning');

/** One goal with status, KPI/target, progress, review notes, change requests, ratings and an expandable history. */
export default function GoalCard({ goal: g, owner, actions, showSelf, showManager }) {
  const [open, setOpen] = useState(false);
  const overdue = isActive(g) && g.status !== 'Completed' && daysUntil(g.due) < 0;
  const latest = g.updates[g.updates.length - 1];

  return (
    <Box sx={s.item} data-status={g.status}>
      <Box sx={s.itemHead}>
        <Box minWidth={0} flex="1 1 260px">
          {owner && (
            <Box display="flex" alignItems="center" gap={0.75} mb={0.5}>
              <UserAvatar name={owner.n} size={22} />
              <Typography variant="caption" color="text.secondary" sx={text.ellipsis}>{owner.n} · {owner.t}</Typography>
            </Box>
          )}
          <Typography variant="subtitle1" sx={s.itemTitle}>{g.title}</Typography>
        </Box>
        <Box sx={s.pills}>
          <Pill tone={STATUS_TONE[g.status]} dot>{g.status}</Pill>
          <Pill tone={PRIORITY_TONE[g.priority]}>{g.priority}</Pill>
          <Pill tone="primary">{g.weight}%</Pill>
        </Box>
      </Box>

      <Box sx={s.meta}>
        {[
          ['KPI', g.metric],
          ['Target', g.target],
          ['Category', g.category],
          ['Timeline', <Box component="span" key="t" sx={overdue ? text.error : undefined}>{formatDate(g.start)} → {formatDate(g.due)}{overdue ? ' · overdue' : ''}</Box>],
        ].map(([label, value]) => (
          <Box key={label} sx={s.metaCell}>
            <Typography variant="caption" color="text.secondary" component="div">{label}</Typography>
            <Typography variant="subtitle2" component="div" sx={s.wrap}>{value}</Typography>
          </Box>
        ))}
      </Box>

      {isActive(g) && (
        <Box sx={s.progressRow}>
          <LinearProgress variant="determinate" value={g.progress} sx={s.progressBar(g.status === 'On Hold' ? 'warning' : progressTone(g.progress))} aria-label={`Completion ${g.progress}%`} />
          <Typography variant="subtitle2" textAlign="right">{g.progress}%</Typography>
        </Box>
      )}

      {['Changes Requested', 'Rejected'].includes(g.status) && g.reviewNote && (
        <Typography variant="body2" sx={s.reviewNote(g.status === 'Rejected' ? 'error' : 'secondary')}>
          <b>{g.status === 'Rejected' ? 'Rejected' : 'Changes requested'}:</b> {g.reviewNote}
        </Typography>
      )}
      {g.status === 'Approved' && g.reviewNote && (
        <Typography variant="body2" sx={s.reviewNote('primary')}><b>Manager note:</b> {g.reviewNote}</Typography>
      )}

      {g.change && (
        <Box sx={s.changeBox}>
          <Typography variant="subtitle2" display="flex" alignItems="center" gap={0.75}><GitPullRequestArrow size={15} /> Change request · {formatDate(g.change.d)}</Typography>
          {Object.entries(g.change.fields).map(([k, v]) => (
            <Typography key={k} variant="body2"><b>{FIELD_LABEL[k] || k}:</b> {fmt(k, g[k])} → <b>{fmt(k, v)}</b></Typography>
          ))}
          <Typography variant="caption" color="text.secondary">Reason: {g.change.reason}</Typography>
        </Box>
      )}

      {latest && !open && (
        <Typography variant="body2" sx={s.lastCheckIn}>
          <b>{latest.by === 'manager' ? 'Manager feedback' : `Latest update · ${latest.status}`} · {formatDate(latest.d)}:</b> {latest.note}
        </Typography>
      )}

      {(showSelf || showManager) && (g.selfRating || g.managerRating) && (
        <Box sx={s.ratings}>
          {showSelf && g.selfRating && (
            <Box sx={s.ratingCell}>
              <Typography variant="caption" color="text.secondary">Self rating</Typography>
              <ScoreBadge value={g.selfRating} suffix=" / 5" />
              {g.selfComment && <Typography variant="body2">{g.selfComment}</Typography>}
            </Box>
          )}
          {showManager && g.managerRating && (
            <Box sx={s.ratingCell}>
              <Typography variant="caption" color="text.secondary">Manager rating · {ratingLabel(g.managerRating)}</Typography>
              <ScoreBadge value={g.managerRating} suffix=" / 5" />
              {g.managerComment && <Typography variant="body2">{g.managerComment}</Typography>}
              {g.improvement && <Typography variant="body2" color="text.secondary"><b>Improve:</b> {g.improvement}</Typography>}
            </Box>
          )}
        </Box>
      )}

      <Collapse in={open} unmountOnExit>
        <Box sx={s.details}>
          {g.desc && <Box><Typography variant="caption" color="text.secondary">Description</Typography><Typography variant="body2">{g.desc}</Typography></Box>}
          {g.notes && <Box><Typography variant="caption" color="text.secondary">Additional comments</Typography><Typography variant="body2">{g.notes}</Typography></Box>}
          {g.updates.length > 0 && <ProgressHistory updates={g.updates} />}
          <Box>
            <Typography variant="subtitle2" mb={1}>Goal history</Typography>
            <HistoryList entries={[...g.history].reverse()} />
          </Box>
        </Box>
      </Collapse>

      <Box sx={s.actions}>
        <Button size="small" color="inherit" onClick={() => setOpen((v) => !v)} endIcon={open ? <ChevronUp size={15} /> : <ChevronDown size={15} />} sx={s.detailsBtn}>
          {open ? 'Hide details' : 'Details & history'}
        </Button>
        {actions}
      </Box>
    </Box>
  );
}
