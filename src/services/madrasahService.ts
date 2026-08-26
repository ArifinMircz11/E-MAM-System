import { db } from '@/database/db';

export const getMadrasahInfo = async (tenantId: string = 'tenant-demo') => {
  return {
    id: tenantId,
    name: 'Madrasah Demo',
    nsm: '121235000001',
    npsn: '20500001',
    address: 'Jl. Pendidikan No. 1',
    city: 'Jakarta',
    province: 'DKI Jakarta',
  };
};

export const updateMadrasahInfo = async (tenantId: string, updates: any) => {
  return { success: true, tenantId, ...updates };
};

export const uploadMadrasahLogo = async (fileData: string, type: string): Promise<string> => {
  return fileData;
};

export const madrasahService = {
  getMadrasahInfo,
  updateMadrasahInfo,
  uploadMadrasahLogo,
};
