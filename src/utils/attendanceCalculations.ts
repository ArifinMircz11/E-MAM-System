export interface MonthlyGridDay {
  dayNumber: number;
  dateStr: string;
  dayName: string;
  isWeekend: boolean;
}

export const buildMonthlyGridDays = (year: number, month: number): MonthlyGridDay[] => {
  const days: MonthlyGridDay[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month - 1, i);
    const dayOfWeek = d.getDay();
    days.push({
      dayNumber: i,
      dateStr: `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
      dayName: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][dayOfWeek],
      isWeekend: dayOfWeek === 0 || dayOfWeek === 5,
    });
  }
  return days;
};

export const calculateAttendanceStats = (records: any[]) => {
  return {
    present: records.filter(r => r.status === 'H').length,
    sick: records.filter(r => r.status === 'S').length,
    permission: records.filter(r => r.status === 'I' || r.status === 'P').length,
    alpha: records.filter(r => r.status === 'A').length,
    total: records.length,
  };
};

export const mapRawAttendanceToRecord = (raw: any) => {
  return {
    ...raw,
    id: raw.id || `att_${Date.now()}`,
    status: raw.status || 'H',
  };
};

export const parseTimeWithMeta = (rawTime: string = ''): { time: string; meta: string } => {
  if (!rawTime) return { time: '--:--', meta: '' };
  
  const trimStr = rawTime.trim();
  if (!trimStr || trimStr === '--:--') {
    return { time: '--:--', meta: '' };
  }
  
  const match = trimStr.match(/^(\d{2}:\d{2})\s*[\(\[]?([^\)\]]*)[\)\]]?/);
  if (match) {
    return {
      time: match[1],
      meta: match[2] ? match[2].trim() : '',
    };
  }
  
  return { time: trimStr, meta: '' };
};

export const attendanceCalculations = {
  buildMonthlyGridDays,
  calculateAttendanceStats,
  mapRawAttendanceToRecord,
  parseTimeWithMeta,
};

