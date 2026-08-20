import React from 'react';
import { CLASS_PERMISSIONS } from './permissions';
import { ClassListPage } from './pages/ClassListPage';
import { ClassDetailPage } from './pages/ClassDetailPage';

export const classRoutes = [
  {
    id: 'classes',
    path: '/classes',
    element: React.createElement(ClassListPage),
    permission: CLASS_PERMISSIONS.view,
    label: 'Manajemen Kelas',
  },
  {
    id: 'class-detail',
    path: '/classes/:id',
    element: React.createElement(ClassDetailPage),
    permission: CLASS_PERMISSIONS.view,
    label: 'Detail Kelas',
  },
];
