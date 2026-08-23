import { describe, expect, it } from 'vitest';
import { encodeDeltaCursor } from '../../infrastructure/datasource/SyncDataSource';

describe('Delta cursor contract', () => {
  it('encodes updatedAt and document id', () => {
    expect(encodeDeltaCursor({ updatedAt: '2026-08-23T10:00:00.000Z', id: 'doc-9' })).toBe(
      '{"updatedAt":"2026-08-23T10:00:00.000Z","id":"doc-9"}',
    );
  });

  it('orders records with equal timestamps by document id', () => {
    const records = [
      { updatedAt: '2026-08-23T10:00:00.000Z', id: 'doc-b' },
      { updatedAt: '2026-08-23T10:00:00.000Z', id: 'doc-a' },
      { updatedAt: '2026-08-23T10:01:00.000Z', id: 'doc-a' },
    ];

    const sorted = [...records].sort((a, b) => a.updatedAt.localeCompare(b.updatedAt) || a.id.localeCompare(b.id));
    expect(sorted.map((item) => item.id)).toEqual(['doc-a', 'doc-b', 'doc-a']);
  });
});
