/**
 * Timezone utilities for Asia/Makassar (WITA / UTC+8)
 */
export function getMakassarDate(date: Date = new Date()): Date {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Makassar',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const partValues: Record<string, number> = {};
    for (const part of parts) {
      if (part.type !== 'literal') {
        partValues[part.type] = Number.parseInt(part.value, 10);
      }
    }
    return new Date(
      partValues.year,
      partValues.month - 1,
      partValues.day,
      partValues.hour,
      partValues.minute,
      partValues.second,
    );
  } catch (e) {
    // Fallback jika Asia/Makassar tidak disupport
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    return new Date(utc + 3600000 * 8);
  }
}

/**
 * Mendapatkan string tanggal format 'YYYY-MM-DD' dalam zona waktu Makassar
 */
export function getMakassarDateString(date: Date = new Date()): string {
  const mDate = getMakassarDate(date);
  const yyyy = mDate.getFullYear();
  const mm = String(mDate.getMonth() + 1).padStart(2, '0');
  const dd = String(mDate.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Mendapatkan string waktu format 'HH:mm' dalam zona waktu Makassar
 */
export function getMakassarTimeString(date: Date = new Date()): string {
  const mDate = getMakassarDate(date);
  const hh = String(mDate.getHours()).padStart(2, '0');
  const mm = String(mDate.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Mendapatkan string waktu format 'HH:mm:ss' dalam zona waktu Makassar
 */
export function getMakassarTimeWithSecondsString(date: Date = new Date()): string {
  const mDate = getMakassarDate(date);
  const hh = String(mDate.getHours()).padStart(2, '0');
  const mm = String(mDate.getMinutes()).padStart(2, '0');
  const ss = String(mDate.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}
