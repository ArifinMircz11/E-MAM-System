import React, { useState, useRef } from 'react';
import Layout from '@/layouts/Layout';
import {
  MegaphoneIcon,
  ArrowRightIcon,
  StarIcon,
  Squares2x2Icon,
  RectangleStackIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  Loader2,
  XMarkIcon,
  CheckCircleIcon,
  CameraIcon,
  CloudIcon,
  CloudOffIcon,
} from '@/shared/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import type { NewsItem } from '@/types';
import { UserRole } from '@/types';
import { useNews } from '@/hooks/useNews';
import { generateNewsContent, getAiQueryCount } from '@/services/geminiService';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

interface NewsProps {
  onBack: () => void;
  userRole?: UserRole;
  onOpenSidebar?: () => void;
}

const News: React.FC<NewsProps> = ({ onBack, userRole, onOpenSidebar }) => {
  const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.DEVELOPER;
  const isStaff = userRole === UserRole.STAF || userRole === UserRole.HUMAS;
  const canManage = isAdmin || isStaff;

  const {
    news,
    isLoading,
    isSubmitting,
    handleSave: saveNewsAction,
    handleDelete: deleteNewsAction,
    fetchNews,
  } = useNews(!canManage);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [editingNews, setEditingNews] = useState<Partial<NewsItem> | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = useAuthStore((s) => s.user?.displayName);
  const uid = useUserStore((s) => s.uid);

  const compressImage = (file: File, maxWidth = 1024, maxHeight = 768): Promise<string> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.src = url;
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context is null'));
        ctx.drawImage(img, 0, 0, width, height);

        const base64 = canvas.toDataURL('image/jpeg', 0.6);
        resolve(base64);
      };
      img.onerror = reject;
    });
  };

  const handleOpenAdd = () => {
    setEditingNews({
      title: '',
      summary: '',
      content: '',
      category: 'Berita',
      isPublished: true,
      featured: false,
      author: displayName || 'Admin',
      authorUid: uid || '',
      date: new Date().toISOString().split('T')[0],
    });
    setImagePreview(null);
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: NewsItem) => {
    setEditingNews(item);
    setImagePreview(item.image || null);
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const onSave = async () => {
    if (!editingNews?.title || !editingNews?.content) {
      toast.error('Judul dan isi berita wajib diisi.');
      return;
    }

    let imageUrl = editingNews.image || '';
    if (imageFile) {
      try {
        imageUrl = await compressImage(imageFile);
      } catch (err) {
        toast.error('Gagal mengompres gambar.');
        return;
      }
    }

    const success = await saveNewsAction(editingNews.id, {
      ...editingNews,
      image: imageUrl,
    });

    if (success) setIsModalOpen(false);
  };

  const handleAiGenerate = async () => {
    if (getAiQueryCount() >= 5) {
      toast.error('Batas maksimal AI tercapai.');
      return;
    }

    if (!aiPrompt.trim()) return;

    setIsGenerating(true);
    try {
      const result = await generateNewsContent(aiPrompt);
      setEditingNews((prev) => ({
        ...prev,
        title: result.title,
        summary: result.summary,
        content: result.content,
      }));
      setAiPrompt('');
    } catch (error) {
      toast.error('AI gagal merespons.');
    } finally {
      setIsGenerating(false);
    }
  };

  const featuredNews = news.find((n) => n.featured) || news[0];
  const regularNews = news.filter((n) => n.id !== featuredNews?.id);

  return (
    <Layout
      title="Portal Berita"
      subtitle="Informasi & Dokumentasi Madrasah"
      icon={MegaphoneIcon}
      onBack={onBack}
    >
      <div className="p-2 lg:p-4 pb-24 space-y-2 lg:space-y-4">
        {/* Admin Header Section */}
        {canManage && (
          <div className="flex justify-between items-center bg-white dark:bg-slate-900/50 p-2 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm mb-1">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/10">
                <PencilIcon className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-[8px] font-bold tracking-wide text-slate-800 dark:text-white uppercase leading-none mb-0.5">
                  News Desk
                </h4>
                <p className="text-[6px] font-bold text-slate-400 uppercase ">
                  Kelola warta
                </p>
              </div>
            </div>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[7px] font-bold uppercase tracking-wide shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
            >
              <PlusIcon className="w-3 h-3" /> Tambah
            </button>
          </div>
        )}

        {/* Featured Card */}
        {featuredNews && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setSelectedNews(featuredNews)}
            className="relative overflow-hidden rounded-[2rem] bg-slate-900 h-[260px] lg:h-[400px] group cursor-pointer shadow-xl border border-white/5"
          >
            {featuredNews.image ? (
              <img
                src={featuredNews.image}
                alt={featuredNews.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="absolute inset-0 bg-indigo-600 flex items-center justify-center">
                <MegaphoneIcon className="w-20 h-20 text-white/20" />
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent"></div>

            <div className="relative h-full flex flex-col justify-end p-5 lg:p-8 z-10">
              <div className="flex gap-2 mb-3">
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[8px] font-bold uppercase tracking-wide text-white border border-white/20">
                  {featuredNews.category}
                </span>
                {featuredNews.featured && (
                  <span className="px-3 py-1 rounded-full bg-yellow-400 text-slate-900 text-[8px] font-bold uppercase tracking-wide flex items-center gap-1 shadow-lg shadow-yellow-400/20">
                    <StarIcon className="w-2.5 h-2.5" /> Utama
                  </span>
                )}
                {(featuredNews as any).syncStatus === 'pending' && (
                  <span className="px-3 py-1 rounded-full bg-orange-500 text-white text-[8px] font-bold uppercase tracking-wide flex items-center gap-1 shadow-lg">
                    <CloudOffIcon className="w-2.5 h-2.5" /> Offline
                  </span>
                )}
              </div>

              <h2 className="text-xl lg:text-3xl font-bold text-white mb-3 leading-[1.1] tracking-tight max-w-2xl drop-shadow-lg">
                {featuredNews.title}
              </h2>

              <div className="flex items-center justify-between">
                <p className="text-[9px] font-bold text-white/60 uppercase tracking-[0.2em]">
                  {format(new Date(featuredNews.date), 'dd MMMM yyyy', { locale: localeID })}
                </p>
                <div className="flex gap-1.5">
                  {canManage && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(featuredNews);
                        }}
                        className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-xl transition-all border border-white/10"
                      >
                        <PencilIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNewsAction(featuredNews.id!);
                        }}
                        className="p-2 bg-white/10 hover:bg-red-500/20 backdrop-blur-md text-white hover:text-red-200 rounded-xl transition-all border border-white/10"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Compact Grid Layout */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-1.5">
              <h3 className="text-[8px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                Arsip Warta
              </h3>
              {isLoading && <Loader2 className="w-3 h-3 text-indigo-500 animate-spin" />}
            </div>

            <div className="flex gap-1">
              <button
                onClick={() => fetchNews(true)}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-indigo-500 transition-all border border-slate-200 dark:border-white/5"
                title="Segarkan Berita"
              >
                <motion.div whileTap={{ rotate: 180 }}>
                  <CloudIcon className="w-3 h-3" />
                </motion.div>
              </button>
              <div className="flex bg-slate-100 dark:bg-white/5 p-0.5 rounded-lg border border-slate-200 dark:border-white/5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-400'}`}
                >
                  <Squares2x2Icon className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-400'}`}
                >
                  <RectangleStackIcon className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {isLoading && news.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 bg-slate-50 dark:bg-white/5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mb-3" />
              <p className="text-[8px] font-bold uppercase tracking-wide text-slate-400">
                Sinkronisasi...
              </p>
            </div>
          ) : regularNews.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-white/5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10">
              <MegaphoneIcon className="w-10 h-10 text-slate-300 dark:text-white/10 mx-auto mb-3" />
              <p className="text-[8px] font-bold uppercase tracking-wide text-slate-400">
                Belum ada warta tambahan
              </p>
            </div>
          ) : (
            <div
              className={`grid ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2' : 'flex flex-col gap-1.5'}`}
            >
              {regularNews.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => setSelectedNews(item)}
                  className={`group relative bg-white dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-white/5 overflow-hidden transition-all hover:shadow-lg hover:shadow-indigo-500/5 cursor-pointer ${viewMode === 'list' ? 'flex flex-row p-1.5 gap-2 items-center' : 'flex flex-col shadow-sm'}`}
                >
                  <div
                    className={`${viewMode === 'grid' ? 'h-24 sm:h-32 w-full' : 'w-16 h-16 rounded-lg'} overflow-hidden relative shrink-0 bg-slate-100 dark:bg-slate-950`}
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-indigo-50 dark:bg-indigo-500/5">
                        <MegaphoneIcon className="w-5 h-5 text-indigo-100 dark:text-indigo-500/5" />
                      </div>
                    )}
                    <div className="absolute top-1 left-1 flex gap-1">
                      <span className="px-1.5 py-0.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-md text-[6px] font-bold uppercase tracking-wide text-indigo-600 shadow-sm border border-slate-100 dark:border-white/5">
                        {item.category}
                      </span>
                    </div>
                    {!item.isPublished && (
                      <div className="absolute inset-0 bg-yellow-500/20 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="px-2 py-0.5 bg-yellow-400 text-black text-[7px] font-bold uppercase tracking-wide rounded-md shadow-xl">
                          DRAFT
                        </span>
                      </div>
                    )}
                  </div>

                  <div className={`flex-1 flex flex-col ${viewMode === 'grid' ? 'p-2' : 'pr-0.5'}`}>
                    <time className="text-[7px] font-bold text-slate-400 uppercase tracking-wide mb-0.5 block">
                      {format(new Date(item.date), 'dd MMM yy', { locale: localeID })}
                    </time>
                    <h4
                      className={`font-bold text-slate-900 dark:text-white leading-[1.2] mb-1 group-hover:text-indigo-600 transition-colors tracking-tight line-clamp-2 ${viewMode === 'grid' ? 'text-[10px] sm:text-xs' : 'text-[10px]'}`}
                    >
                      {item.title}
                    </h4>

                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex gap-1">
                        {canManage && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(item);
                              }}
                              className="w-5 h-5 rounded-md bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-indigo-600 flex items-center justify-center transition-all border border-slate-100 dark:border-white/5"
                            >
                              <PencilIcon className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNewsAction(item.id!);
                              }}
                              className="w-5 h-5 rounded-md bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-red-500 flex items-center justify-center transition-all border border-slate-100 dark:border-white/5"
                            >
                              <TrashIcon className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                      <div className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:translate-x-0.5">
                        <ArrowRightIcon className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Detail View Modal */}
        <AnimatePresence>
          {selectedNews && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedNews(null)}
                className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white dark:bg-[#151E32] w-full h-full sm:h-[95vh] sm:w-[95vw] sm:max-w-5xl sm:rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={() => setSelectedNews(null)}
                  className="absolute top-6 right-6 z-50 w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/20 transition-all active:scale-90"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>

                <div className="overflow-y-auto flex-1 custom-scrollbar pb-20">
                  {selectedNews.image ? (
                    <div className="h-[45vh] sm:h-[60vh] w-full relative">
                      <img
                        src={selectedNews.image}
                        alt={selectedNews.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#151E32] via-transparent to-transparent"></div>
                    </div>
                  ) : (
                    <div className="h-40 bg-indigo-600 flex items-center justify-center">
                      <MegaphoneIcon className="w-16 h-16 text-white/20" />
                    </div>
                  )}

                  <div className="max-w-3xl mx-auto px-6 md:px-10 -mt-16 sm:-mt-24 relative z-10">
                    <div className="flex flex-wrap gap-2 mb-8">
                      <span className="px-5 py-1.5 bg-indigo-600 text-[10px] font-bold text-white rounded-full uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20">
                        {selectedNews.category || 'Berita'}
                      </span>
                      <span className="px-5 py-1.5 bg-white/10 dark:bg-white/5 backdrop-blur-md text-[10px] font-bold text-slate-600 dark:text-slate-400 rounded-full uppercase tracking-[0.2em] border border-slate-200 dark:border-white/10">
                        {format(new Date(selectedNews.date), 'dd MMMM yyyy', { locale: localeID })}
                      </span>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-[1.1] mb-8 tracking-tight">
                      {selectedNews.title}
                    </h2>

                    <div className="max-w-none font-sans">
                      <div className="text-base md:text-lg text-slate-700 dark:text-slate-300 leading-relaxed space-y-5 markdown-body">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkBreaks]}
                          components={{
                            a: ({ node, ...props }) => (
                              <a
                                {...props}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:underline font-bold"
                              />
                            ),
                            p: ({ node, ...props }) => <p {...props} className="text-justify" />,
                          }}
                        >
                          {selectedNews.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-center gap-2">
                  <button
                    onClick={() => setSelectedNews(null)}
                    className="px-4 py-2 bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 text-[8px] font-bold uppercase tracking-[0.1em] rounded-lg border border-slate-200 dark:border-white/10 transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    Tutup
                  </button>
                  {canManage && (
                    <>
                      <button
                        onClick={() => {
                          const item = selectedNews;
                          setSelectedNews(null);
                          handleEdit(item);
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[8px] font-bold uppercase tracking-[0.1em] shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        <PencilIcon className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => {
                          const id = selectedNews.id!;
                          setSelectedNews(null);
                          deleteNewsAction(id);
                        }}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[8px] font-bold uppercase tracking-[0.1em] shadow-lg shadow-red-500/20 transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        <TrashIcon className="w-3.5 h-3.5" /> Hapus
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal Editor Berita */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white dark:bg-[#151E32] w-full h-full sm:h-[95vh] sm:w-[95vw] sm:max-w-5xl sm:rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-6 right-6 z-50 w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/20 transition-all active:scale-90"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>

                <div className="overflow-y-auto flex-1 custom-scrollbar">
                  {/* Modal Header */}
                  <div className="p-8 pb-4 sm:p-12 sm:pb-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                    <div className="max-w-3xl mx-auto">
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-600 mb-2 leading-none">
                        Editor Berita
                      </h3>
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                        {editingNews?.id ? 'Perbarui Konten' : 'Publikasi Baru'}
                      </h2>
                    </div>
                  </div>

                  <div className="max-w-3xl mx-auto p-8 sm:p-12 space-y-12 pb-24">
                    {/* AI Generator Section */}
                    <div className="p-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-[2.5rem] text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
                        <StarIcon className="w-32 h-32" />
                      </div>
                      <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                            <StarIcon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-100">
                              AI Assistant
                            </h4>
                            <p className="text-sm font-bold text-white">
                              Bantu tulis naskah berita secara instan
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="Ketik topik: Misal 'Lomba 17 Agustus'..."
                            className="flex-1 px-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-[1.5rem] text-sm font-bold placeholder:text-white/50 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                            onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
                          />
                          <button
                            onClick={handleAiGenerate}
                            disabled={isGenerating}
                            className="px-8 py-4 bg-white text-indigo-600 hover:bg-slate-50 disabled:opacity-50 rounded-[1.5rem] text-[10px] font-bold uppercase tracking-wide shadow-xl transition-all flex items-center justify-center gap-2"
                          >
                            {isGenerating ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <StarIcon className="w-5 h-5" />
                            )}
                            Buat Naskah
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Media Upload */}
                    <div className="space-y-4">
                      <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 block px-1">
                        Visual Utama (Sampul)
                      </label>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="relative group cursor-pointer aspect-video rounded-[2.5rem] bg-slate-50 dark:bg-white/5 border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center overflow-hidden transition-all hover:border-indigo-500/50"
                      >
                        {imagePreview ? (
                          <>
                            <img
                              src={imagePreview}
                              className="absolute inset-0 w-full h-full object-cover"
                              alt="Preview"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-2xl">
                                <CameraIcon className="w-8 h-8 text-indigo-600" />
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center p-12">
                            <div className="w-20 h-20 rounded-[2rem] bg-white dark:bg-white/5 flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-all">
                              <CameraIcon className="w-10 h-10 text-indigo-500" />
                            </div>
                            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                              Unggah Foto Berita
                            </p>
                            <p className="text-[9px] font-bold text-slate-300 mt-2">
                              JPG, PNG atau WEBP (Maks 2MB)
                            </p>
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 block px-1">
                          Judul Headline
                        </label>
                        <input
                          value={editingNews?.title}
                          onChange={(e) =>
                            setEditingNews((prev) => ({ ...prev, title: e.target.value }))
                          }
                          className="w-full px-8 py-5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[1.5rem] text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white"
                          placeholder="Apa yang terjadi?"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 block px-1">
                          Kategori Warta
                        </label>
                        <select
                          value={editingNews?.category}
                          onChange={(e) =>
                            setEditingNews((prev) => ({ ...prev, category: e.target.value }))
                          }
                          className="w-full px-8 py-5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[1.5rem] text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all appearance-none dark:text-white"
                        >
                          <option>Berita</option>
                          <option>Pengumuman</option>
                          <option>Akademik</option>
                          <option>Prestasi</option>
                          <option>Kegiatan</option>
                          <option>Liputan</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-end px-1">
                        <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 block">
                          Isi Warta
                        </label>
                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wide">
                          Mendukung Format Markdown
                        </span>
                      </div>
                      <textarea
                        value={editingNews?.content}
                        onChange={(e) =>
                          setEditingNews((prev) => ({ ...prev, content: e.target.value }))
                        }
                        rows={15}
                        className="w-full px-10 py-8 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] text-base leading-relaxed font-medium focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white resize-none"
                        placeholder="Tuliskan berita lengkap di sini..."
                      />
                    </div>

                    {/* Options */}
                    <div className="flex flex-wrap gap-8 p-10 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] border border-slate-100 dark:border-white/5">
                      <label className="flex items-center gap-4 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={editingNews?.isPublished}
                            onChange={(e) =>
                              setEditingNews((prev) => ({ ...prev, isPublished: e.target.checked }))
                            }
                            className="w-6 h-6 rounded-lg border-2 border-slate-300 text-indigo-600 focus:ring-0 transition-all checked:bg-indigo-600 appearance-none bg-white"
                          />
                          {editingNews?.isPublished && (
                            <CheckCircleIcon className="w-4 h-4 text-white absolute top-1 left-1 pointer-events-none" />
                          )}
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">
                          Publikasikan
                        </span>
                      </label>
                      <label className="flex items-center gap-4 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={editingNews?.featured}
                            onChange={(e) =>
                              setEditingNews((prev) => ({ ...prev, featured: e.target.checked }))
                            }
                            className="w-6 h-6 rounded-lg border-2 border-slate-300 text-yellow-500 focus:ring-0 transition-all checked:bg-yellow-500 appearance-none bg-white"
                          />
                          {editingNews?.featured && (
                            <StarIcon className="w-4 h-4 text-white absolute top-1 left-1 pointer-events-none" />
                          )}
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">
                          Warta Utama
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-end gap-3 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3 bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 text-[9px] font-bold uppercase tracking-[0.1em] rounded-xl border border-slate-100 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 transition-all active:scale-95 text-center"
                  >
                    Batal
                  </button>
                  <button
                    onClick={onSave}
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-bold uppercase tracking-[0.1em] rounded-xl shadow-xl shadow-indigo-500/40 transition-all active:scale-95 flex items-center justify-center gap-2 group"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircleIcon className="w-4 h-4" />
                    )}
                    {editingNews?.id ? 'Simpan' : 'Siarkan'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default News;
