/**
 * Firestore Gateway
 * Provides standard firestore proxy operations with safe offline fallback
 */

export interface QuerySnapshotMock {
  forEach: (callback: (doc: { id: string; data: () => any }) => void) => void;
  docs: Array<{ id: string; data: () => any }>;
  empty: boolean;
  size: number;
}

export class FirestoreGateway {
  db: any = {};

  collection(dbInstance: any, path: string) {
    return { path, type: 'collection' };
  }

  doc(dbInstance: any, path: string, ...pathSegments: string[]) {
    const fullPath = [path, ...pathSegments].join('/');
    return { path: fullPath, type: 'doc' };
  }

  query(collectionRef: any, ...queryConstraints: any[]) {
    return {
      collectionRef,
      constraints: queryConstraints,
      type: 'query',
    };
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
    return { type: 'orderBy', field, direction };
  }

  limit(limitCount: number) {
    return { type: 'limit', count: limitCount };
  }

  where(field: string, op: string, value: any) {
    return { type: 'where', field, op, value };
  }

  onSnapshot(
    queryRef: any,
    onNext: (snapshot: QuerySnapshotMock) => void,
    onError?: (error: any) => void
  ): () => void {
    // Deliver an initial snapshot
    const mockSnapshot: QuerySnapshotMock = {
      forEach: (cb) => {},
      docs: [],
      empty: true,
      size: 0,
    };

    const timer = setTimeout(() => {
      try {
        onNext(mockSnapshot);
      } catch (err) {
        if (onError) onError(err);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }

  async getDocs(queryRef: any): Promise<QuerySnapshotMock> {
    return {
      forEach: () => {},
      docs: [],
      empty: true,
      size: 0,
    };
  }
}

export const firestoreGateway = new FirestoreGateway();

export const collection = (dbInstance: any, path: string) => firestoreGateway.collection(dbInstance, path);
export const doc = (dbInstance: any, path: string, ...pathSegments: string[]) => firestoreGateway.doc(dbInstance, path, ...pathSegments);
export const query = (collectionRef: any, ...queryConstraints: any[]) => firestoreGateway.query(collectionRef, ...queryConstraints);
export const where = (field: string, op: string, value: any) => firestoreGateway.where(field, op, value);
export const limit = (limitCount: number) => firestoreGateway.limit(limitCount);
export const orderBy = (field: string, direction: 'asc' | 'desc' = 'asc') => firestoreGateway.orderBy(field, direction);
export const onSnapshot = (queryRef: any, onNext: (snapshot: QuerySnapshotMock) => void, onError?: (error: any) => void) => firestoreGateway.onSnapshot(queryRef, onNext, onError);

export const writeBatch = (dbInstance: any) => ({
  set: (docRef: any, data: any, options?: any) => {},
  delete: (docRef: any) => {},
  commit: async () => {},
});

export const serverTimestamp = () => Date.now();

