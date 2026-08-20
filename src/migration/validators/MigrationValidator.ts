/**
 * @license
 * e-Mam System - Migration Validator
 */

export class MigrationValidator {
  static validateUser(doc: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!doc.accountType || typeof doc.accountType !== 'string') {
      errors.push('accountType is mandatory and must be a string');
    }

    if (!doc.role || typeof doc.role !== 'string') {
      errors.push('role is mandatory and must be a string');
    }

    if (!Array.isArray(doc.roles)) {
      errors.push('roles must be an array');
    } else {
      const hasDuplicates = new Set(doc.roles).size !== doc.roles.length;
      if (hasDuplicates) {
        errors.push('roles[] cannot contain duplicates');
      }
    }

    if (!doc.status || typeof doc.status !== 'string') {
      errors.push('status is mandatory and must be a string');
    }

    if (!doc.tenantId || typeof doc.tenantId !== 'string') {
      errors.push('tenantId is mandatory and must be a string');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  static validateGeneric(doc: any, collection: string): { valid: boolean; errors: string[] } {
    if (collection === 'users') {
      return this.validateUser(doc);
    }
    const errors: string[] = [];
    if (!doc.id && !doc.tenantId) {
      errors.push('Document must have an id or tenantId');
    }
    return { valid: errors.length === 0, errors };
  }
}
