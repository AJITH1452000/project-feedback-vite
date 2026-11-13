import { BarChart3, FolderKanban, LayoutDashboard, MessageSquareText, Settings, ShieldAlert, UserRound } from 'lucide-react';

/** Route + navigation map. `roles` controls who sees each entry (backend must enforce too). */
export const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, roles: ['manager'], title: 'Executive dashboard', subtitle: 'Multi-project tracking, developer ratings and delivery feedback.' },
      { to: '/projects', label: 'Projects', icon: FolderKanban, roles: ['manager'], title: 'Projects & delivery teams', subtitle: 'Staff allocations, health indicators and review status.' },
      { to: '/feedback', label: 'Project feedback', icon: MessageSquareText, roles: ['manager'], title: 'Project feedback', subtitle: 'Recognize contributions while the work is still fresh.' },
      { to: '/people', label: 'People & skills', icon: ShieldAlert, roles: ['manager'], title: 'People & skills risk', subtitle: 'Signals that protect delivery timelines and staffing.' },
      { to: '/reports', label: 'Reports', icon: BarChart3, roles: ['manager'], title: 'Reports & analytics', subtitle: 'Distributions, team trends and audit records.' },
      { to: '/me', label: 'My performance', icon: UserRound, roles: ['employee'], title: 'My performance', subtitle: 'Feedback shared by managers and project leaders.' },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/settings', label: 'Settings', icon: Settings, roles: ['manager', 'employee'], title: 'Settings', subtitle: 'Review workflow, appearance and workspace preferences.' },
    ],
  },
];

export const ALL_NAV_ITEMS = NAV_SECTIONS.flatMap((s) => s.items);
export const homePathFor = (user) => (user?.role === 'manager' ? '/dashboard' : '/me');
export const navFor = (user) => NAV_SECTIONS
  .map((section) => ({ ...section, items: section.items.filter((item) => item.roles.includes(user?.role)) }))
  .filter((section) => section.items.length);
