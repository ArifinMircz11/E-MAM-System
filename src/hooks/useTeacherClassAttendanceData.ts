import { useState, useCallback, useEffect } from 'react';
import { useAutoFix } from '@/hooks/useAutoFix';
import { doc } from '@/services/dbGateway';
import { isMockMode, getCurrentUser } from '@/services/authService';
import { db, collection } from '@/services/dbGateway';
import { localDb } from '@/database/dexie';
import { getDocSafe, getDocsOptimized } from '@/services/sync/firestoreHelpers';
import { getSchedules } from '@/services/scheduleService';
import type { ScheduleItem, ClassData } from '@/types';

export function useTeacherClassAttendanceInit(
  selectedClassId: string | undefined,
  currentDay: string,
) {
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [classes, setClasses] = useState<Record<string, ClassData>>({});
  const [teacherProfile, setTeacherProfile] = useState<any | null>(null);
  const { safeCall } = useAutoFix();

  const init = useCallback(async () => {
    setLoading(true);
    await safeCall(async () => {
      const user = getCurrentUser();
      if (!user) return;

      let tProfile: any = null;

      // 1. Try local Dexie first for teacher profile
      const localUser = await localDb.users.get(user.uid);
      const teacherId = localUser?.teacherId || localUser?.teachersId;
      if (teacherId) {
        const localTeacher = await localDb.teachers.get(teacherId);
        if (localTeacher) {
          tProfile = { id: teacherId, ...localTeacher };
        }
      }

      // Fallback to Firestore if local cache miss
      if (!tProfile && !isMockMode && db) {
        const userDoc = await getDocSafe<any>(doc(db, 'users', user.uid));
        if (userDoc) {
          const tId = userDoc.teacherId || userDoc.teachersId;
          if (tId) {
            const teacherDoc = await getDocSafe<any>(doc(db, 'teachers', tId));
            if (teacherDoc) {
              tProfile = { id: tId, ...teacherDoc };
            }
          }
        }
      }
      setTeacherProfile(tProfile);

      // 2. Query classes from local Dexie first
      const localClasses = await localDb.classes.toArray();
      if (localClasses && localClasses.length > 0) {
        const classMap: Record<string, ClassData> = {};
        localClasses.forEach((d: any) => {
          classMap[d.name || d.id] = d as ClassData;
        });
        setClasses(classMap);
      } else if (db && !isMockMode) {
        const classList = await getDocsOptimized<any>(collection(db, 'classes'));
        const classMap: Record<string, ClassData> = {};
        classList.forEach((d: any) => {
          classMap[d.name] = d as ClassData;
        });
        setClasses(classMap);
      }

      const allSchedules = await getSchedules();

      let mySchedules: ScheduleItem[] = [];
      if (selectedClassId) {
        mySchedules = allSchedules.filter(
          (s) => s.class === selectedClassId && s.day === currentDay,
        );
      } else {
        const nameToMatch =
          (((teacherProfile as any)?.name || (teacherProfile as any)?.namaLengkap || getCurrentUser()?.displayName || '') as string);
        mySchedules = allSchedules.filter(
          (s) => s.teacherName === nameToMatch && s.day === currentDay,
        );
      }

      mySchedules.sort((a, b) => a.time.localeCompare(b.time));
      setSchedules(mySchedules);
    }, 'TeacherClassAttendance.Init');
    setLoading(false);
  }, [selectedClassId, currentDay, safeCall]);

  useEffect(() => {
    init();
  }, [init]);

  return { loading, schedules, classes, teacherProfile };
}
