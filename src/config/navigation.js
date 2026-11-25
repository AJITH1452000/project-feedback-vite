import { BadgeCheck, BarChart3, CalendarRange, FolderKanban, LayoutDashboard, MessageSquareText, Settings, ShieldAlert, Target, UserCog, UserRound } from 'lucide-react';

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
      { to: '/goals', label: 'Goals', icon: Target, roles: ['manager', 'employee', 'hr'], title: 'Performance goals', subtitle: 'Goal setting, approval, progress tracking and evaluation.' },
      { to: '/cycles', label: 'Appraisal cycles', icon: CalendarRange, roles: ['hr'], title: 'Appraisal cycles', subtitle: 'Initiate cycles, configure the goal framework and track the process.' },
      { to: '/hr-review', label: 'Performance review', icon: BadgeCheck, roles: ['hr'], title: 'Performance review', subtitle: 'Employee and department performance, final reviews and reports.' },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/users', label: 'People & access', icon: UserCog, roles: ['manager', 'hr'], title: 'People & access', subtitle: 'Accounts, roles and reporting lines.' },
      { to: '/settings', label: 'Settings', icon: Settings, roles: ['manager', 'employee', 'hr'], title: 'Settings', subtitle: 'Review workflow, appearance and workspace preferences.' },
    ],
  },
];

export const ALL_NAV_ITEMS = NAV_SECTIONS.flatMap((s) => s.items);
export const homePathFor = (user) => ({ manager: '/dashboard', hr: '/hr-review' }[user?.role] || '/me');
export const navFor = (user) => NAV_SECTIONS
  .map((section) => ({ ...section, items: section.items.filter((item) => item.roles.includes(user?.role)) }))
  .filter((section) => section.items.length);
