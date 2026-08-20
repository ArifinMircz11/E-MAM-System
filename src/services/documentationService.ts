import { documentationRepository } from '@/repositories/DocumentationRepository';
import type { SystemDocumentation } from '@/types';
import { auditLog } from './auditLogService';
import { TenantContext } from '@/core/context/TenantContext';

export const documentationService = {
  async getDocs(): Promise<SystemDocumentation[]> {
    return await documentationRepository.getAllDocs(TenantContext.getContext().tenantId);
  },
  
  async saveDoc(doc: Partial<SystemDocumentation>): Promise<void> {
    const isNew = !doc.id;
    if (isNew) {
      await documentationRepository.create(doc as any);
    } else {
      await documentationRepository.update(doc as any);
    }
    await auditLog({
      action: isNew ? 'CREATE_DOCUMENTATION' : 'UPDATE_DOCUMENTATION',
      category: 'SYSTEM',
      details: `${isNew ? 'Created' : 'Updated'} documentation: ${doc.title}`,
    });
  },
  
  async deleteDoc(id: string): Promise<void> {
    await documentationRepository.delete(id, TenantContext.getContext().tenantId);
    await auditLog({
      action: 'DELETE_DOCUMENTATION',
      category: 'SYSTEM',
      details: `Deleted documentation ID: ${id}`,
    });
  }
};
