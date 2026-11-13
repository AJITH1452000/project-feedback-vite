/** Small shared building blocks. All styling comes from src/styles. */
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { Inbox, Star } from 'lucide-react';
import { avatar, card, empty, filterChips, kpi, pageHeader, pill, pillDot, score } from '../../styles/common.js';
import { f1, initials } from '../../data/selectors.js';

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <Box sx={pageHeader.root}>
      <Box minWidth={0}>
        {eyebrow && (
          <Typography variant="overline" sx={pageHeader.eyebrow}>
            <Box component="span" sx={pageHeader.eyebrowDot} />{eyebrow}
          </Typography>
        )}
        <Typography variant="h1" sx={pageHeader.title}>{title}</Typography>
        {description && <Typography variant="body1" sx={pageHeader.description}>{description}</Typography>}
      </Box>
      {actions && <Box sx={pageHeader.actions}>{actions}</Box>}
    </Box>
  );
}

export function SectionCard({ title, subtitle, icon: Icon, action, children, fill = false, footer, sx }) {
  return (
    <Paper sx={[card.root, fill && card.fill, ...(Array.isArray(sx) ? sx : [sx])]}>
      {(title || action) && (
        <Box sx={card.header}>
          <Box sx={card.headerTitleRow}>
            {Icon && <Box sx={card.headerIcon}><Icon size={18} /></Box>}
            <Box minWidth={0}>
              {title && <Typography variant="h3" sx={card.title}>{title}</Typography>}
              {subtitle && <Typography variant="body2" sx={card.subtitle}>{subtitle}</Typography>}
            </Box>
          </Box>
          {action}
        </Box>
      )}
      {fill ? <Box sx={card.body}>{children}</Box> : children}
      {footer && <Box sx={card.footer}>{footer}</Box>}
    </Paper>
  );
}

export function StatCard({ label, value, scale, icon: Icon, tone = 'primary', footer, trend }) {
  return (
    <Paper sx={kpi.root(tone)}>
      {Icon && <Box sx={kpi.icon(tone)}><Icon /></Box>}
      <Box sx={kpi.body}>
        <Typography variant="caption" sx={[kpi.label, kpi.oneLine]} title={label}>{label}</Typography>
        <Box sx={kpi.valueRow}>
          <Typography variant="kpi" sx={kpi.value}>{value}</Typography>
          {scale && <Typography variant="body2" sx={kpi.scale}>{scale}</Typography>}
          {trend && <Box component="span" sx={kpi.trend(tone)}>{trend}</Box>}
        </Box>
        {footer && <Typography variant="caption" sx={[kpi.footer, kpi.oneLine]} title={footer}>{footer}</Typography>}
      </Box>
    </Paper>
  );
}

const PRIORITY_TONE = { High: 'error', Medium: 'warning', Low: 'success' };
const STATUS_TONE = {
  Acknowledged: 'success', Reviewed: 'success', 'Employee response pending': 'warning', 'Review due': 'warning',
  'Manager draft': 'neutral', 'In progress': 'info', Pending: 'warning', Overdue: 'error',
};

export const toneForPriority = (p) => PRIORITY_TONE[p] || 'neutral';
export const toneForStatus = (s) => STATUS_TONE[s] || 'neutral';
export const toneForRisk = (lvl) => PRIORITY_TONE[lvl] || 'neutral';

export function Pill({ tone = 'neutral', dot = false, children }) {
  return (
    <Box component="span" sx={pill(tone)}>
      {dot && <Box component="span" sx={pillDot} />}
      {children}
    </Box>
  );
}

function hashName(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h;
}

export function UserAvatar({ name, size = 34 }) {
  return <Avatar sx={avatar(size, hashName(name))} alt={name}>{initials(name)}</Avatar>;
}

export function ScoreBadge({ value, suffix = '' }) {
  return (
    <Box component="span" sx={score.root}>
      <Box component="span" sx={score.icon}><Star size={13} fill="currentColor" /></Box>
      {typeof value === 'number' ? f1(value) : value}{suffix}
    </Box>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <Box sx={empty.root}>
      <Box sx={empty.icon}><Icon size={22} /></Box>
      <Typography variant="h4">{title}</Typography>
      {description && <Typography variant="body2" color="text.secondary" maxWidth={420}>{description}</Typography>}
      {action}
    </Box>
  );
}

export function FilterChips({ options, value, onChange, label }) {
  return (
    <Box sx={filterChips.row} role="group" aria-label={label}>
      {options.map((option) => {
        const key = typeof option === 'string' ? option : option.value;
        const text = typeof option === 'string' ? option : option.label;
        return (
          <Button key={key} size="small" sx={filterChips.chip(value === key)} onClick={() => onChange(key)} aria-pressed={value === key}>
            {text}
          </Button>
        );
      })}
    </Box>
  );
}
