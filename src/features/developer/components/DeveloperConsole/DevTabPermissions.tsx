import React from 'react';
import { UserRole } from '@/types';

interface DevTabPermissionsProps {
  ALL_FEATURES: string[];
  rolePermissions: Record<string, string[]>;
  setRolePermissions: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  savingPermissions: boolean;
  handleSavePermissions: () => Promise<void>;
  UserRole?: any;
  ViewState?: any;
}

export const DevTabPermissions: React.FC<DevTabPermissionsProps> = ({
  ALL_FEATURES,
  rolePermissions,
  setRolePermissions,
  savingPermissions,
  handleSavePermissions,
}) => {
  return (
    <div className="h-full flex flex-col p-4 space-y-4 overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-center bg-white dark:bg-[#151E32] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="text-[10px] font-bold uppercase text-indigo-500 tracking-wide">
          Permission Matrix
        </h2>
        <button
          onClick={handleSavePermissions}
          disabled={savingPermissions}
          className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold uppercase shadow-lg active:scale-95 transition-all disabled:opacity-50"
        >
          {savingPermissions ? 'Saving...' : 'Save Matrix'}
        </button>
      </div>

      <div className="overflow-x-auto bg-white dark:bg-[#151E32] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <table className="w-full text-left text-[9px] font-bold text-slate-800 dark:text-slate-200 border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 p-3 bg-slate-50 dark:bg-slate-900 border-b border-r border-slate-200 dark:border-slate-800 uppercase text-slate-500">
                Role
              </th>
              {ALL_FEATURES.map((f) => (
                <th
                  key={f}
                  className="p-3 border-b border-slate-200 dark:border-slate-800 uppercase text-slate-500 text-center"
                >
                  <div className="flex flex-col items-center gap-1">
                    {f}
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        const nextRolePermissions = { ...rolePermissions };
                        (UserRole ? Object.values(UserRole) : []).forEach((role) => {
                          const current = nextRolePermissions[role] || [];
                          if (isChecked) {
                            if (!current.includes(f)) nextRolePermissions[role] = [...current, f];
                          } else {
                            nextRolePermissions[role] = current.filter((p) => p !== f);
                          }
                        });
                        setRolePermissions(nextRolePermissions);
                      }}
                      className="w-3 h-3 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(UserRole ? Object.values(UserRole) : []).map((role) => (
              <tr
                key={role}
                className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
              >
                <td className="sticky left-0 z-10 p-3 bg-white dark:bg-[#151E32] border-r border-slate-100 dark:border-slate-800 font-bold text-indigo-600 dark:text-indigo-400">
                  {role}
                </td>
                {ALL_FEATURES.map((feature) => (
                  <td key={feature} className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={rolePermissions[role]?.includes(feature) || false}
                      onChange={(e) => {
                        const currentPerms = rolePermissions[role] || [];
                        const newPerms = e.target.checked
                          ? [...currentPerms, feature]
                          : currentPerms.filter((p) => p !== feature);
                        setRolePermissions({
                          ...rolePermissions,
                          [role]: newPerms,
                        });
                      }}
                      className="w-3 h-3 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
