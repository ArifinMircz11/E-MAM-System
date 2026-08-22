import { useState, useCallback, useEffect } from 'react';
import { useAutoFix } from '@/hooks/useAutoFix';
import { getCurrentUser } from '@/services/authService';
import { getSecurityContext } from '@/core/security/contextHelper';
import { teacherRepository } from '@/repositories/teacherRepository';
import { userRepository } from '@/repositories/userRepository';
import { classRepository } from '@/repositories/classRepository';
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

      const tenantId = getSecurityContext().tenantId;
      if (!tenantId) return;

      let tProfile: any = null;
      const localUser = await userRepository.findById(user.uid, tenantId);
      const teacherId = localUser?.teacherId || localUser?.teachersId;

      if (teacherId) {
        const teacher = await teacherRepository.findById(teacherId, tenantId);
        if (teacher) tProfile = { id: teacherId, ...teacher };
      }
      setTeacherProfile(tProfile);

      const localClasses = await classRepository.findAll(tenantId);
      if (localClasses.length > 0) {
        const classMap: Record<string, ClassData> = {};
        localClasses.forEach((item: any) => {
          classMap[item.name || item.id] = item as ClassData;
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
          ((tProfile?.name || tProfile?.namaLengkap || user.displayName || '') as string);
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
