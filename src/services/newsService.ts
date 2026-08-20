import { newsRepository } from '@/repositories/newsRepository';
import type { NewsItem} from '@/types';
import { useUserStore } from '@/stores/userStore';
import { useAuthStore } from '@/stores/authStore';
import { sanitizeForJSON } from '@/utils/firestoreHelpers';
import { authGateway } from './auth/AuthGateway';
import axios from 'axios';

const API_BASE = '/api/news';

export const getNews = async (onlyPublished = true, forceRefresh = false): Promise<NewsItem[]> => {
  const tenantId = useUserStore.getState().tenantId;
  if (!tenantId) throw new Error('tenantId required');

  // Attempt local-first through repository
  return await newsRepository.getNews(tenantId, onlyPublished);
};

export const saveNews = async (
  id: string | undefined,
  newsData: Partial<NewsItem>,
): Promise<string> => {
  const userStore = useUserStore.getState();
  const authStore = useAuthStore.getState();
  const tenantId = useUserStore.getState().tenantId;
  if (!tenantId) throw new Error('tenantId required');

  // Get JWT token from Firebase via AuthGateway
  const token = await authGateway.getCurrentUser()?.getIdToken();
  if (!token) throw new Error('Authentication required');

  const payload = sanitizeForJSON({
    newsData: {
      ...newsData,
      author: authStore.user?.displayName || 'Admin',
      authorUid: userStore.uid || 'system',
    },
    tenantId,
  });

  if (id) {
    await axios.put(`${API_BASE}/${id}`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // Sync local cache
    await newsRepository.saveNews({ ...newsData, id }, tenantId);
    return id;
  } else {
    const response = await axios.post(API_BASE, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const newId = response.data.id;
    // Sync local cache
    await newsRepository.saveNews({ ...newsData, id: newId }, tenantId);
    return newId;
  }
};

export const deleteNews = async (id: string) => {
  const token = await authGateway.getCurrentUser()?.getIdToken();
  if (!token) throw new Error('Authentication required');

  await axios.delete(`${API_BASE}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  await newsRepository.deleteNews(id);
};

export const uploadNewsImage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
