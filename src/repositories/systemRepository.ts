import { localDb } from '@/database/dexie';
import type { AboutContent } from '@/types';

export const systemRepository = {
  async getAboutContent(): Promise<AboutContent | null> {
    try {
      const record = await localDb.systemSettings.get('about_content_main');
      return record ? (record.value as AboutContent) : null;
    } catch (e) {
      console.warn('Error fetching about content from Dexie:', e);
      return null;
    }
  },

  async saveAboutContent(content: AboutContent): Promise<void> {
    const payload = {
      key: 'about_content_main',
      value: content,
      lastUpdated: Date.now(),
    };
    await localDb.systemSettings.put(payload);

    await localDb.sync_queue.add({
      id: crypto.randomUUID(),
      collection: 'about_content',
      documentId: 'main',
      action: 'UPDATE',
      payload: content,
      status: 'PENDING',
      createdAt: Date.now(),
      retryCount: 0,
    });
  },
};
