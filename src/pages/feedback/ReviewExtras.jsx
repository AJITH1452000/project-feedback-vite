import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { BellRing, GitBranch, History, Plus } from 'lucide-react';
import { Pill, ScoreBadge, SectionCard, UserAvatar, toneForStatus } from '../../components/common/index.jsx';
import ResponsiveTable from '../../components/common/ResponsiveTable.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { RATING_PRINCIPLES } from '../../data/constants.js';
import { formatDate } from '../../data/selectors.js';
import { text } from '../../styles/common.js';
import { feedback as s, people } from '../../styles/pages.js';

const STEPS = [
  { title: 'Manager drafts review', desc: 'Ratings, rationale and verified examples' },
  { title: 'Employee responds', desc: 'Comments, achievements and context' },
  { title: 'Discussion & acknowledgement', desc: 'Acknowledgement confirms discussion, not agreement' },
  { title: 'Finalize & retain history', desc: 'Edits, timestamps and reviewer details stored' },
];

export function ReviewWorkflow({ currentStep = 1 }) {
  const { notify } = useToast();
  return (
    <SectionCard title="Review workflow" subtitle="Keep feedback timely and auditable." icon={GitBranch}>
      <Box>
        {STEPS.map((step, i) => (
          <Box key={step.title} sx={s.step}>
            {i < STEPS.length - 1 && <Box sx={s.stepLine} />}
            <Box sx={s.stepNum(i + 1 === currentStep)}>{i + 1}</Box>
            <Box pt={0.5}>
              <Typography variant="subtitle2">{step.title}</Typography>
              <Typography variant="caption" color="text.secondary">{step.desc}</Typography>
            </Box>
          </Box>
        ))}
      </Box>
      <Button fullWidth variant="outlined" sx={{ mt: 2 }} startIcon={<BellRing size={16} />} onClick={() => notify('Discussion reminder sent to the employee.')}>
        Send discussion reminder
      </Button>
    </SectionCard>
  );
}

export function ReviewHistory({ history, onNewReview }) {
  const columns = [
    { key: 'employee', label: 'Employee', primary: true, render: (h) => (
      <Box sx={people.memberCell}>
        <UserAvatar name={h.employee} size={32} />
        <Box minWidth={0}>
          <Typography variant="subtitle2" sx={text.ellipsis}>{h.employee}</Typography>
          <Typography variant="caption" color="text.secondary">{h.role}</Typography>
        </Box>
      </Box>
    ) },
    { key: 'project', label: 'Project' },
    { key: 'period', label: 'Period' },
    { key: 'date', label: 'Date', render: (h) => formatDate(h.date) },
    { key: 'rating', label: 'Rating', render: (h) => (typeof h.rating === 'number' ? <ScoreBadge value={h.rating} /> : '—') },
    { key: 'status', label: 'Status', render: (h) => <Pill tone={toneForStatus(h.status)} dot>{h.status}</Pill> },
  ];
  return (
    <SectionCard title="Recent project reviews" subtitle={`${history.length} reviews in the audit trail`} icon={History}
      action={<Button variant="contained" startIcon={<Plus size={16} />} onClick={onNewReview}>New review</Button>}>
      <ResponsiveTable columns={columns} rows={history} emptyText="No reviews yet." />
    </SectionCard>
  );
}

export function RatingGuide() {
  return (
    <Box display="flex" flexDirection="column" gap={1.5}>
      <SectionCard title="Rating guide & review principles" subtitle="Use the same observable standards across employees and projects.">
        <Typography variant="body2" color="text.secondary">
          Rate each of the four dimensions on a 1–5 scale. The overall score is the average of the dimensions and is a discussion aid — the final outcome is always a human decision supported by concrete examples.
        </Typography>
      </SectionCard>
      {RATING_PRINCIPLES.map((p) => (
        <Box key={p.level} sx={s.principle(p.level)}>
          <Box sx={s.principleLevel(p.level)}>{p.level}</Box>
          <Box>
            <Typography variant="h4">{p.label}</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>{p.desc}</Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
