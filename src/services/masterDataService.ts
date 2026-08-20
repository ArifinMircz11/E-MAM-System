import { useUserStore } from '@/stores/userStore';
import { teacherRepository } from '@/repositories/teacherRepository';
import { subjectRepository } from '@/repositories/SubjectRepository';

/**
 * e-Mam System v8.0 - Enterprise Repository Based Master Data Service
 */

interface MinimalData {
  id: string; // idUnik, NIP/NIK, or subject ID
  name: string;
}

/**
 * Get Teacher Minimal Data (id, name)
 * Reads from Dexie via TeacherRepository
 */
export const getTeacherMasterDataMinimal = async (): Promise<MinimalData[]> => {
  const tenantId = useUserStore.getState().tenantId;
  if (!tenantId) {
    console.warn('[MasterDataService] No tenantId found, skipping teacher fetch.');
    return [];
  }

  try {
    const teachers = await teacherRepository.findAll(tenantId);
    return teachers
      .map((t) => ({
        id: t.id || t.nip || (t as any).idUnik,
        name: (t as any).name || t.namaLengkap || 'Tanpa Nama',
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('[MasterDataService] Error fetching teacher master data:', error);
    return [];
  }
};

/**
 * Get Subject Minimal Data (id, name)
 * Reads from Dexie via SubjectRepository
 */
export const getSubjectMasterDataMinimal = async (): Promise<MinimalData[]> => {
  const tenantId = useUserStore.getState().tenantId;
  if (!tenantId) {
    console.warn('[MasterDataService] No tenantId found, skipping subject fetch.');
    return [];
  }

  try {
    const subjects = await subjectRepository.findAll(tenantId);
    return subjects
      .map((s) => ({
        id: s.id,
        name: s.name || 'Tanpa Nama',
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('[MasterDataService] Error fetching subject master data:', error);
    return [];
  }
};
