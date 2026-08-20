import React, { useState, useEffect } from 'react';
import { getClasses } from '@/services/classService';
import { XCircleIcon, SaveIcon, Loader2 } from '@/shared/Icons';

interface StudentApprovalModalProps {
  user: any;
  onClose: () => void;
  onApprove: (data: any) => void;
}

export const StudentApprovalModal: React.FC<StudentApprovalModalProps> = ({
  user,
  onClose,
  onApprove,
}) => {
  const [formData, setFormData] = useState({
    idUnik: user.idUnik || '',
    namaLengkap: user.displayName || '',
    nisn: user.nisn || '',
    nik: '',
    tingkatRombel: '-- TANPA ROMBEL --',
    status: 'Aktif',
    jenisKelamin: 'L',
    noKip: '',
    tempatLahir: '',
    kotaKab: '',
    tanggalLahir: '',
    noTelepon: user.phone || '',
    email: user.email || '',
    alamat: '',
    namaAyah: '',
    namaIbu: '',
    namaWali: '',
    kebutuhanKhusus: 'Tidak Ada',
    disabilitas: 'Tidak Ada',
    role: user.role || 'Siswa',
  });

  const [classes, setClasses] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getClasses()
      .then((data) => {
        setClasses((data || []).map((c) => c.name).sort());
      })
      .catch((err) => {
        console.warn('Gagal memuat kelas:', err);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onApprove(formData);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-white dark:bg-[#0B1121] w-full max-w-3xl rounded-[3rem] shadow-2xl animate-in zoom-in duration-300 flex flex-col max-h-[92vh] border border-white/10 relative overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#0B1121] z-10 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white capitalize tracking-tight">
              Formulir Data Induk Siswa
            </h3>
            <p className="text-[9px] font-bold text-indigo-500 capitalize mt-1 tracking-wide">
              Akun Mandiri: {user.email}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <XCircleIcon className="w-7 h-7" />
          </button>
        </div>

        <div className="p-6 lg:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8 pb-12 bg-[#F8FAFC] dark:bg-[#0B1121]">
          <form id="approvalForm" onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-[9px] font-bold text-indigo-600 uppercase tracking-wide ml-1 mb-1.5 block">
                  ID UNIK (StudentsID) *
                </label>
                <input
                  required
                  type="text"
                  value={formData.idUnik}
                  onChange={(e) => setFormData({ ...formData, idUnik: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-4 pr-4 text-xs font-bold"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1.5 block">
                  Nama Lengkap Sesuai Ijazah *
                </label>
                <input
                  required
                  type="text"
                  value={formData.namaLengkap}
                  onChange={(e) =>
                    setFormData({ ...formData, namaLengkap: e.target.value.toUpperCase() })
                  }
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-4 pr-4 text-xs font-bold"
                  placeholder="Contoh: ADELIA SRI SUNDARI"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1.5 block">
                  NISN
                </label>
                <input
                  type="text"
                  value={formData.nisn}
                  onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-4 pr-4 text-xs font-bold"
                  placeholder="10 Digit"
                  maxLength={10}
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1.5 block">
                  NIK
                </label>
                <input
                  type="text"
                  value={formData.nik}
                  onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-4 pr-4 text-xs font-bold"
                  placeholder="16 Digit NIK"
                  maxLength={16}
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1.5 block">
                  Rombongan Belajar
                </label>
                <select
                  value={formData.tingkatRombel}
                  onChange={(e) => setFormData({ ...formData, tingkatRombel: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-4 pr-10 text-xs font-bold appearance-none"
                >
                  <option value="-- TANPA ROMBEL --">-- TANPA ROMBEL --</option>
                  {classes.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1.5 block">
                    Status Siswa
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-4 pr-4 text-xs font-bold appearance-none"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Lulus">Lulus</option>
                    <option value="Mutasi">Mutasi</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1.5 block">
                    Jenis Kelamin
                  </label>
                  <select
                    value={formData.jenisKelamin}
                    onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-4 pr-4 text-xs font-bold appearance-none"
                  >
                    <option value="L">L</option>
                    <option value="P">P</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1.5 block">
                  No. KIP / PIP
                </label>
                <input
                  type="text"
                  value={formData.noKip}
                  onChange={(e) => setFormData({ ...formData, noKip: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-4 pr-4 text-xs font-bold"
                  placeholder="Jika ada"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 md:col-span-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1.5 block">
                    Tempat Lahir
                  </label>
                  <input
                    type="text"
                    value={formData.tempatLahir}
                    onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-3 pr-3 text-xs font-bold"
                    placeholder="Kota/Kab"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1.5 block">
                    Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    value={formData.tanggalLahir}
                    onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-3 pr-3 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1.5 block">
                  No. WhatsApp / HP
                </label>
                <input
                  type="text"
                  value={formData.noTelepon}
                  onChange={(e) => setFormData({ ...formData, noTelepon: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-4 pr-4 text-xs font-bold"
                  placeholder="08..."
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1.5 block">
                  Email Siswa
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-4 pr-4 text-xs font-bold"
                  placeholder="nama@email.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1.5 block">
                  Alamat Domisili Lengkap
                </label>
                <textarea
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-4 pr-4 text-xs font-bold resize-none"
                  rows={2}
                  placeholder="Jalan, Desa/Kelurahan, Kecamatan..."
                ></textarea>
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-200 dark:border-slate-800 pt-6 mt-2">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1.5 block">
                    Nama Ayah Kandung
                  </label>
                  <input
                    type="text"
                    value={formData.namaAyah}
                    onChange={(e) => setFormData({ ...formData, namaAyah: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-4 pr-4 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1.5 block">
                    Nama Ibu Kandung
                  </label>
                  <input
                    type="text"
                    value={formData.namaIbu}
                    onChange={(e) => setFormData({ ...formData, namaIbu: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-4 pr-4 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1.5 block">
                    Nama Wali
                  </label>
                  <input
                    type="text"
                    value={formData.namaWali}
                    onChange={(e) => setFormData({ ...formData, namaWali: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-4 pr-4 text-xs font-bold"
                    placeholder="(Jika Tidak Bersama Orang Tua)"
                  />
                </div>
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1.5 block">
                    Kebutuhan Khusus
                  </label>
                  <input
                    type="text"
                    value={formData.kebutuhanKhusus}
                    onChange={(e) => setFormData({ ...formData, kebutuhanKhusus: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-4 pr-4 text-xs font-bold"
                    placeholder="Tidak Ada"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1.5 block">
                    Disabilitas
                  </label>
                  <input
                    type="text"
                    value={formData.disabilitas}
                    onChange={(e) => setFormData({ ...formData, disabilitas: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-4 pr-4 text-xs font-bold"
                    placeholder="Tidak Ada"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0B1121] flex justify-end gap-3 z-10 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-6 py-3.5 rounded-2xl font-bold text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            form="approvalForm"
            disabled={submitting}
            className="px-8 py-3.5 rounded-2xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-70 disabled:active:scale-100 flex items-center gap-2"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <SaveIcon className="w-4 h-4" />
            )}
            Approve & Simpan
          </button>
        </div>
      </div>
    </div>
  );
};
