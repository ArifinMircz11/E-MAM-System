import React, { useState, useEffect } from 'react';
import Layout from '@/layouts/Layout';
import {
  BookOpenIcon,
  PencilIcon,
  SaveIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  Loader2,
  CommandLineIcon,
} from '@/shared/Icons';
import { documentationService } from '@/services/documentationService';
import type { SystemDocumentation } from '@/types';
import { UserRole } from '@/types';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface SystemDocumentationProps {
  onBack: () => void;
  userRole: UserRole;
}

const SystemDocumentationView: React.FC<SystemDocumentationProps> = ({ onBack, userRole }) => {
  const [docs, setDocs] = useState<SystemDocumentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDoc, setEditingDoc] = useState<SystemDocumentation | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<SystemDocumentation | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const isDeveloper = userRole === UserRole.DEVELOPER || userRole === UserRole.ADMIN;

  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      try {
        const data = await documentationService.getDocs();
        setDocs(data);
      } catch (err: any) {
        console.error('Documentation Fetch Error:', err?.message || 'Error');
        toast.error('Gagal memuat dokumentasi.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;

    try {
      await documentationService.saveDoc(editingDoc);
      toast.success(isAdding ? 'Dokumentasi berhasil ditambahkan.' : 'Dokumentasi berhasil diperbarui.');
      
      const updatedDocs = await documentationService.getDocs();
      setDocs(updatedDocs);
      
      setEditingDoc(null);
      setIsAdding(false);
    } catch (err: any) {
      console.error('Save Error:', err?.message || 'Error');
      toast.error('Gagal menyimpan dokumentasi.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await documentationService.deleteDoc(id);
      toast.success('Dokumentasi berhasil dihapus.');
      
      const updatedDocs = await documentationService.getDocs();
      setDocs(updatedDocs);
      
      setConfirmDeleteId(null);
      if (viewingDoc?.id === id) setViewingDoc(null);
    } catch (err: any) {
      console.error('Delete Error:', err?.message || 'Error');
      toast.error('Gagal menghapus dokumentasi.');
    }
  };

  const startEditing = (doc: SystemDocumentation) => {
    setEditingDoc({ ...doc });
    setIsAdding(false);
    setViewingDoc(null);
  };

  const startAdding = () => {
    setEditingDoc({
      id: `doc_${Date.now()}`,
      title: '',
      content: '',
      category: 'General',
      lastUpdated: new Date().toISOString(),
      updatedBy: '',
      tenantId: 'global',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncStatus: 'local_only' as any,
      version: 1,
      schemaVersion: 1,
      deleted: false,
    });
    setIsAdding(true);
    setViewingDoc(null);
  };

  return (
    <Layout
      title="System Documentation"
      subtitle="Panduan Teknis & Arsitektur Sistem"
      icon={CommandLineIcon}
      onBack={onBack}
      actions={
        isDeveloper &&
        !editingDoc && (
          <button
            onClick={startAdding}
            className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg active:scale-95 transition-all"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        )
      }
    >
      <div className="p-6 max-w-5xl mx-auto">
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500 opacity-20" />
            <p className="mt-4 text-slate-400 font-bold  tracking-wide text-[10px]">
              Loading Docs...
            </p>
          </div>
        ) : editingDoc ? (
          <div className="bg-white dark:bg-[#0B1121] rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-sm uppercase tracking-wide">
                {isAdding ? 'Tambah Dokumentasi' : 'Edit Dokumentasi'}
              </h3>
              <button
                onClick={() => setEditingDoc(null)}
                className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide px-1">
                    Judul
                  </label>
                  <input
                    required
                    type="text"
                    value={editingDoc.title}
                    onChange={(e) => setEditingDoc({ ...editingDoc, title: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/10"
                    placeholder="Contoh: Panduan API"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide px-1">
                    Kategori
                  </label>
                  <input
                    type="text"
                    value={editingDoc.category}
                    onChange={(e) => setEditingDoc({ ...editingDoc, category: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/10"
                    placeholder="Contoh: Technical"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide px-1">
                  Konten (Markdown)
                </label>
                <textarea
                  required
                  rows={15}
                  value={editingDoc.content}
                  onChange={(e) => setEditingDoc({ ...editingDoc, content: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 px-6 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500/10 resize-none"
                  placeholder="# Tulis dokumentasi di sini..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl text-[10px] uppercase tracking-wide flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                >
                  <SaveIcon className="w-4 h-4" /> Simpan Dokumentasi
                </button>
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold rounded-2xl text-[10px] uppercase tracking-wide active:scale-95 transition-all"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        ) : viewingDoc ? (
          <div className="bg-white dark:bg-[#0B1121] rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-[8px] font-bold uppercase tracking-wide border border-indigo-100 dark:border-indigo-800 mb-2 inline-block">
                  {viewingDoc.category}
                </span>
                <h3 className="font-bold text-xl uppercase tracking-tight">{viewingDoc.title}</h3>
              </div>
              <div className="flex gap-2">
                {isDeveloper && (
                  <button
                    onClick={() => startEditing(viewingDoc)}
                    className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm active:scale-90 transition-all"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => setViewingDoc(null)}
                  className="p-3 text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-10 prose dark:prose-invert max-w-none prose-slate">
              <div className="markdown-body">
                <ReactMarkdown>{viewingDoc.content}</ReactMarkdown>
              </div>
            </div>
            <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                Terakhir diperbarui: {new Date(viewingDoc.lastUpdated).toLocaleString()}
              </p>
              <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-wide">
                Oleh: {viewingDoc.updatedBy}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="bg-white dark:bg-[#0B1121] rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-indigo-500/30 transition-all group overflow-hidden"
              >
                <div className="p-8">
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 bg-slate-50 dark:bg-slate-900 text-slate-500 rounded-full text-[8px] font-bold uppercase tracking-wide border border-slate-100 dark:border-slate-800">
                      {doc.category}
                    </span>
                    {isDeveloper && (
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(doc);
                          }}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(doc.id!);
                          }}
                          className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <h4 className="font-bold text-sm uppercase tracking-tight mb-3 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {doc.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold line-clamp-2 mb-6 leading-relaxed">
                    {doc.content.replace(/[#*`]/g, '').substring(0, 100)}...
                  </p>
                  <button
                    onClick={() => setViewingDoc(doc)}
                    className="w-full py-3 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold rounded-xl text-[9px] uppercase tracking-wide hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                  >
                    Baca Selengkapnya
                  </button>
                </div>
              </div>
            ))}
            {docs.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white dark:bg-[#0B1121] rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                <BookOpenIcon className="w-12 h-12 mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-wide text-[10px]">
                  Belum ada dokumentasi sistem
                </p>
                {isDeveloper && (
                  <button
                    onClick={startAdding}
                    className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl text-[9px] font-bold uppercase tracking-wide active:scale-95 transition-all shadow-lg shadow-indigo-500/20"
                  >
                    Buat Dokumentasi Pertama
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0B1121] rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center text-rose-600 mb-6 mx-auto">
              <TrashIcon className="w-8 h-8" />
            </div>
            <h3 className="text-center font-bold text-slate-900 dark:text-white uppercase tracking-tight mb-2">
              Hapus Dokumentasi?
            </h3>
            <p className="text-center text-xs text-slate-500 dark:text-slate-400 font-medium mb-8">
              Tindakan ini tidak dapat dibatalkan. Dokumentasi akan dihapus permanen.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="flex-1 py-4 bg-rose-600 text-white font-bold rounded-2xl text-[10px] uppercase tracking-wide active:scale-95 transition-all shadow-lg shadow-rose-500/20"
              >
                Ya, Hapus
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold rounded-2xl text-[10px] uppercase tracking-wide active:scale-95 transition-all"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default SystemDocumentationView;
