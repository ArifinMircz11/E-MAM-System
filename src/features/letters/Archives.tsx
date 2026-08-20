import React, { useState, useRef, useEffect } from 'react';
import { uploadTeacherFile, getTeacherData, updateTeacher } from '@/services/teacherService';
import { toast } from 'sonner';
import Layout from '@/layouts/Layout';
import {
  ClipboardDocumentListIcon,
  PlusIcon,
  Loader2,
  CreditCardIcon,
  SparklesIcon,
} from '@/shared/Icons';
import type { UserData } from '@/types';

interface ArchivesProps {
  onBack: () => void;
  userData: any; // Dynamic or compatibility user data
}

const Archives: React.FC<ArchivesProps> = ({ onBack, userData }) => {
  const [archiving, setArchiving] = useState(false);
  const [archives, setArchives] = useState<any[]>([]);
  const archiveInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchArchives = async () => {
      if (!userData.teachersId) return;
      try {
        const teacher = await getTeacherData(userData.teachersId);
        if (teacher) {
          setArchives(teacher.archives || []);
        }
      } catch (err) {
        toast.error('Gagal memuat arsip.');
      }
    };
    fetchArchives();
  }, [userData.teachersId]);

  const handleUploadArchive = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userData.teachersId) return;

    setArchiving(true);
    const toastId = toast.loading('Mengunggah dokumen arsip...');
    try {
      const fileUrl = await uploadTeacherFile(file, userData.teachersId);
      const teacher = await getTeacherData(userData.teachersId);
      const currentArchives = teacher?.archives || [];
      const newArchiveItem = {
        name: file.name,
        url: fileUrl,
        date: new Date().toISOString(),
      };
      const updatedArchives = [...currentArchives, newArchiveItem];

      await updateTeacher(userData.teachersId, {
        archives: updatedArchives,
      });

      setArchives(updatedArchives);
      toast.success('Arsip berhasil disimpan!', { id: toastId });
    } catch (err) {
      toast.error('Gagal mengunggah arsip.', { id: toastId });
    } finally {
      setArchiving(false);
    }
  };

  return (
    <Layout
      title="Arsip & Sertifikat"
      subtitle="Kelola Dokumen Anda"
      icon={ClipboardDocumentListIcon}
      onBack={onBack}
    >
      <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-[2.2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-700">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            Penyimpanan aman untuk SK, Sertifikat, dan dokumen kepegawaian Anda.
          </p>

          <div className="space-y-3 mb-6">
            {archives.map((file: any, index: number) => (
              <a
                key={index}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 group hover:border-indigo-500 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                    <CreditCardIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate max-w-[150px]">
                      {file.name}
                    </p>
                    <p className="text-[8px] text-slate-400 uppercase font-bold">
                      {new Date(file.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <SparklesIcon className="w-4 h-4 text-slate-300 group-hover:text-indigo-500" />
              </a>
            ))}
            {archives.length === 0 && (
              <div className="text-center py-6 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Belum ada dokumen</p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="file"
              ref={archiveInputRef}
              className="hidden"
              accept=".pdf,.doc,.docx,image/*"
              onChange={handleUploadArchive}
            />
            <button
              onClick={() => archiveInputRef.current?.click()}
              disabled={archiving}
              className="flex-1 py-3.5 bg-indigo-600 text-white font-bold rounded-xl text-[9px] uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
            >
              {archiving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <PlusIcon className="w-4 h-4" />
              )}{' '}
              Tambah Arsip
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Archives;
