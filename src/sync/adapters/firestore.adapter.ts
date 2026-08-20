import { firestoreGateway as db } from '../../services/gateways/FirestoreGateway';

export const firestoreAdapter = {
  db: db.db,
  doc: (path: string, ...pathSegments: string[]) => db.doc(db.db, path, ...pathSegments),
  collection: (path: string, ...pathSegments: string[]) => db.collection(db.db, path, ...pathSegments),
  setDoc: db.setDoc,
  updateDoc: db.updateDoc,
  deleteDoc: db.deleteDoc,
  getDoc: db.getDoc,
  getDocs: db.getDocs,
  query: db.query,
  where: db.where,
  writeBatch: () => db.writeBatch(db.db),
  runTransaction: (updateFunction: (transaction: any) => Promise<any>) => db.runTransaction(db.db, updateFunction),
  increment: db.increment,
  serverTimestamp: db.serverTimestamp,
};
