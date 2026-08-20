/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * LAYER: UTILS - HOLIDAY & WEEKEND DETECTOR FOR INDONESIA CALENDAR
 */

export interface HolidayResult {
  isHoliday: boolean;
  name?: string;
  type: 'weekend' | 'national' | null;
}

// Fixed/Static Indonesian National Holidays for 2025 (SKB 3 Menteri)
const INDONESIAN_HOLIDAYS_2025: Record<string, string> = {
  '2025-01-01': 'Tahun Baru 2025 Masehi',
  '2025-01-27': 'Isra Mikraj Nabi Muhammad SAW',
  '2025-01-29': 'Tahun Baru Imlek 2576 Kongzili',
  '2025-03-29': 'Hari Suci Nyepi (Tahun Baru Saka 1947)',
  '2025-03-31': 'Hari Raya Idul Fitri 1446 Hijriah (Hari 1)',
  '2025-04-01': 'Hari Raya Idul Fitri 1446 Hijriah (Hari 2)',
  '2025-04-18': 'Wafat Yesus Kristus',
  '2025-04-20': 'Hari Raya Paskah',
  '2025-05-01': 'Hari Buruh Internasional',
  '2025-05-12': 'Hari Raya Waisak 2569 BE',
  '2025-05-29': 'Kenaikan Yesus Kristus',
  '2025-06-01': 'Hari Lahir Pancasila',
  '2025-06-06': 'Hari Raya Idul Adha 1446 Hijriah',
  '2025-06-27': 'Tahun Baru Islam 1447 Hijriah',
  '2025-08-17': 'Hari Kemerdekaan RI Ke-80',
  '2025-09-05': 'Maulid Nabi Muhammad SAW',
  '2025-12-25': 'Hari Raya Natal',
};

// Estimated/Official Indonesian National Holidays for 2026
const INDONESIAN_HOLIDAYS_2026: Record<string, string> = {
  '2026-01-01': 'Tahun Baru 2026 Masehi',
  '2026-01-15': 'Isra Mikraj Nabi Muhammad SAW',
  '2026-02-17': 'Tahun Baru Imlek 2577 Kongzili',
  '2026-03-19': 'Hari Suci Nyepi (Tahun Baru Saka 1948)',
  '2026-03-20': 'Hari Raya Idul Fitri 1447 Hijriah (Hari 1)',
  '2026-03-21': 'Hari Raya Idul Fitri 1447 Hijriah (Hari 2)',
  '2026-04-03': 'Wafat Yesus Kristus',
  '2026-04-05': 'Hari Raya Paskah',
  '2026-05-01': 'Hari Buruh Internasional',
  '2026-05-21': 'Kenaikan Yesus Kristus',
  '2026-05-31': 'Hari Raya Waisak 2570 BE',
  '2026-06-01': 'Hari Lahir Pancasila',
  '2026-06-16': 'Hari Raya Idul Adha 1447 Hijriah',
  '2026-07-16': 'Tahun Baru Islam 1448 Hijriah',
  '2026-08-17': 'Hari Kemerdekaan RI Ke-81',
  '2026-08-25': 'Maulid Nabi Muhammad SAW',
  '2026-12-25': 'Hari Raya Natal',
};

// Recurring Holidays on the same date each year
const RECURRING_HOLIDAYS: Record<string, string> = {
  '01-01': 'Tahun Baru Masehi',
  '05-01': 'Hari Buruh Internasional',
  '06-01': 'Hari Lahir Pancasila',
  '08-17': 'Hari Kemerdekaan Republik Indonesia',
  '12-25': 'Hari Raya Natal',
};

/**
 * Checks if a given date string (YYYY-MM-DD) is a weekend or national holiday in Indonesia.
 */
export function getHolidayInfo(dateStr: string): HolidayResult {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { isHoliday: false, type: null };
  }

  // 1. Check for specific calendar mappings
  if (INDONESIAN_HOLIDAYS_2025[dateStr]) {
    return {
      isHoliday: true,
      name: INDONESIAN_HOLIDAYS_2025[dateStr],
      type: 'national',
    };
  }

  if (INDONESIAN_HOLIDAYS_2026[dateStr]) {
    return {
      isHoliday: true,
      name: INDONESIAN_HOLIDAYS_2026[dateStr],
      type: 'national',
    };
  }

  // 2. Check for recurring annual holidays
  const monthDay = dateStr.substring(5); // MM-DD
  if (RECURRING_HOLIDAYS[monthDay]) {
    return {
      isHoliday: true,
      name: RECURRING_HOLIDAYS[monthDay],
      type: 'national',
    };
  }

  // 3. Check for Weekends (Sabtu & Minggu)
  // We parse using UTC values or a simple Date parse to avoid timezone shift dropping day index.
  const [year, month, day] = dateStr.split('-').map(Number);
  // Month is 0-indexed in JS date constructor
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay(); // 0: Sunday, 6: Saturday

  if (dayOfWeek === 0) {
    return {
      isHoliday: true,
      name: 'Hari Libur Akhir Pekan (Minggu)',
      type: 'weekend',
    };
  }

  if (dayOfWeek === 6) {
    return {
      isHoliday: true,
      name: 'Hari Libur Akhir Pekan (Sabtu)',
      type: 'weekend',
    };
  }

  return { isHoliday: false, type: null };
}
