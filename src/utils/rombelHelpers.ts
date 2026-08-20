/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * UTILITY: ROMBEL NORMALIZATION (e-Mam v8.0 Standard)
 */

/**
 * Menormalisasi penulisan Nama Rombel ke format standar "Tingkat Rombel" (Contoh: "10 A")
 * Mendukung konversi Romawi, pembersihan strip, underscore, dan spasi ganda.
 */
export const normalizeRombelName = (name: string | undefined | null): string => {
  if (!name) return 'BELUM_DISET';

  let normalized = name.toString().trim().toUpperCase();

  // 1. Pembersihan placeholder umum
  const placeholders = [
    '',
    '-',
    'BELUM_DISET',
    '-- TANPA ROMBEL --',
    'TANPA ROMBEL',
    'UNDEFINED',
    'NULL',
  ];
  if (placeholders.includes(normalized)) return 'BELUM_DISET';

  // 2. Mapping Tingkat Romawi -> Arab
  // Pola: ^(X|XI|XII|IX|VIII|VII)([ \-_])?(.*)$
  const romanMap: Record<string, string> = {
    XII: '12',
    XI: '11',
    X: '10',
    IX: '9',
    VIII: '8',
    VII: '7',
  };

  for (const [roman, arab] of Object.entries(romanMap)) {
    // Pastikan hanya mengganti di awal kata atau diikuti oleh separator/akhir
    const regex = new RegExp(`^${roman}([\\s\\-_])?`, 'i');
    if (regex.test(normalized)) {
      normalized = normalized.replace(regex, `${arab} `);
      break;
    }
  }

  // 3. Standarisasi Separator (Ubah strip/underscore menjadi spasi)
  normalized = normalized.replace(/[_-]/g, ' ');

  // 4. Hapus spasi ganda dan trim ulang
  normalized = normalized.replace(/\s+/g, ' ').trim();

  // 5. Pastikan format "10A" menjadi "10 A" (Suntik spasi jika angka menempel huruf)
  normalized = normalized.replace(/^(\d+)([A-Z])$/i, '$1 $2');

  return normalized;
};

/**
 * Memeriksa apakah dua nama rombel setara setelah dinormalisasi
 */
export const isRombelEqual = (
  nameA: string | null | undefined,
  nameB: string | null | undefined,
): boolean => {
  return normalizeRombelName(nameA) === normalizeRombelName(nameB);
};

/**
 * Menghasilkan ID unik untuk Rombel berbasis tenantId dan nama rombel yang dinormalisasi
 */
export const generateClassId = (tenantId: string, className: string): string => {
  if (!tenantId) return `global_${normalizeRombelName(className).replace(/\s+/g, '_')}`;
  return `${tenantId}_${normalizeRombelName(className).replace(/\s+/g, '_')}`;
};
