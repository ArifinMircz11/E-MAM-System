import { useState, useEffect } from 'react';
import { LetterRequest } from '@/types';
import { db } from '@/database/db';

export const useLetters = (tenantId: string = 'tenant-demo') => {
  const [letters, setLetters] = useState<LetterRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchLetters = async () => {
      setLoading(true);
      try {
        if (db.table('letters')) {
          const list = await db.table('letters').where('tenantId').equals(tenantId).toArray();
          setLetters(list);
        }
      } catch {
        setLetters([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLetters();
  }, [tenantId]);

  return { letters, loading, setLetters };
};
