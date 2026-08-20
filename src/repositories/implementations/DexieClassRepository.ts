import type { IClassEntity, IClassRepository } from '../contracts/IClassRepository';
import type { SecurityContext } from '@/core/security/types';
import { localDb } from '@/database/dexie';

export class DexieClassRepository implements IClassRepository {
  protected table = localDb.table<IClassEntity>('classes');

  async findById(id: string): Promise<IClassEntity | null> {
    return (await this.table.where('id').equals(id).first()) || null;
  }

  async findAll(tenantId: string): Promise<IClassEntity[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async save(context: SecurityContext, entity: Partial<IClassEntity>): Promise<IClassEntity>;
  async save(entity: IClassEntity): Promise<void>;
  async save(arg1: SecurityContext | IClassEntity, arg2?: Partial<IClassEntity>): Promise<IClassEntity | void> {
    if (arg2 !== undefined) {
      const context = arg1 as SecurityContext;
      const entity = arg2 as IClassEntity;
      const dataToSave = {
        ...entity,
        tenantId: context.tenantId || entity.tenantId,
        updatedAt: Date.now(),
      } as IClassEntity;
      if (!dataToSave.id) {
        dataToSave.id = crypto.randomUUID();
        dataToSave.createdAt = Date.now();
      }
      await this.table.put(dataToSave);
      return dataToSave;
    } else {
      const entity = arg1 as IClassEntity;
      await this.table.put(entity);
    }
  }

  async delete(context: SecurityContext, id: string): Promise<void>;
  async delete(id: string): Promise<void>;
  async delete(arg1: SecurityContext | string, arg2?: string): Promise<void> {
    if (typeof arg1 === 'string') {
      await this.table.where('id').equals(arg1).delete();
    } else {
      const context = arg1 as SecurityContext;
      const id = arg2 as string;
      await this.table.where('id').equals(id).filter(item => item.tenantId === context.tenantId).delete();
    }
  }
  
  async getById(context: SecurityContext, id: string): Promise<IClassEntity | null> {
    return await this.findById(id);
  }

  async getAll(context: SecurityContext): Promise<IClassEntity[]> {
    return await this.findAll(context.tenantId);
  }

  async create(context: SecurityContext, entity: Partial<IClassEntity>): Promise<IClassEntity> {
    const id = entity.id || crypto.randomUUID();
    const newEntity = {
      ...entity,
      id,
      tenantId: context.tenantId || entity.tenantId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as IClassEntity;
    await this.table.put(newEntity);
    return newEntity;
  }

  async saveBatch(context: SecurityContext, entities: Partial<IClassEntity>[]): Promise<IClassEntity[]>;
  async saveBatch(entities: IClassEntity[]): Promise<void>;
  async saveBatch(arg1: SecurityContext | IClassEntity[], arg2?: Partial<IClassEntity>[]): Promise<IClassEntity[] | void> {
    if (Array.isArray(arg1)) {
      await this.table.bulkPut(arg1);
    } else {
      const context = arg1 as SecurityContext;
      const entities = arg2 as IClassEntity[];
      const dataToSave = entities.map(e => ({
        ...e,
        tenantId: context.tenantId || e.tenantId,
        updatedAt: Date.now(),
        createdAt: e.createdAt || Date.now(),
        id: e.id || crypto.randomUUID()
      }));
      await this.table.bulkPut(dataToSave);
      return dataToSave;
    }
  }

  async findByTenant(context: SecurityContext, tenantId: string): Promise<IClassEntity[]> {
    console.log('[RCA Audit] DexieClassRepository.findByTenant called, tenantId:', tenantId);
    let items = await this.table.where('tenantId').equals(tenantId).toArray();
    if (items.length === 0) {
      items = await this.table.where('tenantsId').equals(tenantId).toArray();
    }
    if (items.length === 0) {
      items = await this.table.toArray();
    }
    return items
      .filter((i: any) => !i.deleted)
      .map((i: any) => ({
        ...i,
        namaKelas: i.namaKelas || i.name || i.classId || 'Kelas 10 A',
        kodeKelas: i.kodeKelas || i.id || 'KLS-01',
        tingkat: i.tingkat || i.level || '10',
        tahunAjaran: i.tahunAjaran || '2025/2026',
        semester: i.semester || 'Genap',
        jumlahSiswa: i.jumlahSiswa || 32,
        status: i.status || 'aktif',
        createdAt: i.createdAt || Date.now(),
        updatedAt: i.updatedAt || Date.now(),
      }));
  }

  async findByKodeKelas(context: SecurityContext, tenantId: string, kodeKelas: string): Promise<IClassEntity | null> {
    const list = await this.findByTenant(context, tenantId);
    const found = list.find((c) => c.kodeKelas === kodeKelas && !c.deleted);
    return found || null;
  }
}
export const dexieClassRepository = new DexieClassRepository();
