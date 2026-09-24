export interface NavItemConfig {
  label: string;
  path: string;
  iconName: 'LayoutDashboard' | 'Code2' | 'BrainCircuit' | 'Users' | 'Settings';
  badge?: string;
  children?: Array<{
    label: string;
    path: string;
    description?: string;
  }>;
}

export const NAV_ITEMS: NavItemConfig[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    iconName: 'LayoutDashboard',
  },
  {
    label: 'Technical Test',
    path: '/technical',
    iconName: 'Code2',
    children: [
      {
        label: 'Technical Quiz',
        path: '/technical/quiz',
        description: 'MCQ assessment across core computer science subjects',
      },
      {
        label: 'Coding Sandbox',
        path: '/technical/coding',
        description: 'Hands-on algorithm coding challenges with live runner',
      },
    ],
  },
  {
    label: 'Aptitude Test',
    path: '/aptitude',
    iconName: 'BrainCircuit',
  },
  {
    label: 'HR Round',
    path: '/hr',
    iconName: 'Users',
    badge: 'AI Live',
  },
  {
    label: 'Settings',
    path: '/settings',
    iconName: 'Settings',
  },
];
