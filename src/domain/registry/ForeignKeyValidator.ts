import type { EMamDatabase } from '@/core/database/db';
import { entityRegistry } from './EntityRegistry';
import { ENTITY_RELATIONS, validateRelationShape } from './EntityRelations';

export async function validateForeignKeys(
  db: EMamDatabase,
  entityName: string,
  payload: Record<string, unknown>,
  options: { strict?: boolean } = {},
): Promise<void> {
  const strict = options.strict ?? true;
  const shapeErrors = validateRelationShape(entityName, payload);
  if (shapeErrors.length && strict) throw new Error(shapeErrors.join('; '));

  const relations = ENTITY_RELATIONS.filter((relation) => relation.from.entity === entityName);
  const errors: string[] = [];

  for (const relation of relations) {
    const raw = payload[relation.from.field];
    if (raw === undefined || raw === null || raw === '') continue;

    const values = Array.isArray(raw) ? raw : [raw];
    const target = entityRegistry.get(relation.to.entity);
    const table = db.table(target.dexieTable);

    for (const value of values) {
      const key = String(value);
      const targetRecord =
        relation.to.field === target.primaryKey || relation.to.field === 'id'
          ? await table.get(key)
          : await table.where(relation.to.field).equals(key).first();

      if (!targetRecord || (targetRecord as any).deleted === true) {
        errors.push(`[${relation.name}] FK ${relation.from.field}='${key}' tidak ditemukan pada ${target.dexieTable}.`);
        continue;
      }

      const sourceTenant = payload.tenantId;
      const targetTenant = (targetRecord as any).tenantId;
      if (sourceTenant && targetTenant && sourceTenant !== targetTenant) {
        errors.push(`[${relation.name}] tenant mismatch: ${sourceTenant} != ${targetTenant}.`);
      }
    }
  }

  if (errors.length && strict) throw new Error(errors.join('; '));
}
