import { db } from './firebase';
import { firestoreGateway } from './gateways/FirestoreGateway';

export { firestoreGateway };

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
} from './gateways/FirestoreGateway';

export type {
  DocumentReference,
  QuerySnapshot,
  DocumentSnapshot,
  Firestore,
  QueryDocumentSnapshot,
  QueryConstraint,
  DocumentData,
} from './gateways/FirestoreGateway';

export { db };
