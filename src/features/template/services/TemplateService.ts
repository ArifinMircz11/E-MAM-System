import type { SecurityContext } from '@/core/security/types';
import { AuthorizationService } from '@/core/authorization/services/AuthorizationService';
import { TEMPLATE_PERMISSIONS } from '../permissions';
import { templateRepository } from '@/repositories/implementations/DexieTemplateRepository';
import type { ITemplateEntity } from '@/repositories/contracts/ITemplateRepository';
import type { TemplateFormData } from '../schemas/template.schema';
import { validateTemplate } from '../validators/template.validator';

export class TemplateService {
  async getList(context: SecurityContext): Promise<ITemplateEntity[]> {
    AuthorizationService.assertPermission(TEMPLATE_PERMISSIONS.view, undefined, context as any);
    return await templateRepository.getAll(context);
  }

  async getById(context: SecurityContext, id: string): Promise<ITemplateEntity | null> {
    AuthorizationService.assertPermission(TEMPLATE_PERMISSIONS.view, undefined, context as any);
    return await templateRepository.getById(context, id);
  }

  async create(context: SecurityContext, data: TemplateFormData): Promise<ITemplateEntity> {
    AuthorizationService.assertPermission(TEMPLATE_PERMISSIONS.create, undefined, context as any);
    const errors = validateTemplate(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const payload: Partial<ITemplateEntity> = {
      id: crypto.randomUUID(),
      tenantId: context.tenantId,
      name: data.name,
      description: data.description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    return await templateRepository.save(context, payload);
  }

  async update(context: SecurityContext, id: string, data: TemplateFormData): Promise<ITemplateEntity> {
    AuthorizationService.assertPermission(TEMPLATE_PERMISSIONS.update, undefined, context as any);
    const errors = validateTemplate(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const existing = await templateRepository.getById(context, id);
    if (!existing) {
      throw new Error(`Template with id ${id} not found`);
    }

    const payload: Partial<ITemplateEntity> = {
      ...existing,
      name: data.name,
      description: data.description,
      updatedAt: Date.now(),
    };

    return await templateRepository.save(context, payload);
  }

  async delete(context: SecurityContext, id: string): Promise<void> {
    AuthorizationService.assertPermission(TEMPLATE_PERMISSIONS.delete, undefined, context as any);
    await templateRepository.delete(context, id);
  }
}

export const templateService = new TemplateService();
