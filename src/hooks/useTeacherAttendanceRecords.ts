import { useState, useCallback, useEffect } from 'react';
import { useAutoFix } from '@/hooks/useAutoFix';
import { collection, query, orderBy, limit, where, doc, deleteDoc } from '@/services/dbGateway';
import { isMockMode } from '@/services/authService';
import { db } from '@/services/dbGateway';
import { localDb } from '@/database/dexie';
import { getDocsOptimized } from '@/services/sync/firestoreHelpers';
import { toast } from 'sonner';

export function useTeacherAttendanceRecords(selectedClass: string, isManagement: boolean) {
  const [data, setData] = useState<any[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { safeCall } = useAutoFix();

  const fetchClasses = useCallback(async () => {
    await safeCall(async () => {
      // 1. Try Dexie localDb first
      const localClasses = await localDb.classes.toArray();
      if (localClasses && localClasses.length > 0) {
        setClasses(localClasses.map((d) => d.name || d.id).sort());
        return;
      }
      if (isMockMode || !db) return;
      const clsData = await getDocsOptimized<any>(collection(db!, 'classes'));
      setClasses(clsData.map((d) => d.name).sort());
    }, 'TeacherAttendance.Classes');
  }, [safeCall]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    if (isMockMode) {
      setTimeout(() => {
        setData([
          {
            id: '1',
            teacherName: 'Akhmad Arifin, S.Pd',
            className: '10 A',
            distance: 15,
            status: 'VALID',
            timestamp: new Date().toISOString(),
            deviceInfo: 'iPhone 13',
          },
          {
            id: '2',
            teacherName: 'Siti Aminah, M.Pd',
            className: '10 B',
            distance: 120,
            status: 'INVALID',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            deviceInfo: 'Android 12',
          },
        ]);
        setLoading(false);
      }, 500);
      return;
    }

    await safeCall(async () => {
      const targetClass = selectedClass === 'All' ? (isManagement ? 'All' : '10 A') : selectedClass;

      // 1. Try local Dexie query first
      let localRecords = await localDb.teacher_attendance.toArray();
      if (targetClass !== 'All') {
        localRecords = localRecords.filter((r) => r.className === targetClass || r.kelas === targetClass);
      }
      if (localRecords && localRecords.length > 0) {
        localRecords.sort((a, b) => {
          const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return dateB - dateA;
        });
        setData(localRecords.slice(0, 150));
        setLoading(false);
        return;
      }

      if (!db) {
        setLoading(false);
        return;
      }

      const q =
        targetClass === 'All'
          ? query(collection(db!, 'teacher_attendance'), orderBy('timestamp', 'desc'), limit(150))
          : query(
              collection(db!, 'teacher_attendance'),
              where('className', '==', targetClass),
              limit(150),
            );
      const docsData = await getDocsOptimized<any>(q);
      if (targetClass !== 'All') {
        docsData.sort((a: any, b: any) => {
          const dateA = a.timestamp
            ? new Date(a.timestamp.seconds ? a.timestamp.seconds * 1000 : a.timestamp)
            : null;
          const dateB = b.timestamp
            ? new Date(b.timestamp.seconds ? b.timestamp.seconds * 1000 : b.timestamp)
            : null;
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return dateB.getTime() - dateA.getTime();
        });
      }
      setData(docsData);
    }, 'TeacherAttendance.Fetch');
    setLoading(false);
  }, [selectedClass, isManagement, safeCall]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus catatan presensi ini?')) return;

    if (isMockMode) {
      setData((prev) => prev.filter((d) => d.id !== id));
      toast.success('Catatan dihapus (Mode Simulasi)');
      return;
    }
    try {
      // 1. Delete from Dexie local db
      await localDb.teacher_attendance.delete(id);

      // 2. Queue for Sync Engine
      await localDb.sync_queue.add({
        id: crypto.randomUUID(),
        collection: 'teacher_attendance',
        documentId: id,
        operation: 'delete',
        payload: { id },
        status: 'pending',
        priority: 1,
        createdAt: new Date().toISOString(),
        retryCount: 0,
        deviceId: 'local',
      });

      // 3. Delete from Firestore if connected
      if (db) {
        await deleteDoc(doc(db, 'teacher_attendance', id));
      }

      setData((prev) => prev.filter((d) => d.id !== id));
      toast.success('Catatan presensi berhasil dihapus');
    } catch (e) {
      console.error(e);
      toast.error('Gagal menghapus');
    }
  };

  return { data, classes, loading, fetchData, setData, handleDeleteRecord };
}
