import { useState, useCallback, useEffect } from 'react';
import type { NewsItem } from '../types';
import * as newsService from '../services/newsService';
import { useUserStore } from '../stores/userStore';
import { toast } from 'sonner';

export const useNews = (onlyPublished = true) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tenantId = useUserStore((s) => s.tenantId);

  const fetchNews = useCallback(
    async (force = false) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await newsService.getNews(onlyPublished, force);
        setNews(data);
      } catch (err: any) {
        setError(err.message);
        toast.error('Gagal memuat berita: ' + err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [onlyPublished],
  );

  useEffect(() => {
    if (tenantId) fetchNews();
  }, [tenantId, fetchNews]);

  const handleSave = async (id: string | undefined, data: Partial<NewsItem>) => {
    setIsSubmitting(true);
    try {
      await newsService.saveNews(id, data);
      toast.success(id ? 'Berita diperbarui' : 'Berita berhasil diterbitkan');
      await fetchNews(true);
      return true;
    } catch (err: any) {
      toast.error('Gagal menyimpan berita: ' + err.message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus berita ini?')) return;

    setIsSubmitting(true);
    try {
      await newsService.deleteNews(id);
      toast.success('Berita dihapus');
      await fetchNews(true);
    } catch (err: any) {
      toast.error('Gagal menghapus berita: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    news,
    isLoading,
    error,
    isSubmitting,
    fetchNews,
    handleSave,
    handleDelete,
  };
};
