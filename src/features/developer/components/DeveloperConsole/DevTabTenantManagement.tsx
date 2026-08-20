import React from 'react';
import TenantManagement from '@/features/developer/TenantManagement/TenantList';

export const DevTabTenantManagement: React.FC = () => {
  return (
    <div className="p-4 md:p-6 overflow-y-auto h-full pb-40 custom-scrollbar bg-slate-50 dark:bg-[#020617]">
      <TenantManagement />
    </div>
  );
};
