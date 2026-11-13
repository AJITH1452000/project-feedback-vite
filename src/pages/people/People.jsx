import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { AlertTriangle, CheckCircle2, Flag, ShieldAlert, Siren } from 'lucide-react';
import {
  EmptyState, FilterChips, PageHeader, Pill, ScoreBadge, SectionCard, StatCard, UserAvatar, toneForRisk,
} from '../../components/common/index.jsx';
import ResponsiveTable from '../../components/common/ResponsiveTable.jsx';
import { useData } from '../../context/DataContext.jsx';
import { findProject, findUser, formatDate, riskFor } from '../../data/selectors.js';
import { grid, page, text } from '../../styles/common.js';
import { people as s } from '../../styles/pages.js';

export default function People() {
  const { users, reviews, projects } = useData();
  const [params] = useSearchParams();
  const focusId = Number(params.get('member')) || null;
  const [level, setLevel] = useState('All');

  const rows = useMemo(() => users
    .map((u) => ({ u, ...riskFor(reviews, u.id), reviewCount: reviews.filter((r) => r.u === u.id).length }))
    .sort((a, b) => (a.u.id === focusId ? -1 : b.u.id === focusId ? 1 : 0) || b.fl - a.fl || a.a - b.a), [users, reviews, focusId]);

  const high = rows.filter((x) => x.lvl === 'High').length;
  const medium = rows.filter((x) => x.lvl === 'Medium').length;
  const totalFlags = reviews.reduce((n, r) => n + r.f.length, 0);
  const visible = level === 'All' ? rows : rows.filter((x) => x.lvl === level);
  const incidents = reviews.filter((r) => r.f.length).sort((a, b) => b.d.localeCompare(a.d));

  const columns = [
    { key: 'member', label: 'Team member', primary: true, render: (x) => (
      <Box sx={s.memberCell}>
        <UserAvatar name={x.u.n} size={34} />
        <Box minWidth={0}>
          <Typography variant="subtitle2" sx={text.ellipsis}>{x.u.n}{x.u.id === focusId ? ' · selected' : ''}</Typography>
          <Typography variant="caption" color="text.secondary">{x.u.t}</Typography>
        </Box>
      </Box>
    ) },
    { key: 'track', label: 'Track', render: (x) => <Pill tone={x.u.r === 'Lead' ? 'primary' : 'neutral'}>{x.u.r}</Pill> },
    { key: 'projects', label: 'Projects', render: (x) => projects.filter((p) => p.t.includes(x.u.id)).length },
    { key: 'avg', label: 'Avg rating', render: (x) => (x.reviewCount ? <ScoreBadge value={x.a} /> : <Typography variant="caption" color="text.secondary">No reviews</Typography>) },
    { key: 'flags', label: 'Flags', render: (x) => <Typography variant="body2" sx={x.fl ? text.error : text.success}>{x.fl} incident{x.fl === 1 ? '' : 's'}</Typography> },
    { key: 'risk', label: 'Risk level', render: (x) => <Pill tone={toneForRisk(x.lvl)} dot>{x.lvl} risk</Pill> },
  ];

  return (
    <Box sx={page.root}>
      <PageHeader eyebrow="Staffing intelligence" title="People & skills risk" description="Operational signals that help resource managers protect delivery timelines and balance project teams." />

      <Box sx={page.stack}>
        <Box sx={grid.kpis}>
          <StatCard label="High risk" value={high} icon={Siren} tone="error" trend="Immediate action" footer="Multiple flags or sub-3 rating" />
          <StatCard label="Watchlist" value={medium} icon={AlertTriangle} tone="warning" trend="Monitor" footer="Emerging flags noted" />
          <StatCard label="Low risk / cleared" value={users.length - high - medium} icon={CheckCircle2} tone="success" trend="Ready" footer="For leadership & staffing" />
          <StatCard label="Flag incidents" value={totalFlags} icon={Flag} tone="primary" footer="Across all projects" />
        </Box>

        <SectionCard title="Staffing risk matrix" subtitle="Risk = flags × 2 + low-rating penalties, per the shared scoring rules." icon={ShieldAlert}
          action={<FilterChips label="Filter by risk" value={level} onChange={setLevel}
            options={[{ value: 'All', label: `All (${rows.length})` }, { value: 'High', label: `High (${high})` }, { value: 'Medium', label: `Medium (${medium})` }, { value: 'Low', label: 'Low' }]} />}>
          <ResponsiveTable columns={columns} rows={visible} getKey={(x) => x.u.id} emptyText="No members match the selected risk filter." />
        </SectionCard>

        <SectionCard title="Flagged incidents & observations" subtitle="Verbatim context for ongoing staffing reviews." icon={AlertTriangle}>
          {incidents.length ? (
            <Box display="flex" flexDirection="column" gap={1.5}>
              {incidents.map((r) => {
                const member = findUser(users, r.u);
                return (
                  <Box key={r.id} sx={s.incident}>
                    <Box sx={s.incidentHead}>
                      <Box sx={s.memberCell}>
                        <UserAvatar name={member.n} size={32} />
                        <Box minWidth={0}>
                          <Typography variant="subtitle2">{member.n}</Typography>
                          <Typography variant="caption" color="text.secondary">on {findProject(projects, r.p).n}</Typography>
                        </Box>
                      </Box>
                      <Box sx={s.flags}>{r.f.map((flag) => <Pill key={flag} tone="error">{flag}</Pill>)}</Box>
                    </Box>
                    <Typography variant="body2" sx={text.quote}>“{r.note}”</Typography>
                    <Box sx={s.meta}>
                      <Typography variant="caption">Reported by <strong>{r.by}</strong></Typography>
                      <Typography variant="caption">· {formatDate(r.d)}</Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          ) : <EmptyState icon={CheckCircle2} title="No flagged incidents" description="No reviews currently carry delivery flags." />}
        </SectionCard>
      </Box>
    </Box>
  );
}
