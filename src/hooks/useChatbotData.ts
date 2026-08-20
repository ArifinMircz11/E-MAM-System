import { useState, useEffect } from 'react';
import { useAutoFix } from '@/hooks/useAutoFix';
import { doc } from '@/services/dbGateway';
import { db } from '@/services/dbGateway';
import { localDb } from '@/database/dexie';
import { getDocSafe } from '@/services/sync/firestoreHelpers';

export function useChatbotData(isOpen: boolean, studentsId?: string) {
  const [studentData, setStudentData] = useState<any>(null);
  const [schoolData, setSchoolData] = useState<any>(null);
  const { safeCall } = useAutoFix();

  useEffect(() => {
    if (!isOpen) return;

    if (studentsId && !studentData) {
      safeCall(async () => {
        // 1. Try local Dexie first
        const localStudent = await localDb.students.get(studentsId);
        if (localStudent) {
          setStudentData(localStudent);
          return;
        }
        // 2. Fallback to Firestore if not cached locally
        if (db) {
          const data = await getDocSafe(doc(db, 'students', studentsId));
          if (data) setStudentData(data);
        }
      }, 'Chatbot.StudentData');
    }

    if (!schoolData) {
      safeCall(async () => {
        // 1. Try local Dexie settings first
        const localInfo = await localDb.systemSettings.get('madrasahInfo');
        if (localInfo?.value) {
          setSchoolData(localInfo.value);
          return;
        }
        // 2. Fallback to Firestore
        if (db) {
          const data = await getDocSafe(doc(db, 'settings', 'madrasahInfo'));
          if (data) setSchoolData(data);
        }
      }, 'Chatbot.SchoolData');
    }
  }, [isOpen, studentsId, safeCall, studentData, schoolData]);

  return { studentData, schoolData };
}
