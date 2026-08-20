import React from 'react';
import { useUserStore } from '@/stores/userStore';

export const OrganizationSwitcher: React.FC = () => {
  const { tenantId, setUserData } = useUserStore();

  const handleSwitch = (newTenantId: string) => {
    setUserData({ tenantId: newTenantId });
    // In a real app, this would also trigger a navigation refresh or re-fetch of navigation context
    window.location.reload(); 
  };

  return (
    <div className="p-4 border-b">
      <h3 className="text-sm font-medium mb-2">Organization</h3>
      <select 
        value={tenantId || 'global'} 
        onChange={(e) => handleSwitch(e.target.value)}
        className="w-full p-2 border rounded"
      >
        <option value="global">Global</option>
        <option value="30315537">Kemenag Kalsel</option>
        {/* Add more organizations as needed */}
      </select>
    </div>
  );
};
