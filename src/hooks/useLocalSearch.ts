import { useState, useEffect, useCallback } from 'react';
import type { LocalSearchResult } from '@/services/LocalSearchService';
import { LocalSearchService } from '@/services/LocalSearchService';

export const useLocalSearch = () => {
  const [query, setQuery] = useState('');
  const [entityType, setEntityType] = useState<'all' | 'student' | 'teacher' | 'class'>('all');
  const [result, setResult] = useState<LocalSearchResult>({
    query: '',
    durationMs: 0,
    students: [],
    teachers: [],
    classes: [],
    totalCount: 0,
    items: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  const performSearch = useCallback(async (searchQuery: string, type: 'all' | 'student' | 'teacher' | 'class') => {
    setIsLoading(true);
    try {
      const res = await LocalSearchService.searchAll(searchQuery, type);
      setResult(res);
    } catch (err) {
      console.error('[useLocalSearch] error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query, entityType);
    }, 150);

    return () => clearTimeout(timer);
  }, [query, entityType, performSearch]);

  return {
    query,
    setQuery,
    entityType,
    setEntityType,
    result,
    isLoading,
    refreshSearch: () => performSearch(query, entityType),
  };
};
