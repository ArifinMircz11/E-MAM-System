import { entityRegistry } from '@/domain/registry/EntityRegistry';
import { ENTITY_RELATIONS, validateRelationRegistry } from '@/domain/registry/EntityRelations';

const errors = validateRelationRegistry();

for (const entity of entityRegistry.getAll()) {
  if (!entity.dexieTable) errors.push(`[${entity.name}] missing dexieTable`);
  if (!entity.firestoreCollection) errors.push(`[${entity.name}] missing firestoreCollection`);
  if (!entity.primaryKey) errors.push(`[${entity.name}] missing primaryKey`);
  if (entity.syncEnabled && entity.firestoreCollection !== entity.firestoreCollection.trim()) {
    errors.push(`[${entity.name}] invalid firestoreCollection`);
  }
}

for (const relation of ENTITY_RELATIONS) {
  const source = entityRegistry.get(relation.from.entity);
  const target = entityRegistry.get(relation.to.entity);
  const knownSourceFields = new Set([
    source.primaryKey,
    'id',
    'tenantId',
    ...(source.indexes || []).map((value) => value.replace(/\[|\]/g, '').split('+')),
    ...(source.columns || []).map((column) => column.key),
    ...(source.formSchema || []).map((field) => field.name),
  ]);
  const knownTargetFields = new Set([target.primaryKey, 'id', 'tenantId', ...(target.indexes || []).map((value) => value.replace(/\[|\]/g, '').split('+'))]);

  if (!knownSourceFields.has(relation.from.field)) {
    errors.push(`[${relation.name}] source field '${relation.from.field}' is not declared/indexed in ${source.name}`);
  }
  if (!knownTargetFields.has(relation.to.field)) {
    errors.push(`[${relation.name}] target field '${relation.to.field}' is not declared/indexed in ${target.name}`);
  }
}

if (errors.length) {
  console.error('FK/SYNC AUDIT: FAIL');
  for (const error of errors) console.error(' - ' + error);
  process.exit(1);
}

console.log('FK/SYNC AUDIT: PASS');
console.log(`Entities: ${entityRegistry.getAll().length}`);
console.log(`Relations: ${ENTITY_RELATIONS.length}`);
console.log('Invariant: Dexie -> SyncQueue -> Firestore with explicit FK metadata.');
