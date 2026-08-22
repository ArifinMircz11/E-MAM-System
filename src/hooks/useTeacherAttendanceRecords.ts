import { useState, useCallback, useEffect } from 'react';
import { useAutoFix } from '@/hooks/useAutoFix';
import { isMockMode } from '@/services/authService';
import {
  deleteTeacherAttendanceRecord,
  getTeacherAttendanceClasses,
  getTeacherAttendanceRecords,
} from '@/services/teacherAttendanceRecordsService';
import { toast } from 'sonner';

export function useTeacherAttendanceRecords(selectedClass: string, isManagement: boolean) {
  const [data, setData] = useState<any[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { safeCall } = useAutoFix();

  const fetchClasses = useCallback(async () => {
    await safeCall(async () => {
      if (isMockMode) return;
      setClasses(await getTeacherAttendanceClasses());
    }, 'TeacherAttendance.Classes');
  }, [safeCall]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    if (isMockMode) {
      setData([
        { id: '1', teacherName: 'Akhmad Arifin, S.Pd', className: '10 A', distance: 15, status: 'VALID', timestamp: new Date().toISOString(), deviceInfo: 'iPhone 13' },
        { id: '2', teacherName: 'Siti Aminah, M.Pd', className: '10 B', distance: 120, status: 'INVALID', timestamp: new Date(Date.now() - 3600000).toISOString(), deviceInfo: 'Android 12' },
      ]);
      setLoading(false);
      return;
    }

    await safeCall(async () => {
      setData(await getTeacherAttendanceRecords(selectedClass, isManagement));
    }, 'TeacherAttendance.Fetch');
    setLoading(false);
  }, [selectedClass, isManagement, safeCall]);

  useEffect(() => { void fetchClasses(); }, [fetchClasses]);
  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus catatan presensi ini?')) return;
    if (isMockMode) {
      setData((prev) => prev.filter((d) => d.id !== id));
      toast.success('Catatan dihapus (Mode Simulasi)');
      return;
    }
    try {
      await deleteTeacherAttendanceRecord(id);
      setData((prev) => prev.filter((d) => d.id !== id));
      toast.success('Catatan presensi berhasil dihapus');
    } catch (e) {
      console.error(e);
      toast.error('Gagal menghapus');
    }
  };

  return { data, classes, loading, fetchData, setData, handleDeleteRecord };
}
