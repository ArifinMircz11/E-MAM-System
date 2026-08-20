import React, { useEffect, useState } from 'react';
import { useClasses } from '../hooks/useClasses';
import { useClassStore } from '../state/classStore';
import { useSecurityContext } from '@/core/identity/security-context';
import { AuthorizationService } from '@/core/authorization/services/AuthorizationService';
import { CLASS_PERMISSIONS } from '../permissions';
import { ClassTable } from '../components/ClassTable';
import { ClassActions } from '../components/ClassActions';
import { ClassForm } from '../components/ClassForm';
import { classService } from '../services/ClassService';
import { useTeacherStore } from '@/stores/teacherStore';
import { useStudentStore } from '@/stores/studentStore';
import { writeJSONToExcel, readExcelToJSON } from '@/utils/excelHelper';
import { studentRepository } from '@/features/students/repositories/StudentRepository';
import { tenantRepository } from '@/repositories/madrasahRepository';
import { toast } from 'sonner';
import type { IClassEntity } from '@/repositories/contracts/IClassRepository';
import type { ClassRoom } from '../types/class.types';
import {
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  RefreshCw,
  ArrowLeft,
  User,
  Users,
  Settings,
  Trash2,
  Edit,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  ArrowRightLeft,
  X,
  FileSpreadsheet,
} from 'lucide-react';

interface ClassListPageProps {
  onBack?: () => void;
  onOpenSidebar?: () => void;
  userRole?: any;
  onNavigate?: (view: any) => void;
}

export const ClassListPage: React.FC<ClassListPageProps> = ({ onBack, onOpenSidebar }) => {
  console.log('[RCA Audit] ClassListPage mounted with academic capability suite');
  const securityContext = useSecurityContext();

  const [registeredTenants, setRegisteredTenants] = useState<any[]>([]);
  const [selectedDeveloperTenantId, setSelectedDeveloperTenantId] = useState<string>(
    securityContext?.tenantId && securityContext.tenantId !== 'global' ? securityContext.tenantId : '30315537'
  );

  useEffect(() => {
    if (securityContext?.isDeveloper) {
      tenantRepository.getAll(securityContext as any).then((tenants) => {
        setRegisteredTenants(tenants);
        if (tenants.length > 0 && (!selectedDeveloperTenantId || selectedDeveloperTenantId === 'global')) {
          setSelectedDeveloperTenantId(tenants[0].id);
        }
      }).catch(err => {
        console.error('Failed to load registered tenants:', err);
      });
    }
  }, [securityContext?.isDeveloper]);

  const effectiveSecurityContext = securityContext?.isDeveloper
    ? { ...securityContext, tenantId: selectedDeveloperTenantId }
    : securityContext;

  const { classes, rawClasses, loading, error, refresh, createClass, updateClass, deleteClass } = useClasses(effectiveSecurityContext);
  const { isModalOpen, setModalOpen, selectedClass, setSelectedClass, filter, setFilter } = useClassStore();

  // Stores for dropdown and lookups
  const { teachers, fetchTeachers } = useTeacherStore();
  const { students, fetchStudents } = useStudentStore();

  // Selected class for active management drilldown
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'siswa'>('info');

  // Sub-states
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<any[]>([]);
  const [isAssignStudentModalOpen, setIsAssignStudentModalOpen] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferStudentId, setTransferStudentId] = useState<string | null>(null);
  const [targetClassId, setTargetClassId] = useState<string>('');

  // Excel Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  // Load supporting master data
  useEffect(() => {
    fetchTeachers(true);
    fetchStudents(true);
  }, [fetchTeachers, fetchStudents]);

  const activeClassData = rawClasses.find((c) => c.id === activeClassId);

  // Load students for active class
  const loadClassStudents = async () => {
    if (!activeClassId || !effectiveSecurityContext?.tenantId) return;
    try {
      const assigned = await studentRepository.findByClass(activeClassId, effectiveSecurityContext.tenantId);
      setClassStudents(assigned);

      // Students who are either not assigned or belong to another class (potential transfers)
      const all = await studentRepository.findAll(effectiveSecurityContext.tenantId);
      const unassigned = all.filter((s) => s.classId !== activeClassId && !s.deleted && s.status === 'Aktif');
      setUnassignedStudents(unassigned);
    } catch (e) {
      console.error('Failed to load class students:', e);
    }
  };

  useEffect(() => {
    if (activeClassId) {
      loadClassStudents();
    }
  }, [activeClassId, rawClasses, students]);

  const canCreate = securityContext ? AuthorizationService.can(CLASS_PERMISSIONS.create, undefined, securityContext) : false;
  const canUpdate = securityContext ? AuthorizationService.can(CLASS_PERMISSIONS.update, undefined, securityContext) : false;
  const canDelete = securityContext ? AuthorizationService.can(CLASS_PERMISSIONS.delete, undefined, securityContext) : false;
  const canImport = securityContext ? AuthorizationService.can(CLASS_PERMISSIONS.import, undefined, securityContext) : false;
  const canExport = securityContext ? AuthorizationService.can(CLASS_PERMISSIONS.export, undefined, securityContext) : false;
  const canAssignTeacher = securityContext ? AuthorizationService.can(CLASS_PERMISSIONS.assignTeacher, undefined, securityContext) : false;
  const canAssignStudent = securityContext ? AuthorizationService.can(CLASS_PERMISSIONS.assignStudent, undefined, securityContext) : false;
  const canTransferStudent = securityContext ? AuthorizationService.can(CLASS_PERMISSIONS.transferStudent, undefined, securityContext) : false;
  const canRestore = securityContext ? AuthorizationService.can(CLASS_PERMISSIONS.restore, undefined, securityContext) : false;

  const handleOpenCreate = () => {
    setSelectedClass(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: IClassEntity) => {
    setSelectedClass(item as unknown as ClassRoom);
    setModalOpen(true);
  };

  const handleSubmitForm = async (formData: any) => {
    try {
      if (selectedClass) {
        await updateClass(selectedClass.id, formData);
        toast.success('Kelas berhasil diperbarui');
      } else {
        await createClass(formData);
        toast.success('Kelas baru berhasil ditambahkan');
      }
      refresh();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan data kelas');
    }
  };

  // Academic Operational Methods
  const handleAssignTeacher = async (teacherId: string) => {
    if (!securityContext || !activeClassId) return;
    try {
      await classService.assignTeacher(securityContext, activeClassId, teacherId);
      toast.success('Wali Kelas berhasil diperbarui');
      refresh();
    } catch (e: any) {
      toast.error(e.message || 'Gagal memperbarui Wali Kelas');
    }
  };

  const handleAssignStudent = async (studentId: string) => {
    if (!securityContext || !activeClassId) return;
    try {
      await classService.assignStudent(securityContext, activeClassId, studentId);
      toast.success('Siswa berhasil ditambahkan ke kelas');
      loadClassStudents();
      refresh();
    } catch (e: any) {
      toast.error(e.message || 'Gagal menambahkan siswa');
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!securityContext || !activeClassId) return;
    try {
      await classService.removeStudent(securityContext, activeClassId, studentId);
      toast.success('Siswa berhasil dikeluarkan dari kelas');
      loadClassStudents();
      refresh();
    } catch (e: any) {
      toast.error(e.message || 'Gagal mengeluarkan siswa');
    }
  };

  const handleTransferStudent = async () => {
    if (!securityContext || !transferStudentId || !targetClassId) return;
    try {
      await classService.transferStudent(securityContext, transferStudentId, targetClassId);
      toast.success('Siswa berhasil dipindahkan kelas');
      setIsTransferModalOpen(false);
      setTransferStudentId(null);
      loadClassStudents();
      refresh();
    } catch (e: any) {
      toast.error(e.message || 'Gagal memindahkan siswa');
    }
  };

  const handleToggleStatus = async (item: IClassEntity) => {
    if (!securityContext) return;
    try {
      if (item.status === 'aktif') {
        // Soft delete/deactivate checks
        await classService.delete(securityContext, item.id);
        toast.success('Kelas berhasil dinonaktifkan');
      } else {
        // Restore/activate
        await classService.restore(securityContext, item.id);
        toast.success('Kelas berhasil diaktifkan kembali');
      }
      refresh();
    } catch (e: any) {
      toast.error(e.message || 'Gagal mengubah status kelas');
    }
  };

  const handleExportExcel = () => {
    if (classes.length === 0) {
      toast.error('Tidak ada data kelas yang dapat diekspor');
      return;
    }
    const dataToExport = classes.map((item) => {
      const wk = teachers.find((t) => t.id === item.waliKelasId);
      return {
        'Kode Rombel': item.kodeKelas,
        'Nama Rombel': item.namaKelas,
        'Tingkat': `Tingkat ${item.tingkat}`,
        'Jurusan': item.jurusan || '-',
        'Tahun Ajaran': item.tahunAjaran,
        'Semester': item.semester.toUpperCase(),
        'Wali Kelas': wk ? wk.namaLengkap : 'Belum Ditentukan',
        'Jumlah Siswa': item.jumlahSiswa || 0,
        'Status': item.status.toUpperCase(),
      };
    });
    writeJSONToExcel(dataToExport, 'eMAM_Daftar_Kelas_Rombel.xlsx');
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !securityContext) return;

    setImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const parsedData = await readExcelToJSON<any>(buffer);

      let count = 0;
      for (const row of parsedData) {
        // Map excel columns (either Indonesian or English keys)
        const name = row['Nama Rombel'] || row['namaKelas'] || row['Name'] || row['nama_kelas'];
        const code = row['Kode Rombel'] || row['kodeKelas'] || row['Code'] || row['kode_kelas'];
        const lvl = row['Tingkat'] || row['tingkat'] || row['Level'] || '10';
        const major = row['Jurusan'] || row['jurusan'] || row['Major'] || '';
        const yr = row['Tahun Ajaran'] || row['tahunAjaran'] || row['Academic Year'] || '2025/2026';
        const sem = String(row['Semester'] || row['semester'] || 'ganjil').toLowerCase();

        if (name && code) {
          await classService.create(securityContext, {
            namaKelas: String(name),
            kodeKelas: String(code),
            tingkat: String(lvl).replace(/\D/g, ''), // Keep only numeric
            jurusan: String(major),
            tahunAjaran: String(yr),
            semester: sem,
            status: 'aktif',
          });
          count++;
        }
      }

      toast.success(`Berhasil mengimpor ${count} rombel kelas.`);
      setIsImportModalOpen(false);
      refresh();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengimpor file Excel.');
    } finally {
      setImporting(false);
      if (e.target) e.target.value = '';
    }
  };

  // Filter unassigned students by search
  const filteredUnassignedStudents = unassignedStudents.filter((s) => {
    const name = s.namaLengkap || s.name || '';
    const nisn = s.nisn || s.nis || '';
    return (
      name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      nisn.toLowerCase().includes(studentSearchQuery.toLowerCase())
    );
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {!activeClassId ? (
        // DASHBOARD / LIST VIEW
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
            <div>
              {onBack && (
                <button
                  onClick={onBack}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mb-2 inline-flex items-center space-x-1"
                >
                  <span>← Kembali ke Menu</span>
                </button>
              )}
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-indigo-600" />
                Manajemen Kelas (Rombongan Belajar)
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Pusat struktur data akademik madrasah e-MAM Enterprise (Offline-First & Tenant Isolated).
              </p>
            </div>

            {/* Premium action hub */}
            <div className="flex flex-wrap items-center gap-2">
              {canExport && (
                <button
                  onClick={handleExportExcel}
                  className="px-3.5 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center space-x-1.5 transition duration-150"
                >
                  <Download className="w-4 h-4 text-gray-500" />
                  <span>Ekspor</span>
                </button>
              )}
              {canImport && (
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-3.5 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center space-x-1.5 transition duration-150"
                >
                  <Upload className="w-4 h-4 text-gray-500" />
                  <span>Impor Excel</span>
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {securityContext?.isDeveloper && (
            <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-600 text-white rounded-lg shadow-sm">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-indigo-900">Portal Developer: Pilih Madrasah Terdaftar</h3>
                  <p className="text-xs text-indigo-700">Anda masuk sebagai Developer. Pilih madrasah target untuk mengelola data kelas.</p>
                </div>
              </div>
              <div className="w-full md:w-auto">
                <select
                  value={selectedDeveloperTenantId}
                  onChange={(e) => setSelectedDeveloperTenantId(e.target.value)}
                  className="px-3 py-2 bg-white border border-indigo-300 rounded-lg text-sm font-medium text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-72"
                >
                  {registeredTenants.length === 0 ? (
                    <option value="30315537">MAN 1 Hulu Sungai Tengah (30315537)</option>
                  ) : (
                    registeredTenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.identitas?.namaMadrasah || t.id} ({t.id})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          )}

          <ClassActions
            searchValue={filter.searchQuery}
            onSearchChange={(q) => setFilter({ searchQuery: q })}
            tingkatFilter={filter.tingkat}
            onTingkatChange={(t) => setFilter({ tingkat: t })}
            statusFilter={filter.status}
            onStatusChange={(s) => setFilter({ status: s })}
            onRefresh={refresh}
            onCreateClick={handleOpenCreate}
            canCreate={canCreate}
          />

          {loading && classes.length === 0 ? (
            <div className="text-center py-16 text-gray-500 bg-white rounded-xl border border-gray-200">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-2" />
              Memuat data kelas rombel...
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Kode
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Nama Kelas
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Tingkat / Jurusan
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Wali Kelas
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Tahun Ajaran
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Siswa
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Kelola
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {classes.map((item) => {
                      const waliKelasObj = teachers.find((t) => t.id === item.waliKelasId);
                      return (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                            {item.kodeKelas}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {item.namaKelas}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            Tingkat {item.tingkat} {item.jurusan ? `• ${item.jurusan}` : ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                            {waliKelasObj ? waliKelasObj.namaLengkap : <span className="text-gray-400 font-normal italic">Belum diset</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {item.tahunAjaran} ({item.semester})
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-semibold">
                            {item.jumlahSiswa || 0} Siswa
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                item.status === 'aktif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                            <button
                              onClick={() => {
                                setActiveClassId(item.id);
                                setActiveTab('info');
                              }}
                              className="text-indigo-600 hover:text-indigo-900 font-semibold"
                            >
                              Detail & Kelola
                            </button>
                            {canUpdate && (
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="text-gray-500 hover:text-gray-900"
                              >
                                Edit
                              </button>
                            )}
                            {item.status === 'aktif' && canDelete && (
                              <button
                                onClick={() => handleToggleStatus(item)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Nonaktifkan
                              </button>
                            )}
                            {item.status !== 'aktif' && canRestore && (
                              <button
                                onClick={() => handleToggleStatus(item)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Aktifkan
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        // ACTIVE CLASS DETAILS / MANAGEMENT WORKSPACE
        activeClassData && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header / Nav */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
              <div className="space-y-1">
                <button
                  onClick={() => setActiveClassId(null)}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center space-x-1 mb-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali ke Daftar Rombel</span>
                </button>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{activeClassData.namaKelas}</h1>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      activeClassData.status === 'aktif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    Rombel {activeClassData.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Kode Rombel: <span className="font-mono text-gray-900 font-bold">{activeClassData.kodeKelas}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleStatus(activeClassData)}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg border ${
                    activeClassData.status === 'aktif'
                      ? 'border-red-200 text-red-700 bg-red-50 hover:bg-red-100'
                      : 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100'
                  }`}
                >
                  {activeClassData.status === 'aktif' ? 'Nonaktifkan Kelas' : 'Aktifkan Kelas'}
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('info')}
                className={`py-3 px-6 font-semibold text-sm border-b-2 transition duration-150 ${
                  activeTab === 'info'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Informasi & Wali Kelas
              </button>
              <button
                onClick={() => setActiveTab('siswa')}
                className={`py-3 px-6 font-semibold text-sm border-b-2 transition duration-150 flex items-center gap-2 ${
                  activeTab === 'siswa'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Anggota Rombel ({classStudents.length})</span>
              </button>
            </div>

            {/* Tab: Info & Wali Kelas */}
            {activeTab === 'info' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm md:col-span-2 space-y-4">
                  <h3 className="text-base font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    Detail Rombongan Belajar
                  </h3>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                    <div>
                      <span className="text-gray-500 block">Tingkat Akademik</span>
                      <span className="font-semibold text-gray-900">Tingkat {activeClassData.tingkat}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Program / Jurusan</span>
                      <span className="font-semibold text-gray-900">{activeClassData.jurusan || 'Umum'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Tahun Pelajaran</span>
                      <span className="font-semibold text-gray-900">{activeClassData.tahunAjaran}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Semester</span>
                      <span className="font-semibold text-gray-900 uppercase">{activeClassData.semester}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Jumlah Siswa Terdaftar</span>
                      <span className="font-semibold text-gray-900">{classStudents.length} Siswa</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Dibuat Oleh ID</span>
                      <span className="font-mono text-gray-900 text-xs">{activeClassData.createdBy || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Wali Kelas Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                      <User className="w-5 h-5 text-indigo-600" />
                      Wali Kelas (GTK)
                    </h3>

                    {activeClassData.waliKelasId ? (
                      <div className="mt-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-lg">
                        <p className="text-sm font-bold text-indigo-900">
                          {teachers.find((t) => t.id === activeClassData.waliKelasId)?.namaLengkap || 'Guru Terdaftar'}
                        </p>
                        <p className="text-xs text-indigo-600 mt-1">
                          NIP: {teachers.find((t) => t.id === activeClassData.waliKelasId)?.nip || '-'}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-amber-900">Belum Ada Wali Kelas</p>
                          <p className="text-xs text-amber-600 mt-0.5">Rombel ini belum memiliki Wali Kelas yang ditunjuk.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {canAssignTeacher && (
                    <div className="pt-4 border-t border-gray-100 space-y-2">
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Pilih Wali Kelas Baru:
                      </label>
                      <select
                        onChange={(e) => handleAssignTeacher(e.target.value)}
                        value={activeClassData.waliKelasId || ''}
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg bg-white"
                      >
                        <option value="">-- Pilih Wali Kelas --</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.namaLengkap}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Daftar Siswa (Academic Operables) */}
            {activeTab === 'siswa' && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Daftar Anggota Kelas</h3>
                    <p className="text-xs text-gray-500">Daftar siswa yang saat ini tergabung di kelas ini.</p>
                  </div>
                  {canUpdate && (
                    <button
                      onClick={() => setIsAssignStudentModalOpen(true)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-sm flex items-center space-x-1.5 transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Siswa</span>
                    </button>
                  )}
                </div>

                {classStudents.length === 0 ? (
                  <div className="p-12 border border-dashed border-gray-200 text-center rounded-xl text-gray-400">
                    <Users className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    Belum ada siswa yang tergabung di kelas ini.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead className="bg-gray-50/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">NISN</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nama Lengkap</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">L/P</th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {classStudents.map((s) => (
                          <tr key={s.id} className="hover:bg-gray-50/50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                              {s.nisn || s.nis || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                              {s.namaLengkap}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {s.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                              {canTransferStudent && (
                                <button
                                  onClick={() => {
                                    setTransferStudentId(s.id);
                                    setTargetClassId('');
                                    setIsTransferModalOpen(true);
                                  }}
                                  className="text-indigo-600 hover:text-indigo-900 inline-flex items-center gap-1 font-semibold"
                                >
                                  <ArrowRightLeft className="w-3.5 h-3.5" />
                                  <span>Pindahkan</span>
                                </button>
                              )}
                              {canAssignStudent && (
                                <button
                                  onClick={() => handleRemoveStudent(s.id)}
                                  className="text-red-600 hover:text-red-900 font-semibold"
                                >
                                  Keluarkan
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      )}

      {/* MODAL: CREATE / EDIT CLASS FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {selectedClass ? 'Edit Data Kelas Rombel' : 'Tambah Rombel Baru'}
              </h2>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setSelectedClass(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ClassForm
              initialData={selectedClass}
              onSubmit={handleSubmitForm}
              onCancel={() => {
                setModalOpen(false);
                setSelectedClass(null);
              }}
            />
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN STUDENT TO CLASS */}
      {isAssignStudentModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh] animate-scaleIn">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Tambah Anggota Rombel</h2>
                <p className="text-xs text-gray-500">Pilih siswa aktif untuk dimasukkan ke kelas ini.</p>
              </div>
              <button
                onClick={() => setIsAssignStudentModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Search */}
            <div className="mb-4 relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="Cari nama siswa atau NISN..."
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Students List */}
            <div className="overflow-y-auto flex-1 divide-y divide-gray-100 pr-2">
              {filteredUnassignedStudents.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">
                  Tidak ada siswa aktif yang tersedia.
                </div>
              ) : (
                filteredUnassignedStudents.map((s) => (
                  <div key={s.id} className="py-3 flex items-center justify-between hover:bg-gray-50/50 px-2 rounded-lg transition">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{s.namaLengkap}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        NISN: {s.nisn || s.nis || '-'} • Kelas Saat Ini:{' '}
                        <span className="font-semibold text-indigo-600">
                          {s.className || 'Belum Ditentukan'}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleAssignStudent(s.id)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-100 transition"
                    >
                      Masukkan Kelas
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setIsAssignStudentModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-50"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TRANSFER STUDENT TO ANOTHER CLASS */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
                Pindahkan Kelas Siswa
              </h2>
              <button
                onClick={() => {
                  setIsTransferModalOpen(false);
                  setTransferStudentId(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Silakan pilih kelas tujuan untuk transfer akademik siswa ini:
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Kelas Tujuan:</label>
                <select
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="">-- Pilih Kelas Rombel --</option>
                  {rawClasses
                    .filter((c) => c.id !== activeClassId && !c.deleted && c.status === 'aktif')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.namaKelas} ({c.tahunAjaran})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsTransferModalOpen(false);
                    setTransferStudentId(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!targetClassId}
                  onClick={handleTransferStudent}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                  Pindahkan Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: IMPORT CLASS VIA EXCEL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                Impor Data Kelas Rombel
              </h2>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-900 space-y-2">
                <p className="font-bold">Format Kolom Spreadsheet Excel (.xlsx / .xls):</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Nama Rombel</strong> (contoh: X MIPA 1)</li>
                  <li><strong>Kode Rombel</strong> (contoh: X-MIPA-1)</li>
                  <li><strong>Tingkat</strong> (contoh: 10, 11, atau 12)</li>
                  <li><strong>Jurusan</strong> (contoh: MIPA / IPS) [Opsional]</li>
                  <li><strong>Tahun Ajaran</strong> (contoh: 2025/2026)</li>
                  <li><strong>Semester</strong> (contoh: ganjil / genap)</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pilih file spreadsheet Anda:
                </label>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleImportExcel}
                  disabled={importing}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 file:cursor-pointer hover:file:bg-indigo-100"
                />
              </div>

              {importing && (
                <div className="text-center py-4 text-sm text-indigo-600 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sedang memproses dan menyimpan data...</span>
                </div>
              )}

              <div className="flex justify-end pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  disabled={importing}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
