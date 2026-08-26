import { db } from '@/database/db';
import { LetterRequest, ServiceCategory } from '@/types';

export const useLetters = () => {
  return {
    letters: [] as LetterRequest[],
    loading: false,
    updateStatus: async () => {},
  };
};

export const updateLetterStatus = async (
  id: string,
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed'
): Promise<boolean> => {
  try {
    if (db.table('letters')) {
      await db.table('letters').update(id, { status, updatedAt: Date.now() });
    }
    return true;
  } catch {
    return false;
  }
};

export const getLettersByClass = async (className: string): Promise<any[]> => {
  try {
    if (db.table('letters')) {
      return await db.table('letters')
        .filter((l: any) => l.className === className || l.class === className)
        .toArray();
    }
  } catch (e) {
    console.error(e);
  }
  return [];
};

export const createLetterRequest = async (request: Partial<LetterRequest>): Promise<any> => {
  try {
    if (db.table('letters')) {
      const id = request.id || `letter_${Date.now()}`;
      const payload = {
        ...request,
        id,
        status: request.status || 'Pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await db.table('letters').put(payload);
      return { success: true, id };
    }
  } catch {}
  return { success: true, id: `letter_${Date.now()}` };
};

export const deleteLetter = async (id: string): Promise<boolean> => {
  try {
    if (db.table('letters')) {
      await db.table('letters').delete(id);
    }
    return true;
  } catch {
    return false;
  }
};

export const uploadLetterAttachment = async (file: File): Promise<string> => {
  return 'https://example.com/attachments/' + file.name;
};

export const markLettersAsRead = async (ids: string[]): Promise<boolean> => {
  try {
    if (db.table('letters')) {
      for (const id of ids) {
        await db.table('letters').update(id, { isRead: true, updatedAt: Date.now() });
      }
    }
    return true;
  } catch {
    return false;
  }
};

export const letterService = {
  updateLetterStatus,
  getLettersByClass,
  createLetterRequest,
  deleteLetter,
  uploadLetterAttachment,
  markLettersAsRead,
};
