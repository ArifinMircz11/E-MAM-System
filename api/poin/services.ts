import { getAdminDb } from '../../src/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const rombelToKey = (rombel: string) => `class_${rombel.replace(/\s+/g, '_')}`;

export const addPointWithAggregation = async (pointData: any) => {
  const adminDb = getAdminDb();
  const summaryRef = adminDb.collection('summaries').doc(rombelToKey(pointData.rombel));
  const pointRef = adminDb.collection('poin').doc();

  return await adminDb.runTransaction(async (transaction: any) => {
    transaction.set(pointRef, {
      ...pointData,
      createdAt: FieldValue.serverTimestamp(),
    });

    const field = pointData.kategori === 'Prestasi' ? 'totalPrestasi' : 'totalPelanggaran';

    transaction.set(
      summaryRef,
      {
        rombel: pointData.rombel,
        [field]: FieldValue.increment(1),
        lastSync: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return { success: true, id: pointRef.id };
  });
};

export const updatePointWithAggregation = async (pointId: string, oldData: any, newData: any) => {
  const adminDb = getAdminDb();
  const summaryRef = adminDb.collection('summaries').doc(rombelToKey(oldData.rombel));
  const pointRef = adminDb.collection('poin').doc(pointId);

  return await adminDb.runTransaction(async (transaction: any) => {
    transaction.update(pointRef, {
      ...newData,
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (oldData.kategori !== newData.kategori) {
      const oldField = oldData.kategori === 'Prestasi' ? 'totalPrestasi' : 'totalPelanggaran';
      const newField = newData.kategori === 'Prestasi' ? 'totalPrestasi' : 'totalPelanggaran';

      transaction.set(
        summaryRef,
        {
          [oldField]: FieldValue.increment(-1),
          [newField]: FieldValue.increment(1),
          lastSync: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    return { success: true };
  });
};

export const deletePointWithAggregation = async (pointId: string, pointData: any) => {
  const adminDb = getAdminDb();
  const summaryRef = adminDb.collection('summaries').doc(rombelToKey(pointData.rombel));
  const pointRef = adminDb.collection('poin').doc(pointId);

  return await adminDb.runTransaction(async (transaction: any) => {
    transaction.delete(pointRef);

    const field = pointData.kategori === 'Prestasi' ? 'totalPrestasi' : 'totalPelanggaran';

    transaction.set(
      summaryRef,
      {
        [field]: FieldValue.increment(-1),
        lastSync: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return { success: true };
  });
};
