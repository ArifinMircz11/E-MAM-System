import { describe, it, expect } from 'vitest';
import { sanitizeForJSON, sanitizeError } from '../src/utils/firestoreHelpers';

describe('firestoreHelpers - sanitizeForJSON', () => {
  it('harus handle objek normal tanpa mengubah isi', () => {
    const data = { nama: 'Ali', kelas: 'X-A', nilai: 90 };
    expect(sanitizeForJSON(data)).toEqual(data);
  });

  it('harus sanitasi objek circular tanpa throw', () => {
    const obj: any = { nama: 'Ali' };
    obj.self = obj;
    expect(() => sanitizeForJSON(obj)).not.toThrow();
    const sanitized = sanitizeForJSON(obj) as any;
    expect(() => JSON.stringify(sanitized)).not.toThrow();
    // The circular reference 'self' should be present but handleable or filtered if it fails stringify test inside
  });

  it('harus sanitasi objek dengan fungsi tanpa throw', () => {
    const mockSnap = {
      id: 'abc123',
      data: () => ({ nama: 'Budi', kelas: 'XI-B' }),
      exists: () => true,
    };
    const result = sanitizeForJSON(mockSnap) as any;
    expect(result.id).toBe('abc123');
    expect(typeof result.data).toBe('string');
  });

  it('sanitizeError harus kembalikan string', () => {
    const err = new Error('Test error');
    expect(typeof sanitizeError(err)).toBe('string');
    expect(sanitizeError(err)).toBe('Test error');

    const circular: any = { msg: 'Circular' };
    circular.self = circular;
    expect(typeof sanitizeError(circular)).toBe('string');
  });
});
