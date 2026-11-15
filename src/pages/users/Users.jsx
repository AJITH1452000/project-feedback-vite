import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { KeyRound, Pencil, Search, UserCheck, UserPlus, UserX, Users as UsersIcon } from 'lucide-react';
import ResponsiveTable from '../../components/common/ResponsiveTable.jsx';
import NoteDialog from '../../components/goals/NoteDialog.jsx';
import UserDialog from '../../components/users/UserDialog.jsx';
import { EmptyState, FilterChips, PageHeader, Pill, SectionCard, UserAvatar } from '../../components/common/index.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { ROLES } from '../../data/constants.js';
import { useUpdateUser } from '../../hooks/queries/users.js';
import { useWorkspaceQuery } from '../../hooks/queries/workspace.js';
import { formatDate } from '../../data/selectors.js';
import { page, text } from '../../styles/common.js';
import { goals as s } from '../../styles/pages.js';

const ROLE_LABEL = Object.fromEntries(ROLES.map((r) => [r.value, r.label]));
const ROLE_TONE = { manager: 'primary', hr: 'secondary', employee: 'neutral' };
const selectPeople = (ws) => ws.people || [];

/** People & access: managers add their team; HR manages everyone. */
export default function Users() {
  const { user, isHr } = useAuth();
  const { notify } = useToast();
  const { data: people = [], isPending } = useWorkspaceQuery(selectPeople);
  const updateUser = useUpdateUser();
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('all');
  const [dialog, setDialog] = useState(null); // { mode, person }
  const [toggling, setToggling] = useState(null);

  const byId = useMemo(() => Object.fromEntries(people.map((p) => [p.id, p])), [people]);
  const canEdit = (p) => isHr || (p.role === 'employee' && p.managerId === user.userId);
  const rows = people
    .filter((p) => role === 'all' || (role === 'inactive' ? !p.active : p.role === role && p.active))
    .filter((p) => !query.trim() || `${p.n} ${p.email} ${p.t} ${p.dept}`.toLowerCase().includes(query.trim().toLowerCase()));

  const counts = {
    all: people.length,
    employee: people.filter((p) => p.role === 'employee' && p.active).length,
    manager: people.filter((p) => p.role === 'manager' && p.active).length,
    hr: people.filter((p) => p.role === 'hr' && p.active).length,
    inactive: people.filter((p) => !p.active).length,
  };

  const columns = [
    {
      key: 'name', label: 'Person', primary: true, sortValue: (p) => p.n,
      render: (p) => (
        <Box display="flex" alignItems="center" gap={1.25} minWidth={0} sx={{ opacity: p.active ? 1 : 0.55 }}>
          <UserAvatar name={p.n} size={34} />
          <Box minWidth={0}>
            <Typography variant="subtitle2" sx={text.ellipsis}>{p.n}{p.id === user.userId ? ' (you)' : ''}</Typography>
            <Typography variant="caption" color="text.secondary" sx={text.ellipsis} component="div">{p.email}</Typography>
          </Box>
        </Box>
      ),
    },
    { key: 'role', label: 'Role', sortValue: (p) => p.role, render: (p) => <Pill tone={ROLE_TONE[p.role]}>{ROLE_LABEL[p.role]}</Pill> },
    { key: 'title', label: 'Title', sortValue: (p) => p.t, render: (p) => <Box><Typography variant="body2">{p.t}</Typography><Typography variant="caption" color="text.secondary">{p.dept} · {p.r}</Typography></Box> },
    { key: 'manager', label: 'Reports to', sortValue: (p) => byId[p.managerId]?.n || '', render: (p) => byId[p.managerId]?.n || '—' },
    { key: 'status', label: 'Status', sortValue: (p) => (p.active ? 0 : 1), render: (p) => <Pill tone={p.active ? 'success' : 'neutral'} dot>{p.active ? 'Active' : 'Deactivated'}</Pill> },
    { key: 'added', label: 'Added', sortValue: (p) => p.createdAt, render: (p) => formatDate(p.createdAt?.slice(0, 10)) },
    {
      key: 'actions', label: '', align: 'right',
      render: (p) => (canEdit(p) && p.id !== user.userId ? (
        <Box display="flex" gap={0.5} justifyContent="flex-end" flexWrap="wrap">
          <Button size="small" startIcon={<Pencil size={14} />} onClick={() => setDialog({ mode: 'edit', person: p })}>Edit</Button>
          <Button size="small" startIcon={<KeyRound size={14} />} onClick={() => setDialog({ mode: 'password', person: p })}>Password</Button>
          <Button size="small" color={p.active ? 'error' : 'success'} startIcon={p.active ? <UserX size={14} /> : <UserCheck size={14} />} onClick={() => setToggling(p)}>
            {p.active ? 'Deactivate' : 'Reactivate'}
          </Button>
        </Box>
      ) : null),
    },
  ];

  return (
    <Box sx={page.root}>
      <PageHeader
        eyebrow="Administration"
        title="People & access"
        description={isHr ? 'Add employees, managers and HR accounts, set reporting lines and manage access.' : 'Add the people on your team. They sign in with their email and the temporary password you share.'}
        actions={<Button variant="contained" startIcon={<UserPlus size={16} />} onClick={() => setDialog({ mode: 'create' })}>Add person</Button>}
      />

      <SectionCard title="Directory" subtitle="Everyone with an account in this workspace." icon={UsersIcon}>
        <Box sx={s.toolbar}>
          <TextField size="small" placeholder="Search name, email, title or department" value={query} onChange={(e) => setQuery(e.target.value)} sx={s.search}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> }} />
        </Box>
        <Box mb={2}>
          <FilterChips label="Role" value={role} onChange={setRole} options={[
            { value: 'all', label: `All (${counts.all})` }, { value: 'employee', label: `Employees (${counts.employee})` },
            { value: 'manager', label: `Managers (${counts.manager})` }, { value: 'hr', label: `HR (${counts.hr})` },
            ...(counts.inactive ? [{ value: 'inactive', label: `Deactivated (${counts.inactive})` }] : []),
          ]} />
        </Box>
        {!isPending && people.length <= 1 ? (
          <EmptyState icon={UserPlus} title="Add your first team member"
            description="Each person gets their own sign-in. Employees set their goals; you approve them and give feedback."
            action={<Button variant="contained" startIcon={<UserPlus size={16} />} onClick={() => setDialog({ mode: 'create' })}>Add person</Button>} />
        ) : (
          <ResponsiveTable columns={columns} rows={rows} pageSize={10} defaultSort={{ key: 'name', dir: 'asc' }} emptyText="No one matches these filters." />
        )}
      </SectionCard>

      {dialog && <UserDialog open mode={dialog.mode} person={dialog.person} people={people} onClose={() => setDialog(null)} />}
      {toggling && (
        <NoteDialog
          open
          onClose={() => setToggling(null)}
          title={toggling.active ? `Deactivate ${toggling.n}?` : `Reactivate ${toggling.n}?`}
          info={toggling.active
            ? 'They are signed out immediately and can no longer sign in. Their goals, reviews and history are kept.'
            : 'They can sign in again with their existing password.'}
          confirmLabel={toggling.active ? 'Deactivate' : 'Reactivate'}
          confirmColor={toggling.active ? 'error' : 'success'}
          onSubmit={async () => {
            await updateUser.mutateAsync({ id: toggling.id, changes: { active: !toggling.active } });
            notify(toggling.active ? `${toggling.n} was deactivated.` : `${toggling.n} can sign in again.`);
          }}
        />
      )}
    </Box>
  );
}
