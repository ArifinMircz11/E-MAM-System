import type { NavigationModule } from '../contracts/navigation.module';

export const NAVIGATION_VERSION = 1;

export const NAVIGATION_MODULES: NavigationModule[] = [
  {
    id: 'academic',
    name: 'Akademik',
    route: '/akademik',
    version: '1.0.0',
    enabled: true,
    loader: () => import('@/features/akademik').then(m => m.AcademicModule),
    permissions: ['academic.read'],
  },
  {
    id: 'attendance',
    name: 'Presensi',
    route: '/presensi',
    version: '1.0.0',
    enabled: true,
    loader: () => import('@/features/presensi').then(m => m.AttendanceModule),
    permissions: ['attendance.read'],
  },
  {
    id: 'developer',
    name: 'Developer Console',
    route: '/developer',
    version: '1.0.0',
    enabled: true,
    loader: () => import('@/features/developer/DeveloperConsole').then(m => m.DeveloperConsole),
    permissions: ['developer.access'],
  },
];
