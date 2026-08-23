// @ts-nocheck
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EMamDatabase } from '../../core/database/db';
import { DatabaseResolver } from '../../core/database/DatabaseResolver';
import { BaseRepository } from '../../repositories/BaseRepository';
import { SyncStatus } from '../../domain/entities/base';

type TestEntity = {
  id: string;
  tenantId: string;
  createdAt: number;
  updatedAt: number;
  version: number;
  syncStatus: SyncStatus;
  deleted: boolean;
  name: string;
};

class TestRepository extends BaseRepository<TestEntity> {
  constructor() {
    super('users');
  }
}

const context = {
  uid: 'user-test',
  tenantId: 'tenant-test',
  role: 'admin',
  roles: ['admin'],
  isDeveloper: false,
  permissions: ['*'],
};

describe('BaseRepository offline outbox contract', () => {
  let db: EMamDatabase;
  let repository: TestRepository;

  beforeEach(async () => {
    db = new EMamDatabase(`Test_BaseRepository_${Date.now()}_${Math.random()}`);
    await db.open();
    DatabaseResolver.setDatabase(db);
    repository = new TestRepository();
  });

  afterEach(async () => {
    DatabaseResolver.reset();
    if (db.isOpen()) await db.delete();
  });

  it('creates locally with version 1 and a canonical create outbox item', async () => {
    const entity = await repository.save(context, { name: 'Alpha', deleted: false } as any);

    expect(entity.version).toBe(1);
    expect(entity.syncStatus).toBe(SyncStatus.PENDING);

    const stored = await db.users.get(entity.id);
    const queue = await db.sync_queue.toArray();

    expect(stored?.version).toBe(1);
    expect(queue).toHaveLength(1);
    expect(queue[0].operation).toBe('create');
    expect(queue[0].recordId).toBe(entity.id);
    expect(queue[0].metadata.version).toBe(1);
  });

  it('increments the local version for consecutive offline updates', async () => {
    const created = await repository.save(context, { name: 'Alpha', deleted: false } as any);
    const updated1 = await repository.save(context, { id: created.id, name: 'Beta' } as any);
    const updated2 = await repository.save(context, { id: created.id, name: 'Gamma' } as any);

    expect(updated1.version).toBe(2);
    expect(updated2.version).toBe(3);

    const stored = await db.users.get(created.id);
    const queue = (await db.sync_queue.toArray()).sort((a, b) => a.metadata.version - b.metadata.version);

    expect(stored?.version).toBe(3);
    expect(queue.map((item) => item.operation)).toEqual(['create', 'update', 'update']);
    expect(queue.map((item) => item.metadata.version)).toEqual([1, 2, 3]);
  });

  it('persists batch records and all outbox entries atomically', async () => {
    const result = await repository.saveBatch(context, [
      { name: 'One', deleted: false },
      { name: 'Two', deleted: false },
    ] as any);

    expect(result).toHaveLength(2);
    expect(result.every((item) => item.version === 1)).toBe(true);

    const stored = await db.users.toArray();
    const queue = await db.sync_queue.toArray();

    expect(stored).toHaveLength(2);
    expect(queue).toHaveLength(2);
    expect(queue.every((item) => item.operation === 'create')).toBe(true);
  });
});
