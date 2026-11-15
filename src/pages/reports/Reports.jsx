import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart3, ClipboardCheck, Download, FileSpreadsheet, Layers, PieChart as PieIcon, Star } from 'lucide-react';
import { PageHeader, Pill, SectionCard, StatCard } from '../../components/common/index.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { CORE_DIMENSIONS, RATING_PRINCIPLES } from '../../data/constants.js';
import {
  avg, dimensionAverages, downloadCsv, downloadJson, f1, findProject, findUser, pendingAssignments,
  projectStats, ratingDistribution, reviewAvg, totalAssignments,
} from '../../data/selectors.js';
import { card, grid, page } from '../../styles/common.js';
import { dashboard as ds, reports as s } from '../../styles/pages.js';

const SHORT_LABEL = { 5: 'Exceptional', 4: 'Exceeds', 3: 'Meets', 2: 'Partial', 1: 'Below' };

export default function Reports() {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down('md'));
  const { notify } = useToast();
  const { projects, users, reviews } = useData();

  const overall = reviews.length ? avg(reviews.map(reviewAvg)) : 0;
  const total = totalAssignments(projects);
  const compliance = total ? Math.round(((total - pendingAssignments(projects, users, reviews).length) / total) * 100) : 0;
  const dims = useMemo(() => dimensionAverages(reviews), [reviews]);
  const byProject = useMemo(() => projects.map((p) => ({ name: p.n, short: p.n.split(' ')[0], ...projectStats(p, reviews) })), [projects, reviews]);
  const distribution = useMemo(() => ratingDistribution(reviews), [reviews]);
  const flagged = reviews.filter((r) => r.f.length).length;

  const exportJson = () => { downloadJson({ exportedAt: new Date().toISOString(), reviews }, `profeed-audit-${Date.now()}.json`); notify('Audit log exported as JSON.'); };
  const exportCsv = () => {
    downloadCsv([
      ['Review ID', 'Date', 'Type', 'Employee', 'Project', 'Client', 'Reviewer', ...CORE_DIMENSIONS.map((d) => d.name),
        'Delivery & quality', 'Collaboration', 'Rating', 'Flags', 'Strengths / note', 'Development areas', 'Visibility'],
      ...reviews.map((r) => {
        const p = findProject(projects, r.p);
        return [r.id, r.d, r.q?.type || 'Rubric review', findUser(users, r.u).n, p.n, p.c, r.by, ...(r.s || ['', '', '', '']),
          r.q?.delivery || '', r.q?.collaboration || '', f1(reviewAvg(r)), r.f.join('; '), r.note, r.q?.development || '', r.q?.visibility || ''];
      }),
    ], `profeed-reviews-${Date.now()}.csv`);
    notify('Reviews exported as CSV.');
  };

  const rated = useMemo(() => byProject.filter((p) => p.avg).sort((a, b) => b.avg - a.avg), [byProject]);
  const unrated = useMemo(() => byProject.filter((p) => !p.avg), [byProject]);

  return (
    <Box sx={page.root}>
      <PageHeader eyebrow="Analytics" title="Reports & analytics" description="Organisation-wide review trends, competency distributions and compliance data."
        actions={<>
          <Button variant="outlined" startIcon={<FileSpreadsheet size={16} />} onClick={exportCsv}>Export CSV</Button>
          <Button variant="contained" startIcon={<Download size={16} />} onClick={exportJson}>Export audit log</Button>
        </>} />

      <Box sx={page.stack}>
        <Box sx={grid.kpis}>
          <StatCard label="Review compliance" value={`${compliance}%`} icon={ClipboardCheck} tone="success" footer="Assignments with a rating" />
          <StatCard label="Total reviews" value={reviews.length} icon={Layers} tone="primary" footer={`Across ${projects.length} projects`} />
          <StatCard label="Average score" value={f1(overall)} scale="/ 5" icon={Star} tone="info" footer="1–5 enterprise rubric" />
          <StatCard label="Flagged reviews" value={flagged} icon={BarChart3} tone="warning" footer={`${reviews.length ? Math.round((flagged / reviews.length) * 100) : 0}% of all reviews`} />
        </Box>

        <Box sx={grid.two}>
          <SectionCard fill title="Average rating by project" subtitle="Rated projects, highest first (scale 0–5)." icon={BarChart3}>
            <Box sx={s.barBox}>
              {rated.length ? (
                <BarChart
                  layout="horizontal"
                  height={rated.length * 34 + 36}
                  dataset={rated.map((p) => ({ name: compact ? p.short : p.name, avg: Number(f1(p.avg)) }))}
                  yAxis={[{ scaleType: 'band', dataKey: 'name', width: compact ? 72 : 132, categoryGapRatio: 0.45, tickLabelStyle: { fontSize: 12 }, disableTicks: true }]}
                  xAxis={[{ min: 0, max: 5, tickNumber: 6, tickLabelStyle: { fontSize: 11 } }]}
                  series={[{ dataKey: 'avg', label: 'Average rating', color: theme.palette.primary.main, valueFormatter: (v) => `${f1(v)} / 5` }]}
                  barLabel={(item) => f1(item.value)}
                  borderRadius={4}
                  hideLegend
                  grid={{ vertical: true }}
                  margin={{ left: 0, right: 12, top: 4, bottom: 0 }}
                />
              ) : <Typography variant="body2" color="text.secondary">No ratings yet.</Typography>}
            </Box>
            {unrated.length > 0 && (
              <Box sx={s.unrated}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>Not yet rated:</Typography>
                {unrated.map((p) => <Pill key={p.name}>{p.name}</Pill>)}
              </Box>
            )}
          </SectionCard>

          <SectionCard fill title="Rating distribution" subtitle="Reviews grouped by rounded average." icon={PieIcon}>
            <Box sx={s.donutWrap}>
              <Box sx={s.donutBox}>
                <PieChart
                  width={200}
                  height={200}
                  hideLegend
                  margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                  series={[{
                    data: distribution.filter((b) => b.count).map((b) => ({ id: b.level, value: b.count, label: `${b.level} ★`, color: theme.palette.sequential[b.level - 1] })),
                    innerRadius: 62, outerRadius: 94, paddingAngle: 2, cornerRadius: 4,
                    valueFormatter: (v) => `${v.value} review${v.value === 1 ? '' : 's'}`,
                    highlightScope: { fade: 'global', highlight: 'item' },
                  }]}
                />
                <Box sx={s.donutCenter}>
                  <Typography variant="kpi">{reviews.length}</Typography>
                  <Typography variant="caption" color="text.secondary">reviews</Typography>
                </Box>
              </Box>
              <Box sx={s.legend}>
                {distribution.map((b) => (
                  <Box key={b.level} sx={s.legendItem}>
                    <Box sx={s.swatch(b.level - 1)} />
                    <Typography variant="body2" noWrap title={RATING_PRINCIPLES.find((r) => r.level === b.level)?.label}>
                      <b>{b.level} ★</b> · {SHORT_LABEL[b.level]}
                    </Typography>
                    <Typography variant="body2" sx={s.legendValue}>{b.count}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </SectionCard>
        </Box>

        <Box sx={grid.two}>

          <SectionCard fill title="Competency averages" subtitle="Team-wide average per rubric dimension." icon={Layers}>
            {CORE_DIMENSIONS.map((d, i) => (
              <Box key={d.id} sx={ds.dimRow}>
                <Box sx={ds.dimHead}>
                  <Typography variant="subtitle2">{d.name}</Typography>
                  <Typography variant="subtitle2" color="primary.main">{f1(dims[i])}</Typography>
                </Box>
                <LinearProgress variant="determinate" value={(dims[i] / 5) * 100} sx={ds.distBar('primary')} aria-label={`${d.name}: ${f1(dims[i])} of 5`} />
                <Typography variant="caption" color="text.secondary">{d.desc}</Typography>
              </Box>
            ))}
          </SectionCard>

        <SectionCard fill title="Competency distribution guide" subtitle="How each rubric level maps to outcomes." icon={ClipboardCheck}>
          <Box display="flex" flexDirection="column" gap={1.25}>
            {RATING_PRINCIPLES.map((r) => {
              const count = distribution.find((b) => b.level === r.level)?.count || 0;
              return (
                <Box key={r.level} sx={card.listItem}>
                  <Box flex={1} minWidth={0}>
                    <Typography variant="subtitle2">Level {r.level} · {r.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{r.desc}</Typography>
                  </Box>
                  <Pill tone={r.level >= 4 ? 'success' : r.level === 3 ? 'info' : 'error'}>{count} review{count === 1 ? '' : 's'}</Pill>
                </Box>
              );
            })}
          </Box>
        </SectionCard>
        </Box>
      </Box>
    </Box>
  );
}
