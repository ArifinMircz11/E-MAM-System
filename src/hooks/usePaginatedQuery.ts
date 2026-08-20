import { useState, useEffect, useCallback } from 'react';
import type {
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot} from '@/services/dbGateway';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  db as firestoreDb,
} from '@/services/dbGateway';
import { useUserStore } from '../stores/userStore';

export function usePaginatedQuery<T = DocumentData>(
  collectionName: string,
  pageSize: number = 20,
  constraints: QueryConstraint[] = [],
  orderByField: string = 'createdAt',
) {
  const [data, setData] = useState<T[]>([]);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { tenantId } = useUserStore();

  const fetchPage = useCallback(
    async (isInitial = false) => {
      if (loading || (!hasMore && !isInitial)) return;

      setLoading(true);

      try {
        const colRef = collection(firestoreDb, collectionName);

        const qConstraints = [
          ...constraints,
          where('tenantId', '==', tenantId),
          orderBy(orderByField, 'desc'),
          limit(pageSize),
        ];

        if (!isInitial && lastVisible) {
          qConstraints.push(startAfter(lastVisible));
        }

        const q = query(colRef, ...qConstraints);
        const snapshot = await getDocs(q);

        const newLastVisible = snapshot.docs[snapshot.docs.length - 1];
        const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T);

        if (isInitial) {
          setData(items);
        } else {
          setData((prev) => [...prev, ...items]);
        }

        setLastVisible(newLastVisible || null);
        setHasMore(snapshot.docs.length === pageSize);
      } catch (error) {
        console.error(`Error fetching paginated data from ${collectionName}:`, error);
      } finally {
        setLoading(false);
      }
    },
    [collectionName, pageSize, constraints, lastVisible, hasMore, tenantId, orderByField],
  );

  useEffect(() => {
    fetchPage(true);
  }, [collectionName, tenantId]); // Simple trigger, refine as needed

  return { data, loading, hasMore, loadMore: () => fetchPage() };
}
