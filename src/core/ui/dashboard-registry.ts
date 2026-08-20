import { SecurityContext, can } from '../auth/security-context';
import { MASTER_PERMISSIONS } from '../authorization/permission/MasterPermissionCatalog';

/**
 * DASHBOARD REGISTRY
 * 
 * Pengelola komponen (widgets) dashboard yang adaptif.
 */

export interface DashboardWidget {
  id: string;
  component: string;
  permission?: string;
  priority: number;
  span: 1 | 2 | 3; // Grid span
}

export const MASTER_DASHBOARD_WIDGETS: DashboardWidget[] = [
  { id: 'attendance_stat', component: 'AttendanceStatWidget', permission: MASTER_PERMISSIONS.ATTENDANCE_VIEW, priority: 1, span: 1 },
  { id: 'pending_approvals', component: 'PendingApprovalWidget', permission: MASTER_PERMISSIONS.APPROVAL_MANAGE, priority: 2, span: 2 },
  { id: 'announcements', component: 'AnnouncementWidget', priority: 3, span: 3 },
  { id: 'system_health', component: 'SystemHealthWidget', permission: MASTER_PERMISSIONS.SYSTEM_MANAGE, priority: 10, span: 1 },
];

/**
 * Mendapatkan daftar widget dashboard yang diizinkan.
 */
export function getAuthorizedWidgets(context: SecurityContext): DashboardWidget[] {
  return MASTER_DASHBOARD_WIDGETS
    .filter(widget => !widget.permission || can(context, widget.permission))
    .sort((a, b) => a.priority - b.priority);
}
