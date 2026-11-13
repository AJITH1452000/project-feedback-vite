import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { ArrowRight, BellRing, Clock, Download, FolderKanban, FolderPlus, MessageSquareText, PieChart, Plus, Star, Target, Users } from 'lucide-react';
import { useData } from '../../context/DataContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Pill, ScoreBadge, SectionCard, StatCard, UserAvatar, EmptyState } from '../../components/common/index.jsx';
import QuickReviewDialog from '../../components/review/QuickReviewDialog.jsx';
import {
  avg, daysUntil, downloadJson, f1, findProject, findUser, formatDate, pendingAssignments,
  projectStats, ratingDistribution, reviewAvg, totalAssignments,
} from '../../data/selectors.js';
import { card, grid, page } from '../../styles/common.js';
import { dashboard as s } from '../../styles/pages.js';

const DIST_TONE = { 5: 'success', 4: 'primary', 3: 'info', 2: 'warning', 1: 'error' };

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify } = useToast();
  const { projects, users, reviews } = useData();
  const [dialog, setDialog] = useState({ open: false, userId: null, projectId: null });

  const pending = useMemo(() => pendingAssignments(projects, users, reviews)
    .sort((a, b) => daysUntil(a.project.e) - daysUntil(b.project.e)), [projects, users, reviews]);
  const overallAvg = reviews.length ? avg(reviews.map(reviewAvg)) : 0;
  const coverage = totalAssignments(projects) ? Math.round(((totalAssignments(projects) - pending.length) / totalAssignments(projects)) * 100) : 0;
  const distribution = useMemo(() => ratingDistribution(reviews), [reviews]);
  const recent = useMemo(() => [...reviews].sort((a, b) => b.d.localeCompare(a.d) || b.id - a.id).slice(0, 3), [reviews]);
  const priority = useMemo(() => projects
    .map((p) => ({ ...p, stats: projectStats(p, reviews) }))
    .sort((a, b) => ({ High: 0, Medium: 1, Low: 2 }[a.pr] - { High: 0, Medium: 1, Low: 2 }[b.pr]) || daysUntil(a.e) - daysUntil(b.e))
    .slice(0, 3), [projects, reviews]);

  const rate = (userId = null, projectId = null) => setDialog({ open: true, userId, projectId });
  const exportAudit = () => {
    downloadJson({ exportedAt: new Date().toISOString(), reviews }, `profeed-ratings-${Date.now()}.json`);
    notify('Audit log and developer ratings exported.');
  };

  return (
    <Box sx={page.root}>
      <Box sx={s.hero}>
        <Box sx={s.heroOrb} />
        <Box sx={s.heroOrb2} />
        <Box sx={s.heroBody}>
          <Typography variant="overline" sx={s.heroEyebrow}>People performance · multi-project workspace</Typography>
          <Typography variant="h1" sx={s.heroTitle}>Good to see you, {user?.name?.split(' ').slice(-1)[0] || 'there'} ✨</Typography>
          <Typography sx={s.heroText}>
            {pending.length
              ? `${pending.length} assignments still need a rating. Keep feedback timely while the work is fresh.`
              : 'Every assignment has a current rating. Great job keeping feedback timely.'}
          </Typography>
        </Box>
        <Box sx={s.heroActions}>
          <Button variant="outlined" sx={s.heroGhostBtn} startIcon={<Download size={16} />} onClick={exportAudit}>Export audit</Button>
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => rate()}>Rate developer</Button>
        </Box>
      </Box>

      <Box sx={page.stack}>
        <Box sx={grid.kpis}>
          <StatCard label="Active projects" value={projects.length} icon={FolderKanban} tone="primary" footer={`Across ${new Set(projects.map((p) => p.c)).size} clients`} />
          <StatCard label="Assigned developers" value={users.length} icon={Users} tone="info" footer="Engineers & specialists" />
          <StatCard label="Avg. developer rating" value={f1(overallAvg)} scale="/ 5" icon={Star} tone="success" footer={`From ${reviews.length} reviews`} />
          <StatCard label="Ratings due" value={pending.length} icon={Clock} tone="warning" trend={`${coverage}% covered`} footer="Unrated assignments" />
        </Box>

        <Box sx={grid.two}>
          <SectionCard fill title="Priority projects" subtitle="Highest priority, nearest deadline." icon={Target}
            action={<Pill tone="primary" dot>Top {priority.length}</Pill>}
            footer={<><Button size="small" startIcon={<FolderPlus size={14} />} onClick={() => navigate('/projects?new=1')}>New project</Button>
              <Button size="small" endIcon={<ArrowRight size={14} />} onClick={() => navigate('/projects')}>All {projects.length} projects</Button></>}>
            {priority.map((p) => {
              const days = daysUntil(p.e);
              return (
                <Box key={p.id} sx={[card.listItem, s.row]}>
                  <UserAvatar name={p.n} size={34} />
                  <Box sx={s.itemBody}>
                    <Typography variant="subtitle2" sx={s.itemTitle}>{p.n}</Typography>
                    <Typography variant="caption" sx={s.itemSub}>
                      {p.c} · <Box component="span" sx={days < 30 ? s.status(days < 0 ? 'error' : 'warning') : undefined}>
                        {days >= 0 ? `${days}d left` : `ended ${-days}d ago`}
                      </Box>
                    </Typography>
                  </Box>
                  {p.stats.avg ? <ScoreBadge value={p.stats.avg} /> : <Pill tone="warning">Due</Pill>}
                </Box>
              );
            })}
          </SectionCard>

          <SectionCard fill title="Needs attention" subtitle="Most urgent unrated assignments." icon={BellRing}
            action={<Pill tone={pending.length ? 'warning' : 'success'} dot>{pending.length ? `${pending.length} pending` : 'All clear'}</Pill>}
            footer={<><Typography variant="caption" color="text.secondary">Showing {Math.min(3, pending.length)} of {pending.length}</Typography>
              <Button size="small" startIcon={<BellRing size={14} />} disabled={!pending.length} onClick={() => notify('Review reminders sent to project managers & leads.')}>Send reminders</Button></>}>
            {pending.length ? pending.slice(0, 3).map((item) => {
              const days = daysUntil(item.project.e);
              const tone = days < 0 ? 'error' : days < 30 ? 'warning' : 'info';
              return (
                <Box key={item.id} sx={[card.listItem, s.row]}>
                  <UserAvatar name={item.member.n} size={34} />
                  <Box sx={s.itemBody}>
                    <Typography variant="subtitle2" sx={s.itemTitle}>{item.member.n}</Typography>
                    <Typography variant="caption" sx={s.itemSub}>
                      {item.project.n} · <Box component="span" sx={s.status(tone)}>{days < 0 ? 'overdue' : days < 30 ? `due in ${days}d` : 'checkpoint due'}</Box>
                    </Typography>
                  </Box>
                  <Button size="small" sx={s.rateBtn} variant={tone === 'info' ? 'outlined' : 'contained'} onClick={() => rate(item.member.id, item.project.id)}>Rate</Button>
                </Box>
              );
            }) : <EmptyState title="Nothing pending" description="All assignments have at least one rating." />}
          </SectionCard>
        </Box>

        <Box sx={grid.two}>
          <SectionCard fill title="Recent feedback" subtitle="Latest submitted reviews." icon={MessageSquareText}
            footer={<><Typography variant="caption" color="text.secondary">Showing {recent.length} of {reviews.length}</Typography>
              <Button size="small" endIcon={<ArrowRight size={14} />} onClick={() => navigate('/feedback?tab=history')}>Review history</Button></>}>
            {recent.map((r) => {
              const member = findUser(users, r.u);
              return (
                <Box key={r.id} sx={[card.listItem, s.row]}>
                  <UserAvatar name={member.n} size={34} />
                  <Box sx={s.itemBody}>
                    <Typography variant="subtitle2" sx={s.itemTitle}>{member.n}</Typography>
                    <Typography variant="caption" sx={s.itemSub}>{findProject(projects, r.p).n} · {formatDate(r.d)}</Typography>
                  </Box>
                  <ScoreBadge value={reviewAvg(r)} />
                </Box>
              );
            })}
          </SectionCard>

          <SectionCard fill title="Rating distribution" subtitle="Reviews across the 1–5 rubric." icon={PieChart}
            footer={<><Typography variant="caption" color="text.secondary">Average {f1(overallAvg)} / 5 · {coverage}% rated</Typography>
              <Button size="small" endIcon={<ArrowRight size={14} />} onClick={() => navigate('/reports')}>Full reports</Button></>}>
            {distribution.map((b) => {
              const pct = reviews.length ? (b.count / reviews.length) * 100 : 0;
              return (
                <Box key={b.level} sx={s.distRow}>
                  <Typography variant="body2" fontWeight={600}>{b.level} ★</Typography>
                  <LinearProgress variant="determinate" value={pct} sx={s.distBar(DIST_TONE[b.level])} aria-label={`${b.level} stars: ${b.count}`} />
                  <Typography variant="body2" color="text.secondary" textAlign="right">{b.count}</Typography>
                </Box>
              );
            })}
          </SectionCard>
        </Box>
      </Box>

      <QuickReviewDialog open={dialog.open} initialUserId={dialog.userId} initialProjectId={dialog.projectId} onClose={() => setDialog((d) => ({ ...d, open: false }))} />
    </Box>
  );
}
