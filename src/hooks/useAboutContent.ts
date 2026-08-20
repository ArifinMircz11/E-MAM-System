import { useState, useEffect, useCallback } from 'react';
import { systemRepository } from '@/repositories/systemRepository';
import type { AboutContent } from '../types';
import { toast } from 'sonner';

export function useAboutContent() {
  const [content, setContent] = useState<AboutContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchContent = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await systemRepository.getAboutContent();
      if (data) setContent(data);
    } catch (error) {
      console.error('Failed to fetch about content', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const saveContent = async (newData: AboutContent) => {
    setIsSaving(true);
    try {
      await systemRepository.saveAboutContent(newData);
      setContent(newData);
      toast.success('Konten berhasil diperbarui');
      return true;
    } catch (error) {
      toast.error('Gagal menyimpan konten');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    content,
    isLoading,
    isSaving,
    saveContent,
    refresh: fetchContent,
    setContent, // Allow temporary UI updates
  };
}
