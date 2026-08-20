// src/utils/attendanceCalculations.ts
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale/id';

export interface AttendanceStats {
  hadir: number;
  terlambat: number;
  izin: number;
  sakit: number;
  haid: number;
  alpa: number;
  pulangCepat: number;
  total: number;
}

export const calculateAttendanceStats = (data: any[]): AttendanceStats => {
  return data.reduce(
    (acc: AttendanceStats, curr) => {
      const rawTime = String(curr.statusGlobal || curr.status || '');
      const status = rawTime.toLowerCase();

      // Logika klasifikasi berdasarkan input string
      if (status.includes('haid')) acc.haid += 1;
      else if (status.includes('+')) acc.terlambat += 1;
      else if (status.includes('pc')) acc.pulangCepat += 1;
      else if (status.includes('izin')) acc.izin += 1;
      else if (status.includes('sakit')) acc.sakit += 1;
      else if (status.includes('alpa') || !curr.status) acc.alpa += 1;
      else acc.hadir += 1;

      acc.total += 1;
      return acc;
    },
    { hadir: 0, terlambat: 0, izin: 0, sakit: 0, haid: 0, alpa: 0, pulangCepat: 0, total: 0 },
  );
};

export const calculatePercentage = (stats: AttendanceStats): number => {
  if (!stats || typeof stats !== 'object') return 0;
  const total = Object.values(stats).reduce(
    (a: number, b) => (typeof b === 'number' ? a + b : a),
    0,
  );
  if (total === 0) return 0;
  return Math.round(((stats.hadir + stats.terlambat) / total) * 100);
};

export const mapRawAttendanceToRecord = (raw: any): any => {
  if (!raw) return null;

  const statusGlobal = raw.statusGlobal || raw.status || 'Alpha';

  // Helper to format scan strings to simple time
  const parseTime = (val: any) => {
    if (!val) return '--:--';
    const str = String(val).trim();
    if (str === 'Ts' || str === 'TS' || str.toLowerCase() === 'tidak scan')
      return 'TS (Tidak Scan)';
    // If it starts with HH:mm:ss, get first 5 characters
    // Like "07:12:32 [T]" or "07:12:32" or "07:12:32 + Haid"
    const match = str.match(/^(\d{2}:\d{2})/);
    if (match) {
      let res = match[1];
      if (str.toLowerCase().includes('haid')) {
        res += ' (haid)';
      } else if (str.includes('[T]')) {
        res += ' [T]';
      } else if (str.includes('[PC]')) {
        res += ' [PC]';
      }
      return res;
    }
    return str;
  };

  const getSessionStatus = (val: any): string => {
    if (!val) return 'TS';
    const str = String(val).toLowerCase();
    if (str.includes('haid')) return 'haid';
    if (str.includes('[t]')) return 'Terlambat';
    if (str.includes('[pc]')) return 'PC';
    if (str === 'ts') return 'TS';
    return 'Hadir';
  };

  const sessions = raw.sessions || {
    masuk: raw.masuk
      ? { time: parseTime(raw.masuk), status: getSessionStatus(raw.masuk) }
      : { time: '--:--', status: 'TS' },
    duha: raw.duha
      ? { time: parseTime(raw.duha), status: getSessionStatus(raw.duha) }
      : { time: '--:--', status: 'TS' },
    zuhur: raw.zuhur
      ? { time: parseTime(raw.zuhur), status: getSessionStatus(raw.zuhur) }
      : { time: '--:--', status: 'TS' },
    ashar: raw.ashar
      ? { time: parseTime(raw.ashar), status: getSessionStatus(raw.ashar) }
      : { time: '--:--', status: 'TS' },
    pulang: raw.pulang
      ? { time: parseTime(raw.pulang), status: getSessionStatus(raw.pulang) }
      : { time: '--:--', status: 'TS' },
  };

  const calculatedPoints = calculateDailyPointsPenalty({ ...raw, sessions });

  return {
    id: raw.id,
    studentsId: raw.studentsId || raw.studentId || '',
    name: raw.studentName || raw.name || raw.namaLengkap || 'Siswa',
    class: raw.class || raw.className || '',
    date: raw.date || raw.tanggal || '',
    statusGlobal,
    isHaid: raw.isHaid || statusGlobal === 'Haid',
    sessions,
    totalPointsAdded:
      raw.totalPoinHariIni !== undefined
        ? Number(raw.totalPoinHariIni)
        : raw.totalPointsAdded !== undefined
          ? Number(raw.totalPointsAdded)
          : calculatedPoints,
    totalPoinHariIni:
      raw.totalPoinHariIni !== undefined
        ? Number(raw.totalPoinHariIni)
        : raw.totalPointsAdded !== undefined
          ? Number(raw.totalPointsAdded)
          : calculatedPoints,
    tenantId: raw.tenantId || '',
    lastUpdated: raw.lastUpdated ? String(raw.lastUpdated) : '',
  };
};

/**
 * Calculate the daily points penalty for an attendance record under Point Engine rules (v7.7)
 */
export const calculateDailyPointsPenalty = (raw: any): number => {
  if (!raw) return 0;

  // Explicit pre-saved point value (Single Source of Truth)
  if (raw.totalPoinHariIni !== undefined) {
    return Number(raw.totalPoinHariIni);
  }
  if (raw.totalPointsAdded !== undefined) {
    return Number(raw.totalPointsAdded);
  }

  const statusGlobal = String(raw.statusGlobal || raw.status || '').toLowerCase();

  // Alpha check
  if (statusGlobal === 'alpha' || statusGlobal === 'a' || statusGlobal === 'alpa') {
    return 10;
  }

  // Izin / Sakit / Haid check
  if (
    statusGlobal === 'izin' ||
    statusGlobal === 'i' ||
    statusGlobal === 'sakit' ||
    statusGlobal === 's' ||
    statusGlobal === 'haid' ||
    raw.isHaid === true ||
    raw.isHaidMode === true
  ) {
    return 0;
  }

  // Sesi check
  // If any session contains TS, T, or PC, penalty is 5.
  const sessionsList = ['masuk', 'duha', 'zuhur', 'ashar', 'pulang'];
  let hasViolation = false;

  // If raw.sessions is pre-mapped
  if (raw.sessions) {
    for (const key of sessionsList) {
      const s = raw.sessions[key];
      if (s) {
        const sStatus = String(s.status || '').toLowerCase();
        const sTime = String(s.time || '').toLowerCase();
        if (
          sStatus === 'ts' ||
          sStatus === 'terlambat' ||
          sStatus === 'pc' ||
          sStatus === 't' ||
          sTime === 'ts'
        ) {
          // But wait, if isHaid is true, then prayer sessions (duha, zuhur, ashar) do not count as TS or violation!
          const isPrayer = ['duha', 'zuhur', 'ashar'].includes(key);
          if (isPrayer && (raw.isHaid || raw.isHaidMode)) {
            continue;
          }
          hasViolation = true;
        }
      }
    }
  } else {
    // Evaluate raw field properties
    for (const key of sessionsList) {
      const val = raw[key];
      const isPrayer = ['duha', 'zuhur', 'ashar'].includes(key);

      if (!val) {
        // Not scanned
        if (isPrayer && (raw.isHaid || raw.isHaidMode)) {
          continue;
        }
        hasViolation = true;
      } else {
        const valStr = String(val);
        if (
          valStr.includes('[T]') ||
          valStr.includes('[PC]') ||
          valStr.includes('TS') ||
          valStr.includes('Ts')
        ) {
          if (isPrayer && (raw.isHaid || raw.isHaidMode)) {
            continue;
          }
          hasViolation = true;
        }
      }
    }
  }

  return hasViolation ? 5 : 0;
};

/**
 * Shared utility to parse raw scan time strings (e.g. "07:05:12 [T]" or "07:05:12 | Haid")
 */
export const parseTimeWithMeta = (rawTime: string | null) => {
  if (!rawTime) return { time: '--:--', meta: null };
  const rawStr = String(rawTime);
  let time = rawStr.match(/^(\d{2}:\d{2})/)?.[1] || '--:--';
  let meta: string | null = null;

  if (rawStr.toLowerCase().includes('haid')) {
    meta = 'Haid';
  } else if (rawStr.includes('[T]')) {
    meta = 'Terlambat';
  } else if (rawStr.includes('[PC]')) {
    meta = 'Pulang Cepat';
  } else {
    const parts = rawStr.split(' | ');
    if (parts.length > 1) {
      time = parts[0].substring(0, 5);
      meta = parts[1];
    } else if (rawStr.includes('+')) {
      meta = 'Terlambat';
    }
  }

  if (time === '--:--' && rawStr !== '' && rawStr !== '--:--') {
    time = rawStr.split(' ')[0].substring(0, 5);
  }

  return { time, meta };
};

export interface MonthlyGridDay {
  dayNumber: number;
  date: string;
  dayName: string;
  formattedDate: string;
  statusGlobal: string;
  sessions: {
    masuk: string;
    duha: string;
    zuhur: string;
    ashar: string;
    pulang: string;
  };
  totalPoinHariIni: number;
  isWeekend: boolean;
  hasRecord: boolean;
}

/**
 * Builds a complete grid of days 1 to N (28-31) for a selected month,
 * mapping existing student attendance records and supplying defaults for days without records.
 */
export const buildMonthlyGridDays = (
  yearMonthStr: string | undefined,
  records: any[] = []
): { daysList: MonthlyGridDay[]; daysInMonth: number; monthName: string } => {
  const targetYearMonth =
    yearMonthStr && yearMonthStr.length === 7
      ? yearMonthStr
      : format(new Date(), 'yyyy-MM');

  const [yearStr, monthStr] = targetYearMonth.split('-');
  const year = parseInt(yearStr, 10) || new Date().getFullYear();
  const month = parseInt(monthStr, 10) || new Date().getMonth() + 1; // 1-12

  const daysInMonth = new Date(year, month, 0).getDate(); // e.g. 28, 30, 31
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const recordMap = new Map<string, any>();
  if (Array.isArray(records)) {
    records.forEach((r) => {
      if (r && r.date) {
        recordMap.set(r.date, r);
      }
    });
  }

  const daysList: MonthlyGridDay[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dayPadded = String(day).padStart(2, '0');
    const monthPadded = String(month).padStart(2, '0');
    const dateStr = `${year}-${monthPadded}-${dayPadded}`;
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const record = recordMap.get(dateStr);

    if (record) {
      daysList.push({
        dayNumber: day,
        date: dateStr,
        dayName: format(dateObj, 'eeee', { locale: localeID }),
        formattedDate: format(dateObj, 'dd MMM yyyy', { locale: localeID }),
        statusGlobal: record.statusGlobal || record.status || 'Hadir',
        sessions: {
          masuk: record.sessions?.masuk?.time || '--:--',
          duha: record.sessions?.duha?.time || '--:--',
          zuhur: record.sessions?.zuhur?.time || '--:--',
          ashar: record.sessions?.ashar?.time || '--:--',
          pulang: record.sessions?.pulang?.time || '--:--',
        },
        totalPoinHariIni: record.totalPoinHariIni ?? record.totalPointsAdded ?? 0,
        isWeekend,
        hasRecord: true,
      });
    } else {
      let defaultStatus = 'Alpha';
      if (dateStr > todayStr) {
        defaultStatus = '-';
      } else if (isWeekend) {
        defaultStatus = 'Libur';
      }

      daysList.push({
        dayNumber: day,
        date: dateStr,
        dayName: format(dateObj, 'eeee', { locale: localeID }),
        formattedDate: format(dateObj, 'dd MMM yyyy', { locale: localeID }),
        statusGlobal: defaultStatus,
        sessions: {
          masuk: '--:--',
          duha: '--:--',
          zuhur: '--:--',
          ashar: '--:--',
          pulang: '--:--',
        },
        totalPoinHariIni: 0,
        isWeekend,
        hasRecord: false,
      });
    }
  }

  const monthName = format(new Date(year, month - 1, 1), 'MMMM yyyy', { locale: localeID });

  return { daysList, daysInMonth, monthName };
};
