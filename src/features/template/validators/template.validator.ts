import type { TemplateFormData } from '../schemas/template.schema';

export function validateTemplate(data: Partial<TemplateFormData>): string[] {
  const errors: string[] = [];
  if (!data.name || data.name.trim() === '') {
    errors.push('Name is required');
  }
  if (!data.description || data.description.trim() === '') {
    errors.push('Description is required');
  }
  return errors;
}
