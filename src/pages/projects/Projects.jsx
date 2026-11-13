import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Building2, CalendarDays, FolderKanban, FolderPlus, Search, Star } from 'lucide-react';
import ProjectDialog from '../../components/project/ProjectDialog.jsx';
import { useData } from '../../context/DataContext.jsx';
import {
  EmptyState, FilterChips, PageHeader, Pill, ScoreBadge, UserAvatar, toneForPriority,
} from '../../components/common/index.jsx';
import QuickReviewDialog from '../../components/review/QuickReviewDialog.jsx';
import { findUser, formatDate, projectStats, projectTimeline } from '../../data/selectors.js';
import { grid, page, text } from '../../styles/common.js';
import { projects as s } from '../../styles/pages.js';

const PRIORITIES = ['All', 'High', 'Medium', 'Low'];

export default function Projects() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { projects, users, reviews } = useData();
  const [priority, setPriority] = useState('All');
  const [dialog, setDialog] = useState({ open: false });
  const [createOpen, setCreateOpen] = useState(params.get('new') === '1');
  const query = params.get('q') || '';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects
      .filter((p) => priority === 'All' || p.pr === priority)
      .filter((p) => !q || `${p.n} ${p.c}`.toLowerCase().includes(q) || p.t.some((id) => findUser(users, id).n.toLowerCase().includes(q)));
  }, [projects, users, priority, query]);

  const setQuery = (value) => setParams(value ? { q: value } : {}, { replace: true });

  return (
    <Box sx={page.root}>
      <PageHeader
        eyebrow="Delivery portfolio"
        title="Projects & delivery teams"
        description="Staff allocations, timeline health and review coverage for every client engagement."
        actions={<>
          <Button variant="outlined" startIcon={<Star size={16} />} onClick={() => setDialog({ open: true })}>Rate developer</Button>
          <Button variant="contained" startIcon={<FolderPlus size={16} />} onClick={() => setCreateOpen(true)}>New project</Button>
        </>}
      />

      <Box sx={s.toolbar}>
        <FilterChips label="Filter by priority" options={PRIORITIES.map((p) => ({ value: p, label: p === 'All' ? `All (${projects.length})` : p }))} value={priority} onChange={setPriority} />
        <TextField
          size="small" placeholder="Search project, client or member" value={query} onChange={(e) => setQuery(e.target.value)} sx={s.search}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> }}
          inputProps={{ 'aria-label': 'Search projects' }}
        />
      </Box>

      {filtered.length ? (
        <Box sx={grid.cards}>
          {filtered.map((p, index) => {
            const stats = projectStats(p, reviews);
            const timeline = projectTimeline(p);
            return (
              <Box key={p.id} component="article" sx={s.card}>
                <Box sx={s.cardHead}>
                  <Box display="flex" gap={1.5} minWidth={0}>
                    <Box sx={s.projectIcon(index)}><FolderKanban size={20} /></Box>
                    <Box minWidth={0}>
                      <Typography variant="h4" sx={text.ellipsis}>{p.n}</Typography>
                      <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                        <Building2 size={12} /> {p.c}
                      </Typography>
                    </Box>
                  </Box>
                  <Pill tone={toneForPriority(p.pr)} dot>{p.pr}</Pill>
                </Box>

                <Box sx={s.meta}>
                  <Box component="span" sx={s.metaItem}><CalendarDays size={12} /> {formatDate(p.s)} → {formatDate(p.e)}</Box>
                  {stats.avg ? <ScoreBadge value={stats.avg} suffix=" avg" /> : <Pill tone="warning">No ratings yet</Pill>}
                </Box>

                <Box>
                  <Box sx={s.progressHead}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Timeline</Typography>
                    <Typography variant="caption" fontWeight={700}>{timeline}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={timeline} sx={s.progress} color={timeline >= 90 ? 'warning' : 'primary'} />
                  <Box sx={s.progressHead} mt={1.25}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Review coverage</Typography>
                    <Typography variant="caption" fontWeight={700}>{Math.round(stats.coverage * 100)}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={stats.coverage * 100} sx={s.progress} color="success" />
                </Box>

                <Box>
                  <Typography variant="overline" component="div" sx={s.rosterTitle}>Team ({p.t.length})</Typography>
                  <Box sx={s.roster}>
                    {p.t.map((id) => {
                      const member = findUser(users, id);
                      const count = stats.reviews.filter((r) => r.u === id).length;
                      return (
                        <Box key={id} sx={s.member}>
                          <UserAvatar name={member.n} size={30} />
                          <Box sx={s.memberText}>
                            <Typography variant="subtitle2" sx={text.ellipsis}>{member.n}</Typography>
                            <Typography variant="caption" color="text.secondary" component="div" sx={text.ellipsis}>{member.t}</Typography>
                          </Box>
                          <Box sx={s.memberActions}>
                            <Pill tone={count ? 'success' : 'warning'}>{count ? `${count} done` : 'Pending'}</Pill>
                            <Button size="small" variant="outlined" sx={s.reviewBtn} onClick={() => navigate(`/feedback?employee=${id}&project=${p.id}`)}>Review</Button>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      ) : (
        <EmptyState title="No projects match" description="Try another priority, clear your search, or create a new project."
          action={<Box display="flex" gap={1} flexWrap="wrap" justifyContent="center">
            <Button onClick={() => { setPriority('All'); setQuery(''); }}>Clear filters</Button>
            <Button variant="contained" startIcon={<FolderPlus size={16} />} onClick={() => setCreateOpen(true)}>New project</Button>
          </Box>} />
      )}

      <QuickReviewDialog open={dialog.open} onClose={() => setDialog({ open: false })} />
      <ProjectDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => { setPriority('All'); setQuery(''); }} />
    </Box>
  );
}
