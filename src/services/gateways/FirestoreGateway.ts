/**
 * Canonical Firestore Gateway.
 *
 * IMPORTANT:
 * - This is the only client-side module allowed to import firebase/firestore.
 * - UI, hooks, services and repositories must never import the Firebase SDK.
 * - Dexie remains the operational source of truth; this gateway is cloud transport.
 */
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  collection as fsCollection,
  connectFirestoreEmulator,
  deleteDoc as fsDeleteDoc,
  doc as fsDoc,
  documentId as fsDocumentId,
  getFirestore,
  getDocs as fsGetDocs,
  limit as fsLimit,
  onSnapshot as fsOnSnapshot,
  orderBy as fsOrderBy,
  query as fsQuery,
  serverTimestamp as fsServerTimestamp,
  setDoc as fsSetDoc,
  startAfter as fsStartAfter,
  where as fsWhere,
  writeBatch as fsWriteBatch,
  type Firestore,
} from 'firebase/firestore';
import clientEnv, { getClientEnv } from '@/core/config/clientEnv';

export type QuerySnapshotMock = any;

class FirestoreGateway {
  readonly db: Firestore;
  readonly app: FirebaseApp;

  constructor() {
    const config = clientEnv.FIREBASE;
    if (!config.PROJECT_ID) throw new Error('[FirestoreGateway] Firebase PROJECT_ID is not configured.');

    this.app = getApps().length
      ? getApp()
      : initializeApp({
          apiKey: config.API_KEY,
          authDomain: config.AUTH_DOMAIN,
          projectId: config.PROJECT_ID,
          storageBucket: config.STORAGE_BUCKET,
          messagingSenderId: config.MESSAGING_SENDER_ID,
          appId: config.APP_ID,
          measurementId: config.MEASUREMENT_ID || undefined,
        });

    this.db = getFirestore(this.app, config.DATABASE_ID || '(default)');

    if (clientEnv.USE_FIREBASE_EMULATOR && typeof window !== 'undefined') {
      const host = getClientEnv('VITE_FIRESTORE_EMULATOR_HOST', '127.0.0.1');
      const port = Number(getClientEnv('VITE_FIRESTORE_EMULATOR_PORT', '8080'));
      connectFirestoreEmulator(this.db, host, port);
    }
  }

  collection(_db: Firestore, path: string) { return fsCollection(this.db, path); }
  doc(_db: Firestore, path: string, ...pathSegments: string[]) { return fsDoc(this.db, path, ...pathSegments); }
  query(collectionRef: any, ...queryConstraints: any[]) { return fsQuery(collectionRef, ...queryConstraints); }
  orderBy(field: string, direction: 'asc' | 'desc' = 'asc') { return fsOrderBy(field, direction); }
  limit(limitCount: number) { return fsLimit(limitCount); }
  where(field: string, op: any, value: any) { return fsWhere(field, op, value); }
  startAfter(...values: any[]) { return fsStartAfter(...values); }
  documentId() { return fsDocumentId(); }
  onSnapshot(queryRef: any, onNext: (snapshot: any) => void, onError?: (error: any) => void) { return fsOnSnapshot(queryRef, onNext, onError); }
  async getDocs(queryRef: any) { return fsGetDocs(queryRef); }
  async setDoc(docRef: any, data: Record<string, unknown>, options?: { merge?: boolean }) { return fsSetDoc(docRef, data, options); }
  async deleteDoc(docRef: any) { return fsDeleteDoc(docRef); }
  writeBatch() { return fsWriteBatch(this.db); }
  serverTimestamp() { return fsServerTimestamp(); }
}

export const firestoreGateway = new FirestoreGateway();
export const collection = (db: Firestore, path: string) => firestoreGateway.collection(db, path);
export const doc = (db: Firestore, path: string, ...segments: string[]) => firestoreGateway.doc(db, path, ...segments);
export const query = (ref: any, ...constraints: any[]) => firestoreGateway.query(ref, ...constraints);
export const where = (field: string, op: any, value: any) => firestoreGateway.where(field, op, value);
export const limit = (count: number) => firestoreGateway.limit(count);
export const orderBy = (field: string, direction: 'asc' | 'desc' = 'asc') => firestoreGateway.orderBy(field, direction);
export const startAfter = (...values: any[]) => firestoreGateway.startAfter(...values);
export const documentId = () => firestoreGateway.documentId();
export const onSnapshot = (ref: any, onNext: (snapshot: any) => void, onError?: (error: any) => void) => firestoreGateway.onSnapshot(ref, onNext, onError);
export const writeBatch = () => firestoreGateway.writeBatch();
export const serverTimestamp = () => firestoreGateway.serverTimestamp();
