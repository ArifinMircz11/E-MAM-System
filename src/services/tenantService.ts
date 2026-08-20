import { tenantRepository } from '@/repositories/madrasahRepository';
import { auditRepository } from '@/repositories/auditRepository';
import type { TenantData } from '@/types';
import { logAudit } from './auditLogService';

export const getTenants = async (): Promise<TenantData[]> => {
  try {
    const secCtx = { tenantId: 'global', role: 'developer', isDeveloper: true } as any;
    return (await tenantRepository.getAll(secCtx)) as any;
  } catch (err: any) {
    console.error('Error fetching tenants:', err);
    throw err;
  }
};

export const getTenantById = async (id: string): Promise<TenantData | null> => {
  try {
    const t = await tenantRepository.findById(id);
    return t as any;
  } catch (err: any) {
    console.error('Error fetching tenant by ID:', err);
    throw err;
  }
};

export const createTenant = async (id: string, data: Partial<TenantData>): Promise<void> => {
  try {
    await tenantRepository.saveMadrasah({ ...data, id, tenantId: id } as any);
    await logAudit({
      action: 'TENANT_CREATE',
      category: 'SYSTEM',
      target: `tenant/${id}`,
      details: `Created new madrasah tenant: ${id}`,
    });
  } catch (err: any) {
    console.error('Error creating tenant:', err);
    throw err;
  }
};

export const updateTenant = async (id: string, data: Partial<TenantData>): Promise<void> => {
  try {
    const existing = await tenantRepository.findById(id);
    await tenantRepository.saveMadrasah({ ...existing, ...data, id } as any);
    await logAudit({
      action: 'TENANT_UPDATE',
      category: 'SYSTEM',
      target: `tenant/${id}`,
      details: `Updated madrasah tenant settings: ${id}`,
    });
  } catch (err: any) {
    console.error('Error updating tenant:', err);
    throw err;
  }
};

export const setTenantStatus = async (
  id: string,
  status: 'Active' | 'Inactive' | 'Suspended',
): Promise<void> => {
  try {
    const existing = await tenantRepository.findById(id);
    await tenantRepository.saveMadrasah({ ...existing, id, status } as any);
    await logAudit({
      action: `TENANT_${status.toUpperCase()}`,
      category: 'SECURITY',
      target: `tenant/${id}`,
      details: `Set tenant status to ${status}: ${id}`,
    });
  } catch (err: any) {
    console.error(`Error setting tenant status to ${status}:`, err);
    throw err;
  }
};

export const resetTenant = async (id: string): Promise<void> => {
  try {
    const tenant = await getTenantById(id);
    if (!tenant) throw new Error('Tenant not found');

    await tenantRepository.saveMadrasah({
      ...tenant,
      id,
      konfigurasiSistem: {
        ...tenant.konfigurasiSistem,
        isMaintenance: true,
      } as any,
    } as any);

    await logAudit({
      action: 'TENANT_RESET',
      category: 'SYSTEM',
      target: `tenant/${id}`,
      details: `Triggered reset routine for tenant: ${id}`,
    });
  } catch (err: any) {
    console.error('Error resetting tenant:', err);
    throw err;
  }
};

export const cloneTenant = async (
  sourceId: string,
  targetId: string,
  newName: string,
): Promise<void> => {
  try {
    const sourceTenant = await getTenantById(sourceId);
    if (!sourceTenant) throw new Error('Source tenant not found');

    const newData = {
      ...sourceTenant,
      identitas: {
        ...sourceTenant.identitas,
        namaMadrasah: newName,
      },
    };
    
    // Remove ID from data if present to avoid conflicts
    const cleanData = { ...newData, id: targetId };

    await tenantRepository.saveMadrasah(cleanData as any);

    await logAudit({
      action: 'TENANT_CLONE',
      category: 'SYSTEM',
      target: `tenant/${targetId}`,
      details: `Cloned tenant from ${sourceId} to ${targetId}`,
    });
  } catch (err: any) {
    console.error('Error cloning tenant:', err);
    throw err;
  }
};

export const getTenantLogs = async (tenantId: string): Promise<any[]> => {
  try {
    return await auditRepository.getByTenantId(tenantId);
  } catch (err) {
    console.error('Error fetching tenant logs:', err);
    return [];
  }
};

