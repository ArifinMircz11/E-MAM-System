import React from 'react';
import { ViewState, UserRole } from '@/types';

export interface ModuleDefinition {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: string;
  navigationRegistry?: any;
  workspace?: React.ComponentType<any>;
  routes?: Record<string, any>;
}

export interface WorkspaceNavItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  view?: ViewState;
  permission?: string;
  section?: string;
  badge?: string;
  roles?: UserRole[];
}

export interface WorkspaceNavigationGroup {
  title: string;
  items: WorkspaceNavItem[];
}

export interface WorkspaceNavigationRegistry {
  workspaceId: string;
  title: string;
  groups: WorkspaceNavigationGroup[];
}
