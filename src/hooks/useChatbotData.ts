import { useState, useEffect } from 'react';
import { useAutoFix } from '@/hooks/useAutoFix';
import { firestoreGateway } from '@/services/gateways/FirestoreGateway';
import { getStudentData } from '@/services/studentService';
import { systemRepository } from '@/repositories/systemRepository';
import { doc, getDoc } from '@/services/gateways/FirestoreGateway';

export function useChatbotData(isOpen: boolean, studentsId?: string) {
  const [studentData, setStudentData] = useState<any>(null);
  const [schoolData, setSchoolData] = useState<any>(null);
  const { safeCall } = useAutoFix();

  useEffect(() => {
    if (!isOpen) return;

    if (studentsId && !studentData) {
      safeCall(async () => {
        const localStudent = await getStudentData(studentsId);
        if (localStudent) {
          setStudentData(localStudent);
          return;
        }

        const snapshot = await getDoc(doc(firestoreGateway.db, 'students', studentsId));
        if (snapshot.exists()) setStudentData(snapshot.data());
      }, 'Chatbot.StudentData');
    }

    if (!schoolData) {
      safeCall(async () => {
        const localInfo = await systemRepository.getSetting('madrasahInfo');
        if (localInfo) {
          setSchoolData(localInfo);
          return;
        }

        const snapshot = await getDoc(doc(firestoreGateway.db, 'settings', 'madrasahInfo'));
        if (snapshot.exists()) setSchoolData(snapshot.data());
      }, 'Chatbot.SchoolData');
    }
  }, [isOpen, studentsId, safeCall, studentData, schoolData]);

  return { studentData, schoolData };
}
