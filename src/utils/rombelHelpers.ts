/**
 * Rombel (Rombongan Belajar) string and query helpers
 */

export const normalizeRombelName = (rombel: string = ''): string => {
  return rombel.trim().toUpperCase();
};

export const isRombelEqual = (rombelA: string = '', rombelB: string = ''): boolean => {
  return normalizeRombelName(rombelA) === normalizeRombelName(rombelB);
};

export const generateClassId = (tenantId: string = 'tenant-demo', className: string = ''): string => {
  return `cls_${tenantId}_${className.trim().replace(/\s+/g, '_').toLowerCase()}`;
};

export const parseGradeLevel = (rombel: string = ''): string => {
  const match = rombel.match(/^(X|XI|XII|7|8|9|10|11|12)/i);
  return match ? match[0].toUpperCase() : '';
};
