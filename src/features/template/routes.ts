import React from 'react';
import { TEMPLATE_PERMISSIONS } from './permissions';
import { TemplatePage } from './pages/TemplatePage';

export const templateRoutes = [
  {
    id: 'template',
    path: '/template',
    element: React.createElement(TemplatePage),
    permission: TEMPLATE_PERMISSIONS.view,
    label: 'Template Management',
  },
];
