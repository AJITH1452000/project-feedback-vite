import { NavLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { ArrowUpRight, Sparkles, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { homePathFor, navFor } from '../../config/navigation.js';
import { shell, sidebar } from '../../styles/layout.js';

function SidebarContent({ onNavigate, onClose }) {
  const { user, isManager } = useAuth();
  const { projects } = useData();
  const sections = navFor(user);

  return (
    <Box sx={sidebar.inner}>
      <Box sx={sidebar.brand}>
        <Box sx={sidebar.brandMark}><Sparkles size={20} /></Box>
        <Box>
          <Typography variant="h3" sx={sidebar.brandName}>ProFeed</Typography>
          <Typography variant="caption" sx={sidebar.brandTag}>Project feedback system</Typography>
        </Box>
        {onClose && (
          <IconButton onClick={onClose} sx={sidebar.closeBtn} aria-label="Close navigation"><X size={18} /></IconButton>
        )}
      </Box>

      <Box sx={sidebar.scroll}>
        <Box component="nav" aria-label="Main navigation">
          {sections.map((section) => (
            <Box key={section.label}>
              <Typography variant="overline" component="div" sx={sidebar.sectionLabel}>{section.label}</Typography>
              <Box sx={sidebar.navList}>
                {section.items.map(({ to, label, icon: Icon }) => (
                  <Box component={NavLink} key={to} to={to} sx={sidebar.navItem} onClick={onNavigate}>
                    <Box component="span" className="nav-icon" sx={sidebar.navIcon}><Icon size={18} /></Box>
                    <span>{label}</span>
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Box>

        <Box sx={sidebar.bottom}>
          <Box sx={sidebar.promo}>
            <Box sx={sidebar.promoIcon}><Sparkles size={16} /></Box>
            <Typography variant="subtitle2">Feedback that moves you forward</Typography>
            <Typography variant="caption" component="p" sx={sidebar.promoText}>
              {isManager ? 'Turn team insights into better delivery outcomes.' : 'Track your growth across every project.'}
            </Typography>
            <Box component={NavLink} to={isManager ? '/reports' : homePathFor(user)} sx={sidebar.promoLink} onClick={onNavigate}>
              Explore insights <ArrowUpRight size={14} />
            </Box>
          </Box>
          <Box sx={sidebar.status}>
            <Box sx={sidebar.statusDot} />
            <Box>
              <Typography variant="caption" component="div" sx={sidebar.statusTitle}>Feedback hub active</Typography>
              <Typography variant="caption" component="div" sx={sidebar.statusSub}>{projects.length} projects • live ratings</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default function Sidebar({ mobileOpen, onClose, isDesktop }) {
  if (isDesktop) {
    return (
      <Drawer variant="permanent" open PaperProps={{ sx: sidebar.drawerPaper }} sx={shell.sidebarSlot}>
        <SidebarContent />
      </Drawer>
    );
  }
  return (
    <Drawer variant="temporary" open={mobileOpen} onClose={onClose} ModalProps={{ keepMounted: true }} PaperProps={{ sx: sidebar.drawerPaper }}>
      <SidebarContent onNavigate={onClose} onClose={onClose} />
    </Drawer>
  );
}
