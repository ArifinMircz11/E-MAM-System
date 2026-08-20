import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { XMarkIcon, SaveIcon, UserIcon, IdentificationIcon, Loader2 } from '@/shared/Icons';

export const AccountEditModal = ({
  user,
  onClose,
  onUpdate,
}: {
  user: any;
  onClose: () => void;
  onUpdate: () => void;
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState<any>({});
  const [profileData, setProfileData] = useState<any>({});
  const [profileCollection, setProfileCollection] = useState<string>('');
  const [profileId, setProfileId] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch User
        const { getUserData } = await import('@/services/userService');
        const userSnapData = await getUserData(user.id || user.uid);
        if (userSnapData) {
          setUserData(userSnapData);
        } else {
          setUserData(user); // fallback
        }

        // Determine Profile
        const role = user.role?.toLowerCase() || '';
        let coll = '';
        let refId = '';

        if (role === 'siswa') {
          coll = 'students';
          refId = user.studentsId || user.studentId || user.idUnik || user.nisn;
        } else if (
          ['guru', 'wali_kelas', 'kepala_madrasah', 'kepala_tu', 'guru_bk', 'staf', 'gtk'].includes(
            role,
          )
        ) {
          coll = 'teachers';
          refId = user.teachersId || user.teacherId || user.idUnik || user.nip;
        }

        setProfileCollection(coll);
        setProfileId(refId);

        if (coll && refId) {
          if (coll === 'students') {
            const { getStudentData } = await import('@/services/studentService');
            const profSnapData = await getStudentData(refId);
            if (profSnapData) {
              setProfileData(profSnapData);
            }
          } else if (coll === 'teachers') {
            const { getTeacherData } = await import('@/services/teacherService');
            const profSnapData = await getTeacherData(refId);
            if (profSnapData) {
              setProfileData(profSnapData);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load user/profile data', err);
        toast.error('Gagal memuat data pengguna.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update User
      const { updateUser } = await import('@/services/userService');
      await updateUser(user.id || user.uid, userData);

      // Update Profile
      if (profileCollection && profileId && Object.keys(profileData).length > 0) {
        if (profileCollection === 'students') {
          const { updateStudent } = await import('@/services/studentService');
          await updateStudent(profileId, profileData);
        } else if (profileCollection === 'teachers') {
          const { updateTeacher } = await import('@/services/teacherService');
          await updateTeacher(profileId, profileData);
        }
      }

      toast.success('Data berhasil diperbarui!');
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Save error: ', err);
      toast.error('Gagal menyimpan perubahan data.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center">
              <UserIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-tight">
                Edit Data Akun
              </h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">
                {user.displayName || user.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 text-slate-400 hover:text-rose-500 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-indigo-500 gap-3">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Memuat Data...
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* USER DATA */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide text-xs">
                    Data Pengguna (users)
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 ml-1">
                      Nama Tampilan
                    </label>
                    <input
                      type="text"
                      value={userData.displayName || ''}
                      onChange={(e) => setUserData({ ...userData, displayName: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 ml-1">
                      Role Utama
                    </label>
                    <input
                      type="text"
                      value={userData.role || ''}
                      onChange={(e) => setUserData({ ...userData, role: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 ml-1">
                      ID Unik / Referensi
                    </label>
                    <input
                      type="text"
                      value={userData.idUnik || userData.studentsId || userData.teacherId || ''}
                      onChange={(e) => setUserData({ ...userData, idUnik: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 ml-1">
                      Status Akun
                    </label>
                    <select
                      value={userData.accountStatus || userData.status || 'pending'}
                      onChange={(e) =>
                        setUserData({
                          ...userData,
                          accountStatus: e.target.value,
                          status: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    >
                      <option value="pending_account_approval">Pending (Onboarding)</option>
                      <option value="pending_approval">Pending (Legacy)</option>
                      <option value="needs_data_linkage">Need Data Linkage</option>
                      <option value="Active">Active</option>
                      <option value="Nonaktif">Nonaktif / Suspended</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* PROFILE DATA */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
                    <IdentificationIcon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide text-xs">
                    Data Profil ({profileCollection || 'Tidak ditautkan'})
                  </h3>
                </div>
                {profileCollection && Object.keys(profileData).length > 0 ? (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 ml-1">
                        Nama Lengkap (Master)
                      </label>
                      <input
                        type="text"
                        value={profileData.namaLengkap || profileData.name || ''}
                        onChange={(e) =>
                          setProfileData({ ...profileData, namaLengkap: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 ml-1">
                        {profileCollection === 'students' ? 'NISN' : 'NIP / NIK'}
                      </label>
                      <input
                        type="text"
                        value={
                          profileCollection === 'students'
                            ? profileData.nisn || ''
                            : profileData.nip || profileData.nik || ''
                        }
                        onChange={(e) =>
                          profileCollection === 'students'
                            ? setProfileData({ ...profileData, nisn: e.target.value })
                            : setProfileData({ ...profileData, nip: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                    {profileCollection === 'students' && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 ml-1">
                          Tingkat/Rombel
                        </label>
                        <input
                          type="text"
                          value={profileData.tingkatRombel || ''}
                          onChange={(e) =>
                            setProfileData({ ...profileData, tingkatRombel: e.target.value })
                          }
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                      </div>
                    )}
                    {profileCollection === 'teachers' && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 ml-1">
                          Jabatan Utama
                        </label>
                        <input
                          type="text"
                          value={profileData.jabatanDanStatus?.jabatanUtama || ''}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              jabatanDanStatus: {
                                ...(profileData.jabatanDanStatus || {}),
                                jabatanUtama: e.target.value,
                              },
                            })
                          }
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <IdentificationIcon className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      Data profil terhubung belum ada
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Pengguna ini mungkin belum ditautkan ke data master
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-6 py-3.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-100 hover:dark:bg-slate-700 transition-all text-xs uppercase tracking-wide shadow-sm active:scale-95"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-indigo-600/20 transition-all text-xs uppercase tracking-wide active:scale-95 flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <SaveIcon className="w-4 h-4" />
            )}
            Simpan Perubahan
          </button>
        </div>
      </motion.div>
    </div>
  );
};
