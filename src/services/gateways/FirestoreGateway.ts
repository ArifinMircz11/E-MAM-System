import { db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  runTransaction,
  writeBatch,
  increment,
  serverTimestamp,
  addDoc,
  deleteField,
  Timestamp,
  DocumentReference,
  QuerySnapshot,
  DocumentSnapshot,
  Firestore,
  QueryDocumentSnapshot,
  QueryConstraint,
  DocumentData,
  startAfter,
  documentId,
} from 'firebase/firestore';

export {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  runTransaction,
  writeBatch,
  increment,
  serverTimestamp,
  addDoc,
  deleteField,
  Timestamp,
  startAfter,
  documentId,
};

export type {
  DocumentReference,
  QuerySnapshot,
  DocumentSnapshot,
  Firestore,
  QueryDocumentSnapshot,
  QueryConstraint,
  DocumentData,
};

/**
 * FirestoreGateway
 *
 * Central gateway for all Firestore operations.
 * This is the ONLY place allowed to import from 'firebase/firestore'.
 */

export const firestoreGateway = {
  db: db as Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  deleteField,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  runTransaction,
  writeBatch,
  increment,
  serverTimestamp,
  Timestamp,
  startAfter,
  documentId,
};
