import { firestoreGateway as dbGateway } from './gateways/FirestoreGateway';
import { handleFirestoreError, OperationType } from './firebase';

const WALLET_COL = 'wallets';
const KOP_TRANS_COL = 'koperasi_transactions';
const INV_COL = 'koperasi_inventory';

export interface Wallet {
  studentsId: string;
  studentName: string;
  balance: number;
  lastUpdated: any;
}

export interface KoperasiTransaction {
  id?: string;
  studentsId: string;
  studentName: string;
  amount: number;
  type: 'TopUp' | 'Purchase' | 'Withdraw';
  items?: { id: string; name: string; qty: number; price: number }[];
  notes?: string;
  date: any;
  operatorId: string;
}

/**
 * Dapatkan informasi saldo siswa dari dompet digital.
 * Diperbarui dengan fallback caching O(1).
 */
export const getWalletBalanceSafe = async (studentsId: string): Promise<Wallet | null> => {
  try {
    const walletRef = dbGateway.doc(dbGateway.db, WALLET_COL, studentsId);
    const snap = await dbGateway.getDoc(walletRef);
    if (snap.exists()) {
      return { ...snap.data(), studentsId } as Wallet;
    }
    return null;
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, WALLET_COL);
    return null;
  }
};

/**
 * Top Up saldo siswa (Atomic Transaction)
 */
export const topUpWallet = async (
  studentsId: string,
  studentName: string,
  amount: number,
  operatorId: string,
) => {
  if (amount <= 0) throw new Error('Amanah gagal: Nominal top up harus lebih besar dari Rp 0');

  try {
    const walletRef = dbGateway.doc(dbGateway.db, WALLET_COL, studentsId);
    const transRef = dbGateway.doc(dbGateway.collection(dbGateway.db, KOP_TRANS_COL));

    await dbGateway.runTransaction(dbGateway.db, async (transaction: any) => {
      const walletDoc = await transaction.get(walletRef);
      let currentBalance = 0;

      if (walletDoc.exists()) {
        currentBalance = walletDoc.data().balance || 0;
      }

      const newBalance = currentBalance + amount;

      transaction.set(
        walletRef,
        {
          studentsId,
          studentName,
          balance: newBalance,
          lastUpdated: dbGateway.serverTimestamp(),
        },
        { merge: true },
      );

      transaction.set(transRef, {
        studentsId,
        studentName,
        amount,
        type: 'TopUp',
        notes: `Setoran Tabungan`,
        date: dbGateway.serverTimestamp(),
        operatorId,
      });
    });

    return true;
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, WALLET_COL);
    throw e;
  }
};

/**
 * Pembayaran Item Koperasi (Atomic Transaction mencegah minus saldo)
 */
export const processPurchase = async (
  studentsId: string,
  studentName: string,
  items: any[],
  totalAmount: number,
  operatorId: string,
) => {
  if (totalAmount <= 0) throw new Error('Amanah gagal: Total belanja tidak valid');

  try {
    const walletRef = dbGateway.doc(dbGateway.db, WALLET_COL, studentsId);
    const transRef = dbGateway.doc(dbGateway.collection(dbGateway.db, KOP_TRANS_COL));

    await dbGateway.runTransaction(dbGateway.db, async (transaction: any) => {
      const walletDoc = await transaction.get(walletRef);

      if (!walletDoc.exists()) {
        throw new Error('Siswa tidak memiliki saldo/dompet');
      }

      const currentBalance = walletDoc.data().balance || 0;
      if (currentBalance < totalAmount) {
        throw new Error('Amanah gagal: Saldo dompet tidak mencukupi untuk transaksi ini.');
      }

      const newBalance = currentBalance - totalAmount;

      transaction.update(walletRef, {
        balance: newBalance,
        lastUpdated: dbGateway.serverTimestamp(),
      });

      transaction.set(transRef, {
        studentsId,
        studentName,
        amount: totalAmount,
        type: 'Purchase',
        items,
        notes: `Belanja Koperasi`,
        date: dbGateway.serverTimestamp(),
        operatorId,
      });
    });

    return true;
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, WALLET_COL);
    throw e;
  }
};
