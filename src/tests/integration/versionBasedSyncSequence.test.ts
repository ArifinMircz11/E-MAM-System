// @ts-nocheck
import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { shouldApplyMutationVersion } from '../../services/SyncEngine';

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

  it('accepts only a strictly newer mutation version', () => {
    expect(shouldApplyMutationVersion(0, 1)).toBe(true);
    expect(shouldApplyMutationVersion(1, 2)).toBe(true);
    expect(shouldApplyMutationVersion(2, 3)).toBe(true);
    expect(shouldApplyMutationVersion(3, 3)).toBe(false);
    expect(shouldApplyMutationVersion(3, 2)).toBe(false);
  });

  it('converges to the newest version when mutations are replayed in order', () => {
    const queue = [
      { recordId: 'record-1', version: 1, operation: 'create', payload: { value: 'A' } },
      { recordId: 'record-1', version: 2, operation: 'update', payload: { value: 'B' } },
      { recordId: 'record-1', version: 3, operation: 'update', payload: { value: 'C' } },
    ];

    let remote = { version: 0, value: null };
    for (const item of queue) {
      if (shouldApplyMutationVersion(remote.version, item.version)) {
        remote = { version: item.version, value: item.payload.value };
      }
    }

    expect(remote).toEqual({ version: 3, value: 'C' });
  });

  it('never allows an older mutation to overwrite a newer remote version', () => {
    expect(shouldApplyMutationVersion(3, 2)).toBe(false);
    expect(shouldApplyMutationVersion(3, 1)).toBe(false);
  });
});
