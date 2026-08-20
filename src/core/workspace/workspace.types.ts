import { ViewState } from '@/types';

/**
 * WORKSPACE TYPES
 * 
 * Definisi tipe data untuk sistem Workspace (Ruang Kerja).
 */

export type WorkspaceType = 'ADMIN' | 'DEVELOPER' | 'KANWIL' | 'KEMENAG' | 'MADRASAH' | 'TEACHER' | 'STUDENT' | 'GUEST';

export interface WorkspaceDefinition {
  id: WorkspaceType;
  label: string;
  icon: string;
  color: string;
  basePath: string;
  defaultView: ViewState;
  allowedRoles: string[];
  features: string[];
}

export interface WorkspaceContext {
  activeWorkspace: WorkspaceType;
  tenantId: string;
  organizationId: string;
}
