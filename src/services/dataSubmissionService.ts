export const submitDataRequest = async (userId: string, data: any, referenceId?: string): Promise<boolean> => {
  try {
    const { db } = await import('@/database/db');
    if (db.table('letters')) {
      await db.table('letters').put({
        id: `submission_${Date.now()}`,
        tenantId: '30315537',
        studentId: userId,
        studentName: 'Pengguna Sistem',
        type: 'Izin',
        title: 'Pengajuan Data / Perbaikan Profil',
        description: `Pengajuan perbaikan profil dari user. Reference: ${referenceId || 'N/A'}. Data: ${JSON.stringify(data)}`,
        status: 'Diproses',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  } catch {}
  return true;
};

export const dataSubmissionService = {
  submitDataRequest,
  submitData: async (submission: any) => ({ success: true }),
  getSubmissions: async () => [],
};
