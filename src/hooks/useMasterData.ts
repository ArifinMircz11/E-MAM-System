import { useState, useEffect, useCallback } from 'react';
import { localDb } from '@/database/dexie';
import type { Student, Teacher, ClassData } from '@/types';

/**
 * e-Mam System - Master Data Hook (Offline-First)
 */
export const useMasterData = () => {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Priority 1: Dexie (Instant load)
      const [localClasses, localTeachers] = await Promise.all([
        localDb.classes.toArray(),
        localDb.teachers.toArray(),
      ]);

      setClasses(localClasses);
      setTeachers(localTeachers);
    } catch (error) {
      console.error('Failed to load master data from localDb', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();

    // Listen for sync events
    const handleSync = () => {
      console.log('[useMasterData] Master data synced event received, reloading from Dexie...');
      refreshData();
    };

    window.addEventListener('emam:master_data_synced', handleSync);
    return () => {
      window.removeEventListener('emam:master_data_synced', handleSync);
    };
  }, [refreshData]);

  return {
    classes,
    teachers,
    isLoading,
    refreshData,
  };
};

/**
 * Filtered Student Hook (Offline-First)
 */
export const useStudents = (className?: string) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadStudents = useCallback(async (cls?: string) => {
    setIsLoading(true);
    try {
      // Priority 1: Dexie
      let localStudents: Student[] = [];
      if (cls && cls !== 'Semua' && cls !== 'All' && cls !== 'Semua Rombel') {
        localStudents = await localDb.students.where('tingkatRombel').equals(cls).toArray();
      } else {
        localStudents = await localDb.students.toArray();
      }

      setStudents(localStudents);
    } catch (error) {
      console.error('Failed to load students from localDb', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents(className);

    // Listen for sync events
    const handleSync = () => {
      console.log(
        '[useStudents] Master data synced event received, reloading students from Dexie...',
      );
      loadStudents(className);
    };

    window.addEventListener('emam:master_data_synced', handleSync);
    return () => {
      window.removeEventListener('emam:master_data_synced', handleSync);
    };
  }, [className, loadStudents]);

  return {
    students,
    isLoading,
    reload: () => loadStudents(className),
  };
};
