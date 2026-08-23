import { describe, expect, it } from 'vitest';
import { encodeDeltaCursor, getNextDeltaCursor, parseCursor } from '../../infrastructure/datasource/SyncDataSource';

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

  it('advances from page 1 checkpoint to page 2 without skipping equal-timestamp records', () => {
    const page1 = [
      { updatedAt: '2026-08-23T10:00:00.000Z', id: 'doc-a' },
      { updatedAt: '2026-08-23T10:00:00.000Z', id: 'doc-b' },
    ];
    const page2 = [
      { updatedAt: '2026-08-23T10:00:00.000Z', id: 'doc-c' },
      { updatedAt: '2026-08-23T10:01:00.000Z', id: 'doc-d' },
    ];

    const checkpoint1 = getNextDeltaCursor(page1);
    const checkpoint2 = getNextDeltaCursor(page2, checkpoint1);

    expect(parseCursor(checkpoint1)).toEqual({ updatedAt: '2026-08-23T10:00:00.000Z', id: 'doc-b' });
    expect(parseCursor(checkpoint2)).toEqual({ updatedAt: '2026-08-23T10:01:00.000Z', id: 'doc-d' });
  });

  it('rejects a non-advancing checkpoint', () => {
    const previous = encodeDeltaCursor({ updatedAt: '2026-08-23T10:00:00.000Z', id: 'doc-b' });
    expect(getNextDeltaCursor([{ updatedAt: '2026-08-23T10:00:00.000Z', id: 'doc-b' }], previous)).toBeUndefined();
  });
});
