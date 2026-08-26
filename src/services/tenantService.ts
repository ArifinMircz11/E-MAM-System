import { db } from '@/database/db';
import { TenantData } from '@/types';

export const getTenants = async (): Promise<TenantData[]> => {
  try {
    if (db.table('tenants')) {
      const list = await db.table('tenants').toArray();
      if (list.length > 0) return list;
    }
  } catch {}
  return [
    {
      id: '30315537',
      name: 'MAN 1 Hulu Sungai Tengah',
      alias: 'MAN 1 HST',
      npsn: '30315537',
      nsm: '111163070001',
      status: 'Active',
      level: 'MA',
      address: 'Jl. Keramat Manunggal No. 12, Barabai',
      phone: '0517-41234',
      email: 'man1hst@kemenag.go.id',
      logoUrl: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  ];
};

export const createTenant = async (id: string, data: Partial<TenantData>): Promise<void> => {
  try {
    if (db.table('tenants')) {
      await db.table('tenants').put({
        ...data,
        id,
        status: data.status || 'Active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  } catch {}
};

export const updateTenant = async (id: string, updates: Partial<TenantData>): Promise<void> => {
  try {
    if (db.table('tenants')) {
      const existing = await db.table('tenants').get(id);
      await db.table('tenants').put({
        ...existing,
        ...updates,
        id,
        updatedAt: Date.now(),
      });
    }
  } catch {}
};

export const setTenantStatus = async (id: string, status: 'Active' | 'Inactive' | 'Suspended'): Promise<void> => {
  await updateTenant(id, { status });
};

export const resetTenant = async (id: string): Promise<void> => {
  await updateTenant(id, { updatedAt: Date.now() });
};

export const cloneTenant = async (sourceId: string, targetId: string, newName: string): Promise<void> => {
  try {
    if (db.table('tenants')) {
      const source = await db.table('tenants').get(sourceId);
      await createTenant(targetId, {
        ...source,
        id: targetId,
        name: newName,
        npsn: targetId,
      });
    }
  } catch {}
};

export const tenantService = {
  getTenants,
  createTenant,
  updateTenant,
  setTenantStatus,
  resetTenant,
  cloneTenant,
};
