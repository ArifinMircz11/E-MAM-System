import type { ITemplateEntity, ITemplateRepository } from '../contracts/ITemplateRepository';
import type { SecurityContext } from '@/core/security/types';
import { localDb } from '@/database/dexie';

export class DexieTemplateRepository implements ITemplateRepository {
  protected table = localDb.table<ITemplateEntity>('templates');

  async findById(id: string): Promise<ITemplateEntity | null> {
    return (await this.table.where('id').equals(id).first()) || null;
  }

  async findAll(tenantId: string): Promise<ITemplateEntity[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async save(context: SecurityContext, entity: Partial<ITemplateEntity>): Promise<ITemplateEntity>;
  async save(entity: ITemplateEntity): Promise<void>;
  async save(arg1: SecurityContext | ITemplateEntity, arg2?: Partial<ITemplateEntity>): Promise<ITemplateEntity | void> {
    if (arg2 !== undefined) {
      const context = arg1 as SecurityContext;
      const entity = arg2 as ITemplateEntity;
      const dataToSave = {
        ...entity,
        tenantId: context.tenantId || entity.tenantId,
        updatedAt: Date.now(),
      } as ITemplateEntity;
      if (!dataToSave.id) {
        dataToSave.id = crypto.randomUUID();
        dataToSave.createdAt = Date.now();
      }
      await this.table.put(dataToSave);
      return dataToSave;
    } else {
      const entity = arg1 as ITemplateEntity;
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
  
  async getById(context: SecurityContext, id: string): Promise<ITemplateEntity | null> {
    return await this.findById(id);
  }

  async getAll(context: SecurityContext): Promise<ITemplateEntity[]> {
    return await this.findAll(context.tenantId);
  }

  async create(context: SecurityContext, entity: Partial<ITemplateEntity>): Promise<ITemplateEntity> {
    const id = entity.id || crypto.randomUUID();
    const newEntity = {
      ...entity,
      id,
      tenantId: context.tenantId || entity.tenantId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as ITemplateEntity;
    await this.table.put(newEntity);
    return newEntity;
  }

  async saveBatch(context: any, entities: Partial<ITemplateEntity>[]): Promise<ITemplateEntity[]>;
  async saveBatch(entities: ITemplateEntity[]): Promise<void>;
  async saveBatch(arg1: any, arg2?: any): Promise<ITemplateEntity[] | void> {
    if (Array.isArray(arg1)) {
      await this.table.bulkPut(arg1);
    } else {
      const context = arg1 as SecurityContext;
      const entities = arg2 as ITemplateEntity[];
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

  async findByTenant(context: SecurityContext, tenantId: string): Promise<ITemplateEntity[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }
}
export const templateRepository = new DexieTemplateRepository();
