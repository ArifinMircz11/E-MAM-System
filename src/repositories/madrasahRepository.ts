import { db } from '@/database/db';

export class MadrasahRepository {
  async getInfo(tenantId: string = 'tenant-demo') {
    try {
      if (db.table('madrasah')) {
        return await db.table('madrasah').get(tenantId);
      }
      return null;
    } catch {
      return null;
    }
  }

  async getAll(context?: any): Promise<any[]> {
    try {
      if (db.table('madrasah')) {
        const list = await db.table('madrasah').toArray();
        if (list.length > 0) return list;
      }
    } catch {}
    return [
      {
        id: '30315537',
        identitas: { namaMadrasah: 'MAN 1 Hulu Sungai Tengah' },
      }
    ];
  }

  async saveInfo(data: any) {
    try {
      if (db.table('madrasah')) {
        await db.table('madrasah').put(data);
      }
    } catch {}
  }
}

export const madrasahRepository = new MadrasahRepository();
export const tenantRepository = madrasahRepository;
