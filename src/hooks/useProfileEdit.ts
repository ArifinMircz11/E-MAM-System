import { useState } from 'react';
import { useAutoFix } from './useAutoFix';
import { updateFullProfileAndAuth } from '../services/userService';
import { toast } from 'sonner';

export const useProfileEdit = (profile: any, setProfile: any) => {
  const { safeCall } = useAutoFix();
  const [loading, setLoading] = useState({ akun: false, dataPokok: false });

  const updateAkun = async (akunForm: any) => {
    setLoading((prev) => ({ ...prev, akun: true }));
    await safeCall(async () => {
      const isStudent = ['siswa', 'ketua_kelas'].includes(profile.role?.toLowerCase() || '');
      await updateFullProfileAndAuth(
        profile.uid,
        { ...profile, ...akunForm },
        isStudent,
        akunForm.displayName,
      );
      setProfile((prev: any) => ({ ...prev, ...akunForm }));
      toast.success('Akun berhasil diperbarui.');
    }, 'useProfileEdit.UpdateAkun');
    setLoading((prev) => ({ ...prev, akun: false }));
  };

  const updateDataPokok = async (dataPokokForm: any) => {
    setLoading((prev) => ({ ...prev, dataPokok: true }));
    await safeCall(async () => {
      const isStudent = ['siswa', 'ketua_kelas'].includes(profile.role?.toLowerCase() || '');
      await updateFullProfileAndAuth(
        profile.uid,
        { ...profile, ...dataPokokForm },
        isStudent,
        dataPokokForm.displayName,
      );
      setProfile((prev: any) => ({ ...prev, ...dataPokokForm }));
      toast.success('Data Pokok berhasil diperbarui.');
    }, 'useProfileEdit.UpdateDataPokok');
    setLoading((prev) => ({ ...prev, dataPokok: false }));
  };

  return { loading, updateAkun, updateDataPokok };
};
