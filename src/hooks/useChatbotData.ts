import { useState, useEffect } from 'react';
import { useAutoFix } from '@/hooks/useAutoFix';
import { getStudentData } from '@/services/studentService';
import { systemRepository } from '@/repositories/systemRepository';

/** Local-first chatbot context. Cloud recovery belongs to SyncEngine, not the UI hook. */
export function useChatbotData(isOpen: boolean, studentsId?: string) {
  const [studentData, setStudentData] = useState<any>(null);
  const [schoolData, setSchoolData] = useState<any>(null);
  const { safeCall } = useAutoFix();

  useEffect(() => {
    if (!isOpen) return;

    safeCall(async () => {
      if (studentsId && !studentData) {
        const localStudent = await getStudentData(studentsId);
        setStudentData(localStudent ?? null);
      }

      if (!schoolData) {
        const localInfo = await systemRepository.getSetting('madrasahInfo');
        setSchoolData(localInfo ?? null);
      }
    }, 'Chatbot.LocalData');
  }, [isOpen, studentsId, safeCall, studentData, schoolData]);

  return { studentData, schoolData };
}
