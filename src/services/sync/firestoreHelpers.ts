/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * Developed by: Akhmad Arifin
 * LAYER: SYNC SERVICES - FIRESTORE HELPERS
 */

import type {
  Query,
  DocumentReference,
  QuerySnapshot} from 'firebase/firestore';
import {
  getDocs,
  getDoc,
  getDocsFromCache,
  getDocFromCache
} from 'firebase/firestore';
import { QuotaState } from '@/utils/quotaState';
import { sanitizeForJSON } from '@/utils/dataHelpers';

/**
 * Enhanced getDocs that handles mapping automatically
 */
export async function getDocsSafe<T>(q: Query): Promise<T[]> {
  try {
    if (!QuotaState.isQuotaExhausted()) {
      const snap = await getDocs(q);
      if (snap && snap.docs) {
        return snap.docs.map((doc) =>
          sanitizeForJSON({
            id: doc.id,
            ...doc.data(),
          }),
        ) as T[];
      }
    }
  } catch (error: any) {
    const errMsg = error instanceof Error ? error.message : String(error);
    if (error?.code === 'resource-exhausted' || errMsg.includes('resource-exhausted') || errMsg.includes('Quota exceeded')) {
      QuotaState.markExhausted();
    }
    console.warn(`[getDocsSafe] Query failed:`, error);
  }

  // Fallback to cache
  try {
    const cacheSnap = await getDocsFromCache(q);
    if (cacheSnap && !cacheSnap.empty) {
      console.log(`[getDocsSafe] Loaded from cache fallback successfully.`);
      return cacheSnap.docs.map((doc) =>
        sanitizeForJSON({
          id: doc.id,
          ...doc.data(),
        }),
      ) as T[];
    }
  } catch (cacheErr) {
    // Ignore cache error
  }
  return [];
}

/**
 * Enhanced getDoc that handles mapping automatically
 */
export async function getDocSafe<T>(ref: DocumentReference): Promise<T | null> {
  try {
    if (!QuotaState.isQuotaExhausted()) {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return sanitizeForJSON({ id: snap.id, ...snap.data() }) as T;
      }
      return null;
    }
  } catch (error: any) {
    const errMsg = error instanceof Error ? error.message : String(error);
    if (error?.code === 'resource-exhausted' || errMsg.includes('resource-exhausted') || errMsg.includes('Quota exceeded')) {
      QuotaState.markExhausted();
    }
    if (error.code === 'permission-denied') {
      console.warn(`Permission denied at ${ref.path}. This is expected for some public views.`);
      return null;
    }
    console.warn(`Firebase error reading document at ${ref.path}:`, error);
  }

  // Fallback to cache
  try {
    const cacheSnap = await getDocFromCache(ref);
    if (cacheSnap.exists()) {
      return sanitizeForJSON({ id: cacheSnap.id, ...cacheSnap.data() }) as T;
    }
  } catch (e) {
    // Cache miss
  }

  return null;
}

/**
 * Optimized getDocs that tries cache first (Offline-First)
 */
export async function getDocsOptimized<T>(q: Query): Promise<T[]> {
  try {
    const snap = await getDocsFromCache(q);
    if (!snap.empty) {
      return snap.docs.map((doc) =>
        sanitizeForJSON({
          id: doc.id,
          ...doc.data(),
        }),
      ) as T[];
    }
  } catch (e) {
    // Cache miss or other error
  }

  return await getDocsSafe<T>(q);
}

/**
 * Optimized getDoc that tries cache first
 */
export async function getDocOptimized<T>(ref: DocumentReference): Promise<T | null> {
  try {
    const snap = await getDocFromCache(ref);
    if (snap.exists()) {
      return sanitizeForJSON({ id: snap.id, ...snap.data() }) as T;
    }
  } catch (e) {
    // Cache miss
  }

  return await getDocSafe<T>(ref);
}

/**
 * Raw version of optimized getDocs returning QuerySnapshot
 */
export async function getDocsRawOptimized(q: Query): Promise<QuerySnapshot> {
  try {
    const snap = await getDocsFromCache(q);
    if (!snap.empty) return snap;
  } catch (e) {
    // Cache miss
  }

  if (QuotaState.isQuotaExhausted()) {
    const snap = await getDocsFromCache(q);
    return snap;
  }

  try {
    return await getDocs(q);
  } catch (err: any) {
    const errMsg = err instanceof Error ? err.message : String(err);
    if (err?.code === 'resource-exhausted' || errMsg.includes('resource-exhausted') || errMsg.includes('Quota exceeded')) {
      QuotaState.markExhausted();
    }
    return await getDocsFromCache(q);
  }
}
