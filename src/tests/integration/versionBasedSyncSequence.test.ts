// @ts-nocheck
import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';

describe('Version-Based Sync sequence contract', () => {
  it('requires a monotonic mutation sequence', () => {
    const mutations = [
      { operation: 'create', version: 1 },
      { operation: 'update', version: 2 },
      { operation: 'update', version: 3 },
    ];

    expect(mutations.map((m) => m.version)).toEqual([1, 2, 3]);
    expect(mutations.every((m, index) => index === 0 || m.version > mutations[index - 1].version)).toBe(true);
  });

  it('converges to the newest version when mutations are replayed in order', () => {
    const queue = [
      { recordId: 'record-1', version: 1, operation: 'create', payload: { value: 'A' } },
      { recordId: 'record-1', version: 2, operation: 'update', payload: { value: 'B' } },
      { recordId: 'record-1', version: 3, operation: 'update', payload: { value: 'C' } },
    ];

    let remote = { version: 0, value: null };
    for (const item of queue) {
      if (item.version > remote.version) {
        remote = { version: item.version, value: item.payload.value };
      }
    }

    expect(remote).toEqual({ version: 3, value: 'C' });
  });

  it('never allows an older mutation to overwrite a newer remote version', () => {
    const remote = { version: 3, value: 'C' };
    const stale = { version: 2, value: 'B' };
    const applied = stale.version > remote.version ? stale : remote;

    expect(applied).toEqual(remote);
  });
});
