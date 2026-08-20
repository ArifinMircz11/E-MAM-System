import { useState, useCallback } from 'react';
import { useAutoFix } from '@/hooks/useAutoFix';
import { migrationService } from '@/services/migrationService';
import { toast } from 'sonner';

export const useSchemaMigration = (isAuthorized: boolean) => {
  const { safeCall } = useAutoFix();
  const [isRunning, setIsRunning] = useState(false);
  const [allPreviews, setAllPreviews] = useState<Record<string, { before: any; after: any }>>({});
  const [availableMigrations, setAvailableMigrations] = useState<
    { id: string; createdAt: any; processed?: number; type?: string }[]
  >([]);

  const fetchMigrations = useCallback(async () => {
    if (!isAuthorized) return;
    await safeCall(async () => {
      const data = await migrationService.fetchMigrations();
      setAvailableMigrations(data);
    }, 'MigrationService.fetchMigrations');
  }, [isAuthorized, safeCall]);

  const runPreviewAll = useCallback(
    async (collectionsToPreview: string[], fetchMasterReferences: () => Promise<any>) => {
      setIsRunning(true);
      const toastId = toast.loading('Membuat simulasi preview...');

      await safeCall(async () => {
        const results = await migrationService.previewAll(
          collectionsToPreview,
          fetchMasterReferences,
        );
        setAllPreviews(results);
        toast.success('Preview selesai.', { id: toastId });
      }, 'MigrationService.previewAll');

      setIsRunning(false);
    },
    [safeCall],
  );

  const runStudentMigration = useCallback(
    async (migrationId: string, currentUserId: string, onProgress: (stats: any) => void) => {
      setIsRunning(true);
      const toastId = toast.loading('Memulai migrasi siswa ke V2...');

      const result = await safeCall(async () => {
        const res = await migrationService.runStudentMigration(
          migrationId,
          currentUserId,
          onProgress,
        );
        toast.success('Migrasi Siswa Selesai.', { id: toastId });
        return res;
      }, 'MigrationService.runStudentMigration');

      setIsRunning(false);
      return result;
    },
    [safeCall],
  );

  const runTeacherMigration = useCallback(
    async (migrationId: string, currentUserId: string, onProgress: (stats: any) => void) => {
      setIsRunning(true);
      const toastId = toast.loading('Memulai migrasi guru ke V2...');

      const result = await safeCall(async () => {
        const res = await migrationService.runTeacherMigration(
          migrationId,
          currentUserId,
          onProgress,
        );
        toast.success('Migrasi Guru Selesai.', { id: toastId });
        return res;
      }, 'MigrationService.runTeacherMigration');

      setIsRunning(false);
      return result;
    },
    [safeCall],
  );

  const runUserMigration = useCallback(
    async (migrationId: string, currentUserId: string, onProgress: (stats: any) => void) => {
      setIsRunning(true);
      const toastId = toast.loading('Memulai migrasi users ke Canonical v2...');

      const result = await safeCall(async () => {
        const res = await migrationService.runUserMigration(
          migrationId,
          currentUserId,
          onProgress,
        );
        toast.success('Migrasi Users V2 Selesai.', { id: toastId });
        return res;
      }, 'MigrationService.runUserMigration');

      setIsRunning(false);
      return result;
    },
    [safeCall],
  );

  return {
    isRunning,
    allPreviews,
    availableMigrations,
    fetchMigrations,
    runPreviewAll,
    runStudentMigration,
    runTeacherMigration,
    runUserMigration,
  };
};
