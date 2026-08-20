import { useAuthStore } from '@/stores/authStore';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useStudentStore } from '@/stores/studentStore';
import { useUserStore } from '@/stores/userStore';
import type { Student, ClassData } from '@/types';
import { UserRole } from '@/types';
import {
  getReportClasses,
  getReportStudents,
  getStudentAttendanceReports,
  getTeacherAttendanceReports,
  getStudentPointsReport,
} from '@/features/reports/services/reportService';
import { getStudentData } from '@/services/studentService';
import { getUserData } from '@/services/userService';
import { getSecurityContext } from '@/core/security/contextHelper';
import { useAutoFix } from '@/hooks/useAutoFix';

export const useReports = (studentsId?: string) => {
  const { safeCall } = useAutoFix();
  const { user } = useAuthStore();
  const userRole = user?.role || UserRole.ORANG_TUA;
  const tenantId = getSecurityContext().tenantId;

  const selectedClass = useStudentStore((state) => state.selectedClass);

  const [reportType, setReportType] = useState<'daily' | 'monthly' | 'teacher' | 'points'>('daily');
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('10 A');
  const [pointTypeFilter, setPointTypeFilter] = useState<'Semua' | 'Prestasi' | 'Pelanggaran'>(
    'Semua',
  );
  const [filterNama, setFilterNama] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [studentsInClass, setStudentsInClass] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [teacherAttendance, setTeacherAttendance] = useState<any[]>([]);
  const [pointsRecords, setPointsRecords] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [isDetailView, setIsDetailView] = useState(false);
  const [walasClassLocked, setWalasClassLocked] = useState<string | null>(null);
  const [isClassListLocked, setIsClassListLocked] = useState(false);

  // Detail View State
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [studentMonthlyAtt, setStudentMonthlyAtt] = useState<any[]>([]);
  const [loadingStudentAtt, setLoadingStudentAtt] = useState(false);

  // Initial Load
  useEffect(() => {
    const fetchInitial = async () => {
      setLoading(true);
      try {
        const classesData = await getReportClasses(tenantId, true);
        setClasses(classesData);

        // Handle class lock
        const user = useAuthStore.getState().user;
        if (userRole === UserRole.WALI_KELAS && user?.id) {
          const data = await getUserData(user.uid);
          if (data?.walasOfClass) {
            setWalasClassLocked(data.walasOfClass);
            setSelectedClassFilter(data.walasOfClass);
          }
        } else if (
          (userRole === UserRole.SISWA || userRole === UserRole.KETUA_KELAS) &&
          studentsId
        ) {
          const data = await getStudentData(studentsId);
          if (data?.tingkatRombel) {
            setWalasClassLocked(data.tingkatRombel);
            setSelectedClassFilter(data.tingkatRombel);
          }
        }
      } catch (err) {
        console.error('Failed initial reports load:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, [tenantId, userRole, studentsId]);

  // Data Fetching Logic
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (reportType === 'daily' || reportType === 'monthly') {
        const students = await getReportStudents(tenantId, undefined, selectedClassFilter);
        setStudentsInClass(students);

        const records = await getStudentAttendanceReports(
          tenantId,
          reportType,
          selectedClassFilter,
          selectedDate,
          selectedMonth,
          studentsId,
        );
        setAttendanceRecords(records);
      } else if (reportType === 'teacher') {
        const records = await getTeacherAttendanceReports(tenantId, selectedDate);
        setTeacherAttendance(records);
      } else if (reportType === 'points') {
        const records = await getStudentPointsReport(
          tenantId,
          selectedClassFilter,
          selectedMonth,
          studentsId,
        );
        setPointsRecords(records);
      }
    } catch (err) {
      console.error('Failed fetching report data:', err);
      toast.error('Gagal memuat data laporan.');
    } finally {
      setLoading(false);
    }
  }, [tenantId, reportType, selectedClassFilter, selectedDate, selectedMonth, studentsId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Computed Values
  const filteredData = useMemo(() => {
    const q = filterNama.toLowerCase();
    if (reportType === 'daily' || reportType === 'monthly') {
      return studentsInClass.filter((s) => s.namaLengkap?.toLowerCase().includes(q));
    }
    if (reportType === 'teacher') {
      return teacherAttendance.filter((t) => t.teacherName?.toLowerCase().includes(q));
    }
    if (reportType === 'points') {
      return pointsRecords.filter((p) => p.studentName?.toLowerCase().includes(q));
    }
    return [];
  }, [studentsInClass, teacherAttendance, pointsRecords, filterNama, reportType]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  return {
    reportType,
    setReportType,
    selectedMonth,
    setSelectedMonth,
    selectedDate,
    setSelectedDate,
    selectedClassFilter,
    setSelectedClassFilter,
    pointTypeFilter,
    setPointTypeFilter,
    filterNama,
    setFilterNama,
    currentPage,
    setCurrentPage,
    loading,
    studentsInClass,
    classes,
    attendanceRecords,
    teacherAttendance,
    pointsRecords,
    isDetailView,
    setIsDetailView,
    walasClassLocked,
    isClassListLocked,
    selectedStudent,
    setSelectedStudent,
    studentMonthlyAtt,
    loadingStudentAtt,
    paginatedData,
    totalPages,
    refreshData: fetchData,
  };
};
