import { WorkspaceDefinition } from './workspace.types';
import { ViewState } from '@/types';

/**
 * WORKSPACE REGISTRY
 * 
 * Katalog seluruh workspace yang tersedia dalam sistem.
 */

export const WORKSPACE_REGISTRY: Record<string, WorkspaceDefinition> = {
  DEVELOPER: {
    id: 'DEVELOPER',
    label: 'Developer Control Center',
    icon: 'Terminal',
    color: 'indigo',
    basePath: '/developer',
    defaultView: ViewState.DEVELOPER,
    allowedRoles: ['DEVELOPER'],
    features: ['all']
  },
  KANWIL: {
    id: 'KANWIL',
    label: 'Dashboard Kanwil',
    icon: 'Building2',
    color: 'emerald',
    basePath: '/kanwil',
    defaultView: ViewState.KANWIL_DASHBOARD,
    allowedRoles: ['KANWIL', 'DEVELOPER'],
    features: ['monitoring', 'reporting']
  },
  MADRASAH: {
    id: 'MADRASAH',
    label: 'Portal Madrasah',
    icon: 'School',
    color: 'blue',
    basePath: '/madrasah',
    defaultView: ViewState.DASHBOARD,
    allowedRoles: ['ADMIN', 'KAMAD', 'GURU', 'STAF', 'SISWA', 'DEVELOPER'],
    features: ['attendance', 'letter', 'journal']
  }
};

export function getWorkspace(id: string): WorkspaceDefinition | undefined {
  return WORKSPACE_REGISTRY[id];
}

export function getAvailableWorkspaces(userRoles: string[]): WorkspaceDefinition[] {
  return Object.values(WORKSPACE_REGISTRY).filter(ws => 
    ws.allowedRoles.some(role => userRoles.includes(role))
  );
}
