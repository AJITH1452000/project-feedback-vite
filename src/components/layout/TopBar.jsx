import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Popover from '@mui/material/Popover';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import {
  AlertTriangle, Bell, CheckCheck, CheckCircle2, FolderKanban, Info, LogOut, Menu as MenuIcon,
  Moon, Search, Settings, Sun, UserRound,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useThemeMode } from '../../context/ThemeModeContext.jsx';
import { ALL_NAV_ITEMS } from '../../config/navigation.js';
import { UserAvatar } from '../common/index.jsx';
import { notifications as nStyles, searchDialog, topbar } from '../../styles/layout.js';
import { divider } from '../../styles/common.js';

const TONE_ICON = { warning: AlertTriangle, error: AlertTriangle, info: Info, success: CheckCircle2 };

function NotificationsButton() {
  const { notifications, markNotificationsRead } = useData();
  const { isManager } = useAuth();
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState(null);
  const unread = notifications.filter((n) => n.unread);

  // Clicking a notification marks it read and opens the related page.
  const open = (n) => {
    if (n.unread) markNotificationsRead([n.id]);
    setAnchor(null);
    if (!isManager) navigate('/me');
    else if (n.tone === 'warning' || n.tone === 'error') navigate('/dashboard');
    else navigate('/feedback?tab=history');
  };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton sx={topbar.iconBtn} onClick={(e) => setAnchor(e.currentTarget)} aria-label={`Notifications, ${unread.length} unread`}>
          <Badge color="error" badgeContent={unread.length} max={9}><Bell size={18} /></Badge>
        </IconButton>
      </Tooltip>
      <Popover
        open={Boolean(anchor)} anchorEl={anchor} onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: nStyles.paper } }}
      >
        <Box sx={nStyles.header}>
          <Box sx={nStyles.headerTitle}>
            <Typography variant="h4">Notifications</Typography>
            {unread.length > 0 && <Box component="span" sx={nStyles.count}>{unread.length} new</Box>}
          </Box>
          <Button size="small" sx={nStyles.markBtn} startIcon={<CheckCheck size={14} />} disabled={!unread.length} onClick={() => markNotificationsRead(unread.map((n) => n.id))}>
            Mark all read
          </Button>
        </Box>
        <Box sx={nStyles.list}>
          {notifications.length ? notifications.map((n) => {
            const Icon = TONE_ICON[n.tone] || Info;
            return (
              <Box key={n.id} role="button" tabIndex={0} sx={nStyles.item(n.unread)} onClick={() => open(n)} onKeyDown={(e) => e.key === 'Enter' && open(n)}>
                <Box sx={nStyles.dot(n.tone)}><Icon size={15} /></Box>
                <Box sx={nStyles.body}>
                  <Box sx={nStyles.titleRow}>
                    <Typography variant="body2" sx={nStyles.title(n.unread)}>{n.title}</Typography>
                    <Typography variant="caption" sx={nStyles.time}>{n.time}</Typography>
                  </Box>
                  <Typography variant="caption" sx={nStyles.detail}>{n.detail}</Typography>
                </Box>
                {n.unread && <Box sx={nStyles.unreadDot} aria-label="Unread" />}
              </Box>
            );
          }) : <Typography variant="body2" color="text.secondary" p={2}>You're all caught up.</Typography>}
        </Box>
        <Box sx={nStyles.footer}>
          <Button size="small" onClick={() => { setAnchor(null); navigate(isManager ? '/feedback?tab=history' : '/me'); }}>
            {isManager ? 'View review history' : 'View my feedback'}
          </Button>
        </Box>
      </Popover>
    </>
  );
}

function SearchDialog({ open, onClose }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { isManager } = useAuth();
  const { projects, users } = useData();
  const [query, setQuery] = useState('');

  useEffect(() => { if (!open) setQuery(''); }, [open]);

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    const pages = ALL_NAV_ITEMS.filter((item) => (isManager ? item.roles.includes('manager') : item.roles.includes('employee')))
      .filter((item) => !q || item.label.toLowerCase().includes(q));
    if (!isManager) return { pages, projects: [], people: [] };
    return {
      pages,
      projects: projects.filter((p) => !q || `${p.n} ${p.c}`.toLowerCase().includes(q)).slice(0, 5),
      people: users.filter((u) => !q || `${u.n} ${u.t}`.toLowerCase().includes(q)).slice(0, 5),
    };
  }, [q, isManager, projects, users]);

  const go = (to) => { onClose(); navigate(to); };
  const nothing = !results.pages.length && !results.projects.length && !results.people.length;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={fullScreen} PaperProps={{ sx: searchDialog.paper }}>
      <Box sx={searchDialog.input}>
        <TextField
          autoFocus fullWidth placeholder="Search pages, projects, people…" value={query} onChange={(e) => setQuery(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search size={18} /></InputAdornment> }}
        />
      </Box>
      <Divider sx={divider} />
      <Box sx={searchDialog.list}>
        {nothing && <Typography variant="body2" color="text.secondary" p={2}>No results for “{query}”.</Typography>}
        {results.pages.length > 0 && <Typography variant="overline" component="div" sx={searchDialog.section}>Pages</Typography>}
        {results.pages.map((item) => (
          <MenuItem key={item.to} sx={searchDialog.item} onClick={() => go(item.to)}>
            <item.icon size={17} /> {item.label}
          </MenuItem>
        ))}
        {results.projects.length > 0 && <Typography variant="overline" component="div" sx={searchDialog.section}>Projects</Typography>}
        {results.projects.map((p) => (
          <MenuItem key={p.id} sx={searchDialog.item} onClick={() => go(`/projects?q=${encodeURIComponent(p.n)}`)}>
            <FolderKanban size={17} />
            <Box minWidth={0}><Typography variant="body2" fontWeight={600}>{p.n}</Typography><Typography variant="caption" color="text.secondary">{p.c}</Typography></Box>
          </MenuItem>
        ))}
        {results.people.length > 0 && <Typography variant="overline" component="div" sx={searchDialog.section}>People</Typography>}
        {results.people.map((u) => (
          <MenuItem key={u.id} sx={searchDialog.item} onClick={() => go(`/people?member=${u.id}`)}>
            <UserAvatar name={u.n} size={28} />
            <Box minWidth={0}><Typography variant="body2" fontWeight={600}>{u.n}</Typography><Typography variant="caption" color="text.secondary">{u.t}</Typography></Box>
          </MenuItem>
        ))}
      </Box>
      {fullScreen && <Box p={2}><Button fullWidth variant="outlined" onClick={onClose}>Close</Button></Box>}
    </Dialog>
  );
}

export default function TopBar({ onOpenNav }) {
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useThemeMode();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const current = ALL_NAV_ITEMS.find((item) => pathname.startsWith(item.to));

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const signOut = async () => {
    setProfileAnchor(null);
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <Box component="header" sx={topbar.root}>
      <IconButton sx={topbar.menuBtn} onClick={onOpenNav} aria-label="Open navigation"><MenuIcon size={22} /></IconButton>

      <Box sx={topbar.titleWrap}>
        <Typography variant="h4" component="p" noWrap sx={topbar.title}>{current?.title || 'ProFeed'}</Typography>
        <Typography variant="caption" noWrap sx={topbar.subtitle}>{current?.subtitle}</Typography>
      </Box>

      <Box component="button" type="button" sx={topbar.search} onClick={() => setSearchOpen(true)} aria-label="Open search">
        <Search size={17} />
        <Typography variant="body2" sx={topbar.searchText}>Search projects, people…</Typography>
        <Box component="kbd" sx={topbar.kbd}>Ctrl K</Box>
      </Box>

      <Box sx={topbar.actions}>
        <IconButton sx={[topbar.iconBtn, topbar.searchIconBtn]} onClick={() => setSearchOpen(true)} aria-label="Search"><Search size={18} /></IconButton>
        <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
          <IconButton sx={topbar.iconBtn} onClick={toggleMode} aria-label="Toggle color theme">
            {mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </IconButton>
        </Tooltip>
        <NotificationsButton />
        <Box component="button" type="button" sx={topbar.profileBtn} onClick={(e) => setProfileAnchor(e.currentTarget)} aria-label="Open profile menu">
          <UserAvatar name={user?.name} size={32} />
          <Box sx={topbar.profileText}>
            <Typography variant="subtitle2" noWrap>{user?.name}</Typography>
            <Typography variant="caption" noWrap sx={topbar.profileRole}>{user?.role === 'manager' ? 'Manager · full access' : user?.title}</Typography>
          </Box>
        </Box>
      </Box>

      <Menu
        anchorEl={profileAnchor} open={Boolean(profileAnchor)} onClose={() => setProfileAnchor(null)} disableAutoFocusItem
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: topbar.menuPaper } }}
      >
        <Box sx={topbar.menuHeader}>
          <UserAvatar name={user?.name} size={38} />
          <Box minWidth={0}>
            <Typography variant="subtitle2" noWrap>{user?.name}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>{user?.title}</Typography>
          </Box>
        </Box>
        <Divider sx={divider} />
        {user?.role === 'employee' && (
          <MenuItem onClick={() => { setProfileAnchor(null); navigate('/me'); }}>
            <ListItemIcon><UserRound size={17} /></ListItemIcon>My performance
          </MenuItem>
        )}
        <MenuItem onClick={() => { setProfileAnchor(null); navigate('/settings'); }}>
          <ListItemIcon><Settings size={17} /></ListItemIcon>Settings
        </MenuItem>
        <Divider sx={divider} />
        <MenuItem onClick={signOut} sx={{ color: 'error.main' }}>
          <ListItemIcon sx={{ color: 'error.main' }}><LogOut size={17} /></ListItemIcon>Sign out
        </MenuItem>
      </Menu>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </Box>
  );
}
