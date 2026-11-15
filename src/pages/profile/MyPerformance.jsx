import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { FolderKanban, MessageSquareText, ShieldAlert, Star, TrendingUp } from 'lucide-react';
import { EmptyState, Pill, ScoreBadge, SectionCard, StatCard, UserAvatar } from '../../components/common/index.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { CORE_DIMENSIONS } from '../../data/constants.js';
import { avg, dimensionAverages, f1, findProject, formatDate, ratingLabel, reviewAvg } from '../../data/selectors.js';
import { grid, page, text } from '../../styles/common.js';
import { dashboard as ds, profile as s } from '../../styles/pages.js';

export default function MyPerformance() {
  const { user } = useAuth();
  const { reviews, projects } = useData();
  const mine = reviews.filter((r) => r.u === user.userId).sort((a, b) => b.d.localeCompare(a.d));
  const myAvg = mine.length ? avg(mine.map(reviewAvg)) : 0;
  const myFlags = mine.reduce((n, r) => n + r.f.length, 0);
  const myProjects = projects.filter((p) => p.t.includes(user.userId));
  const dims = dimensionAverages(mine);

  return (
    <Box sx={page.root}>
      <Box sx={s.hero}>
        <UserAvatar name={user.name} size={72} />
        <Box flex={1} minWidth={0}>
          <Typography variant="overline" color="primary.main">My performance profile</Typography>
          <Typography variant="h1">{user.name}</Typography>
          <Typography variant="body2" color="text.secondary">{user.title} · {user.track || 'Member'} track · {myProjects.length} active project{myProjects.length === 1 ? '' : 's'}</Typography>
        </Box>
        {mine.length > 0 && <Pill tone={myAvg >= 4 ? 'success' : myAvg >= 3 ? 'info' : 'warning'} dot>{ratingLabel(myAvg)}</Pill>}
      </Box>

      <Box sx={page.stack}>
        <Box sx={grid.kpis}>
          <StatCard label="Reviews received" value={mine.length} icon={MessageSquareText} tone="primary" footer="Continuous feedback" />
          <StatCard label="Overall rating" value={mine.length ? f1(myAvg) : '—'} scale="/ 5" icon={Star} tone="success" footer={mine.length ? ratingLabel(myAvg) : 'Awaiting first review'} />
          <StatCard label="Active projects" value={myProjects.length} icon={FolderKanban} tone="info" footer={myProjects.map((p) => p.n).join(', ') || 'None assigned'} />
          <StatCard label="Focus areas / flags" value={myFlags} icon={ShieldAlert} tone={myFlags ? 'warning' : 'success'} footer={myFlags ? 'Improvement identified' : 'No obstacles noted'} />
        </Box>

        <Box sx={grid.mainAside}>
          <SectionCard title="Evaluations & feedback stream" subtitle="Manager feedback shared about your deliverables." icon={MessageSquareText}>
            {mine.length ? (
              <Box sx={s.stream}>
                {mine.map((r) => {
                  const project = findProject(projects, r.p);
                  return (
                    <Box key={r.id} sx={s.item}>
                      <Box sx={s.itemHead}>
                        <Box minWidth={0}>
                          <Typography variant="subtitle1" sx={text.ellipsis}>{project.n}</Typography>
                          <Typography variant="caption" color="text.secondary">{project.c} · {r.by} · {formatDate(r.d)}</Typography>
                        </Box>
                        <ScoreBadge value={reviewAvg(r)} suffix=" / 5" />
                      </Box>
                      <Typography variant="body2" sx={[text.quote, s.note]}>{r.note}</Typography>
                      {r.q?.development && (
                        <Typography variant="body2" color="text.secondary" sx={s.note}><b>Next steps:</b> {r.q.development}</Typography>
                      )}
                      <Box sx={s.dims}>
                        {(r.s
                          ? CORE_DIMENSIONS.map((d, i) => [d.name, `${r.s[i]} / 5`])
                          : [['Review type', r.q?.type], ['Period', r.q?.period], ['Delivery & quality', r.q?.delivery], ['Collaboration', r.q?.collaboration]]
                        ).map(([label, value]) => (
                          <Box key={label} sx={s.dim}>
                            <Typography variant="caption" color="text.secondary" component="div" sx={text.ellipsis}>{label}</Typography>
                            <Typography variant="subtitle2">{value || '—'}</Typography>
                          </Box>
                        ))}
                      </Box>
                      {r.q?.nextDate && (
                        <Typography variant="caption" color="text.secondary" display="block" mt={1.25}>Next review: {formatDate(r.q.nextDate)}</Typography>
                      )}
                      {r.f.length > 0 && (
                        <Box display="flex" gap={0.75} flexWrap="wrap" mt={1.5}>
                          {r.f.map((flag) => <Pill key={flag} tone="warning">{flag}</Pill>)}
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
            ) : <EmptyState title="No feedback yet" description="Reviews appear here as evaluations conclude." />}
          </SectionCard>

          <SectionCard title="Competency snapshot" subtitle="Your average per rubric dimension." icon={TrendingUp}>
            <Box display="flex" flexDirection="column" gap={2}>
              {CORE_DIMENSIONS.map((d, i) => (
                <Box key={d.id} sx={ds.dimRow}>
                  <Box sx={ds.dimHead}>
                    <Typography variant="subtitle2">{d.name}</Typography>
                    <Typography variant="subtitle2" color="primary.main">{mine.length ? f1(dims[i]) : '—'}</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={mine.length ? (dims[i] / 5) * 100 : 0} sx={ds.distBar(['primary', 'secondary', 'success', 'info'][i])} />
                </Box>
              ))}
            </Box>
          </SectionCard>
        </Box>
      </Box>
    </Box>
  );
}
