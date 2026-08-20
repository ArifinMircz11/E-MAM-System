/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useTeachers } from './hooks/useTeachers';
import { TeacherBulkUploadModal } from '@/features/teachers/components/TeacherBulkUploadModal';
import { activateTeacherAccount } from '@/services/teacherService';
import type { Teacher } from '@/types';
import { UserRole, COMMON_SUBJECTS } from '@/types';
import { EmploymentStatus, AsnStatus } from '@/types/roles';
import { getFriendlyErrorMessage } from '@/services/authService';
import { toast } from 'sonner';
import { writeJSONToExcel } from '@/utils/excelHelper';
import Layout from '@/layouts/Layout';
import { useStudentStore } from '@/stores/studentStore';
import { useUserStore } from '@/stores/userStore';
import {
  BriefcaseIcon,
  Search,
  PlusIcon,
  BookOpenIcon,
  IdentificationIcon,
  ChevronDownIcon,
} from '@/shared/Icons';
import {
  RefreshCwIcon,
  CheckCircleIcon,
  CopyIcon,
  XCircleIcon,
} from 'lucide-react';

// Sub-components
import { TeacherList } from './components/TeacherList';
import { TeacherFormModal } from './components/TeacherFormModal';
import { TeacherDetailModal } from './components/TeacherDetailModal';

const TeacherData: React.FC<{ onBack: () => void; userRole: UserRole }> = ({
  onBack,
  userRole,
}) => {
  const [filterNama, setFilterNama] = useState('');
  const [filterNIP, setFilterNIP] = useState('');
  const [filterMapel, setFilterMapel] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const {
    teachers: processedTeachers,
    allTeachers: teachers,
    loading,
    refresh: fetchTeachersData,
    add,
    update,
    remove: deleteTeacherData
  } = useTeachers({
    nama: filterNama,
    nip: filterNIP,
    mapel: filterMapel,
    status: selectedStatus
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState<Teacher | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<Teacher | null>(null);
  const [tempPassword, setTempPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const [claimActive, setClaimActive] = useState(false);
  const [initialPassword, setInitialPassword] = useState('');
  
  const tenantId = useUserStore.getState().tenantId || 'global';

  const [formData, setFormData] = useState<Partial<Teacher>>({
    namaLengkap: '',
    idUnik: '',
    nip: '',
    nik: '',
    email: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisKelamin: 'L',
    photoURL: '',
    role: UserRole.GURU,
    employmentStatus: EmploymentStatus.HONORER,
    asnStatus: AsnStatus.NON_ASN,
    jabatan: 'Guru Mapel',
    jabatanDanStatus: {
      jabatanUtama: 'Guru Mapel',
      statusPegawai: EmploymentStatus.HONORER,
      pangkatGolongan: '-',
      pendidikanTerakhir: 'S1',
    },
    penugasanAkademik: {
      isWaliKelas: false,
      waliKelasDi: null,
      mapelUtama: '',
      totalJTM: '0',
      isPembinaEkskul: false,
    },
    kontak: {
      nomorHpWhatsApp: '',
      alamatLengkap: '',
    },
    sistemJangkar: {
      tenantId: tenantId,
      userId: '',
      roleSistem: 'guru',
      isClaimed: false,
      ttdDigitalUrl: '',
      diperbaruiPada: new Date().toISOString(),
      diperbaruiOleh: 'Admin',
    },
  });

  const canManage = userRole === UserRole.ADMIN || userRole === UserRole.DEVELOPER || userRole === UserRole.SUPER_ADMIN;

  const generateTempPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleResetAuth = async (teacher: Teacher) => {
    const targetId = teacher.teachersId || teacher.id || teacher.idUnik || '';
    if (!teacher.email) {
      toast.error('Wajib mengisi email guru sebelum aktivasi.');
      handleEdit(teacher);
      return;
    }

    if (
      !window.confirm(
        `Yakin ingin mengaktifkan/reset akun ${teacher.namaLengkap || teacher.name}? Password baru akan dibuat secara otomatis.`,
      )
    )
      return;

    setResetting(targetId);
    const password = generateTempPassword();
    setTempPassword(password);

    try {
      await activateTeacherAccount(
        targetId,
        teacher.email,
        teacher.role || UserRole.GURU,
        password,
      );

      setShowSuccessModal(teacher);
      toast.success('Akun berhasil diaktifkan!');
      fetchTeachersData();
    } catch (error: any) {
      console.error('Activation error:', error);
      toast.error(error.message || 'Gagal mengaktifkan akun.');
    } finally {
      setResetting(null);
    }
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    toast.success('Password tersalin');
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchClasses = useStudentStore((state) => state.fetchClasses);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleEdit = (teacher: Teacher) => {
    const pk = teacher.idUnik || teacher.teachersId || teacher.id || '';
    setEditingId(pk);
    setFormData({
      ...teacher,
      idUnik: pk,
      namaLengkap: teacher.namaLengkap || teacher.name || '',
      jenisKelamin: teacher.jenisKelamin || teacher.gender || 'L',
      tanggalLahir: teacher.tanggalLahir || teacher.birthDate || '',
      employmentStatus: teacher.employmentStatus || (teacher.status as EmploymentStatus) || EmploymentStatus.HONORER,
      asnStatus: teacher.asnStatus || (['PNS', 'PPPK'].includes(teacher.status || '') ? AsnStatus.ASN : AsnStatus.NON_ASN),
      jabatan: teacher.jabatan || teacher.jabatanDanStatus?.jabatanUtama || 'Guru Mapel',
      jabatanDanStatus: {
        jabatanUtama: teacher.jabatanDanStatus?.jabatanUtama || 'Guru Mapel',
        statusPegawai: teacher.jabatanDanStatus?.statusPegawai || teacher.status || EmploymentStatus.HONORER,
        pangkatGolongan: teacher.jabatanDanStatus?.pangkatGolongan || '',
        pendidikanTerakhir: teacher.jabatanDanStatus?.pendidikanTerakhir || 'S1',
      } as any,
      penugasanAkademik: {
        isWaliKelas: teacher.penugasanAkademik?.isWaliKelas || !!teacher.tingkatRombel || false,
        waliKelasDi: teacher.penugasanAkademik?.waliKelasDi || teacher.tingkatRombel || null,
        mapelUtama: teacher.penugasanAkademik?.mapelUtama || teacher.mapel || teacher.subject || '',
        totalJTM: teacher.penugasanAkademik?.totalJTM || String(teacher.totalJTM || '0'),
        isPembinaEkskul: teacher.penugasanAkademik?.isPembinaEkskul || false,
      } as any,
      kontak: {
        nomorHpWhatsApp: teacher.kontak?.nomorHpWhatsApp || teacher.phone || '',
        alamatLengkap: teacher.kontak?.alamatLengkap || teacher.address || '',
      } as any,
      sistemJangkar: {
        tenantId: teacher.sistemJangkar?.tenantId || teacher.tenantId || tenantId,
        userId: teacher.sistemJangkar?.userId || pk,
        roleSistem: teacher.sistemJangkar?.roleSistem || (teacher.role || 'GURU').toUpperCase(),
        isClaimed: teacher.sistemJangkar?.isClaimed ?? !!teacher.isClaimed,
        ttdDigitalUrl: teacher.sistemJangkar?.ttdDigitalUrl || '',
        diperbaruiPada: teacher.sistemJangkar?.diperbaruiPada || new Date().toISOString(),
        diperbaruiOleh: teacher.sistemJangkar?.diperbaruiOleh || 'Admin',
      } as any,
    });
    setClaimActive(!!teacher.isClaimed || !!teacher.sistemJangkar?.isClaimed);
    setInitialPassword('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!id) return;
    if (window.confirm(`Hapus permanen data guru ${name}?`)) {
      const toastId = toast.loading('Menghapus data...');
      try {
        await deleteTeacherData(id);
        toast.success('Data guru dihapus.', { id: toastId });
      } catch (e: any) {
        toast.error('Gagal menghapus: ' + getFriendlyErrorMessage(e), { id: toastId });
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const emptyFields: string[] = [];
    if (!formData.namaLengkap && !formData.name) emptyFields.push('Nama Lengkap');
    const currentSubject =
      formData.penugasanAkademik?.mapelUtama || formData.subject || formData.mapel;
    if (!currentSubject) emptyFields.push('Mata Pelajaran');

    if (emptyFields.length > 0) {
      toast.error(`${emptyFields.join(' dan ')} wajib diisi.`);
      return;
    }

    setSaving(true);
    const toastId = toast.loading(editingId ? 'Memperbarui data...' : 'Menyimpan guru baru...');

    try {
      const finalName = formData.namaLengkap || formData.name || '';
      const isAsn = formData.asnStatus === AsnStatus.ASN;
      const baseId = isAsn ? formData.nip : formData.nik;
      const targetId = editingId || baseId || `TCH-${Date.now()}`;

      const payloadToSave: Teacher = {
        ...formData,
        idUnik: targetId,
        teachersId: targetId,
        id: targetId,
        namaLengkap: finalName,
        name: finalName,
        nip: formData.nip || '',
        nik: formData.nik || '',
        nuptk: formData.nuptk || '',
        jenisKelamin: formData.jenisKelamin || 'L',
        gender: formData.jenisKelamin || 'L',
        tempatLahir: formData.tempatLahir || '',
        tanggalLahir: formData.tanggalLahir || '',
        birthDate: formData.tanggalLahir || '',
        email: formData.email || '',
        tenantId: tenantId,
        photoURL: formData.photoURL || '',
        role: formData.role || UserRole.GURU,
        employmentStatus: formData.employmentStatus || EmploymentStatus.HONORER,
        asnStatus: formData.asnStatus || AsnStatus.NON_ASN,
        jabatan: formData.jabatan || 'Guru Mapel',
        status: formData.employmentStatus || EmploymentStatus.HONORER,
        
        jabatanDanStatus: {
          ...formData.jabatanDanStatus,
          jabatanUtama: formData.jabatan || 'Guru Mapel',
          statusPegawai: formData.employmentStatus || EmploymentStatus.HONORER,
          pangkatGolongan: formData.jabatanDanStatus?.pangkatGolongan || '',
          pendidikanTerakhir: formData.jabatanDanStatus?.pendidikanTerakhir || 'S1',
        } as any,
        penugasanAkademik: {
          ...formData.penugasanAkademik,
          isWaliKelas: formData.penugasanAkademik?.isWaliKelas || false,
          waliKelasDi: formData.penugasanAkademik?.isWaliKelas
            ? formData.penugasanAkademik?.waliKelasDi || null
            : null,
          mapelUtama: currentSubject || '',
          totalJTM: formData.penugasanAkademik?.totalJTM || '0',
          isPembinaEkskul: formData.penugasanAkademik?.isPembinaEkskul || false,
        } as any,
        kontak: {
          ...formData.kontak,
          nomorHpWhatsApp: formData.kontak?.nomorHpWhatsApp || '',
          alamatLengkap: formData.kontak?.alamatLengkap || '',
        } as any,
        sistemJangkar: {
          ...formData.sistemJangkar,
          tenantId: tenantId,
          userId: targetId,
          roleSistem: (formData.role || 'GURU').toUpperCase(),
          isClaimed: claimActive,
          diperbaruiPada: new Date().toISOString(),
          diperbaruiOleh: 'System Update',
        } as any,
      } as Teacher;

      if (editingId) {
        await update(editingId, payloadToSave);

        if (claimActive && initialPassword && formData.email) {
          await activateTeacherAccount(
            editingId,
            formData.email,
            formData.role || UserRole.GURU,
            initialPassword,
          );
          setTempPassword(initialPassword);
          setShowSuccessModal(payloadToSave);
        }
      } else {
        const newId = await add(payloadToSave as Teacher);

        if (claimActive && initialPassword && formData.email) {
          await activateTeacherAccount(
            newId,
            formData.email,
            formData.role || UserRole.GURU,
            initialPassword,
          );
          setTempPassword(initialPassword);
          setShowSuccessModal({ ...payloadToSave, id: newId, idUnik: newId, teachersId: newId });
        }
      }
      toast.success('Database GTK berhasil diperbarui.', { id: toastId });
      setIsModalOpen(false);
    } catch (e: any) {
      toast.error('Gagal menyimpan data: ' + getFriendlyErrorMessage(e), { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadTemplate = async () => {
    const templateData = [
      {
        Nama: 'Ahmad Dahlan, S.Pd., M.Si.',
        NIK: '3201010101800001',
        NUPTK: '1234567890123456',
        'Status Kepegawaian': 'PNS',
        NIP: '198001012005011001',
        'Jenis Kelamin': 'L',
        'Tempat Lahir': 'Jakarta',
        'Tanggal Lahir': '1980-01-01',
        'Nomor Handphone': '081234567890',
        Email: 'ahmad.dahlan@emam-system.web.id',
        Tugas: 'Guru Mapel',
        'Mata Pelajaran': 'Matematika',
        'Total JTM': 24,
        ALAMAT: 'Jl. Pendidikan No. 1',
        ROLE: 'GURU',
      },
    ];

    await writeJSONToExcel(templateData, 'Template_Upload_GTK.xlsx', 'Template_GTK');
  };

  return (
    <Layout
      title="Direktori GTK"
      subtitle="Database Terintegrasi"
      icon={BriefcaseIcon}
      onBack={onBack}
      actions={
        canManage ? (
          <div className="flex gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="p-2 sm:px-4 sm:py-2.5 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl text-[10px] font-bold uppercase flex items-center justify-center gap-2 shadow-sm border border-slate-200 dark:border-slate-700 active:scale-95 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              Template
            </button>
             <button
               onClick={() => setIsBulkUploadModalOpen(true)}
               className="p-2 sm:px-4 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold uppercase flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all text-center"
             >
               Upload GTK
             </button>
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({
                  namaLengkap: '',
                  nip: '',
                  nik: '',
                  jenisKelamin: 'L',
                  role: UserRole.GURU,
                  jabatanDanStatus: {
                    jabatanUtama: 'Guru Mapel',
                    statusPegawai: EmploymentStatus.HONORER,
                    pangkatGolongan: '',
                    pendidikanTerakhir: 'S1',
                  },
                  penugasanAkademik: {
                    isWaliKelas: false,
                    waliKelasDi: null,
                    mapelUtama: '',
                    totalJTM: '0',
                    isPembinaEkskul: false,
                  },
                  kontak: {
                    nomorHpWhatsApp: '',
                    alamatLengkap: '',
                  },
                  sistemJangkar: {
                    tenantId: tenantId,
                    userId: '',
                    roleSistem: 'GURU',
                    isClaimed: false,
                    ttdDigitalUrl: '',
                    diperbaruiPada: new Date().toISOString(),
                    diperbaruiOleh: 'Admin',
                  },
                });
                setClaimActive(false);
                setInitialPassword('');
                setIsModalOpen(true);
              }}
              className="p-2 sm:px-6 sm:py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase flex items-center justify-center gap-2 shadow-lg active:scale-95 hover:bg-indigo-700 transition-all"
            >
              <PlusIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Tambah GTK</span>
            </button>
          </div>
        ) : undefined
      }
    >
      <div className="p-4 lg:p-6 pb-32 space-y-6">
        <div className="bg-white dark:bg-[#151E32] p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex overflow-x-auto whitespace-nowrap scrollbar-none sm:grid sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative group shrink-0 w-48 sm:w-auto">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Cari Nama Guru..."
              value={filterNama}
              onChange={(e) => setFilterNama(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="relative group shrink-0 w-40 sm:w-auto">
            <IdentificationIcon className="w-4 h-4 absolute left-3 top-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Cari NIP..."
              value={filterNIP}
              onChange={(e) => setFilterNIP(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="relative group shrink-0 w-44 sm:w-auto">
            <BookOpenIcon className="w-4 h-4 absolute left-3 top-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Mata Pelajaran..."
              value={filterMapel}
              onChange={(e) => setFilterMapel(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="relative text-left shrink-0 w-40 sm:w-auto">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 pr-10 text-xs font-bold outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="All">Semua Status</option>
              <option value="PNS">PNS</option>
              <option value="PPPK">PPPK</option>
              <option value="GTY">GTY</option>
              <option value="Honorer">Honorer</option>
            </select>
            <ChevronDownIcon className="w-4 h-4 absolute right-3 top-3 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <TeacherList 
          teachers={processedTeachers}
          loading={loading}
          canManage={canManage}
          onDetail={setDetailModal}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onResetAuth={handleResetAuth}
          resettingId={resetting}
        />

        {processedTeachers.length === 0 && !loading && (
          <div className="text-center py-20 bg-slate-50 dark:bg-[#151E32] rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-4 mt-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-300 dark:text-indigo-700">
              <Search className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-700 dark:text-white tracking-tight">
                Tidak ada data
              </h4>
              <p className="text-[10px] font-bold text-slate-400 mt-1 text-center">
                Sesuaikan filter atau tambah data GTK baru.
              </p>
            </div>
          </div>
        )}
      </div>

      <TeacherFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingId={editingId}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        saving={saving}
        claimActive={claimActive}
        setClaimActive={setClaimActive}
        initialPassword={initialPassword}
        setInitialPassword={setInitialPassword}
      />

      <TeacherDetailModal 
        teacher={detailModal}
        onClose={() => setDetailModal(null)}
      />

      <TeacherBulkUploadModal
        isOpen={isBulkUploadModalOpen}
        onClose={() => setIsBulkUploadModalOpen(false)}
        onSuccess={() => {
          setIsBulkUploadModalOpen(false);
          fetchTeachersData();
        }}
      />

      {/* Activation Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#151E32] w-full max-w-sm rounded-[2rem] p-8 shadow-2xl animate-in zoom-in duration-300 text-center border border-indigo-500/30">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 uppercase tracking-tight">
              Aktivasi Berhasil!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-medium leading-relaxed px-4">
              Akun <strong>{showSuccessModal.namaLengkap || showSuccessModal.name}</strong> telah aktif. Silakan berikan kredensial berikut:
            </p>
            
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl mb-6 space-y-3 text-left border border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide mb-1">Username (Email)</p>
                <div className="flex items-center justify-between">
                   <p className="text-[11px] font-bold text-indigo-600 truncate">{showSuccessModal.email}</p>
                   <button 
                     onClick={() => {
                        navigator.clipboard.writeText(showSuccessModal.email || '');
                        toast.success('Email tersalin');
                     }}
                     className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-lg transition-colors"
                   >
                     <CopyIcon className="w-3.5 h-3.5 text-indigo-400" />
                   </button>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide mb-1">Password Sementara</p>
                <div className="flex items-center justify-between">
                   <p className="text-sm font-bold tracking-wide text-slate-700 dark:text-slate-200">{tempPassword}</p>
                   <button 
                     onClick={handleCopyPassword}
                     className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-lg transition-colors"
                   >
                     {copied ? <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" /> : <CopyIcon className="w-3.5 h-3.5 text-indigo-400" />}
                   </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowSuccessModal(null)}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-wide shadow-lg shadow-indigo-500/30 active:scale-95 transition-all"
            >
              Selesai & Tutup
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default TeacherData;
