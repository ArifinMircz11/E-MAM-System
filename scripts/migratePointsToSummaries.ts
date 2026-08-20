import { getAdminDb } from '../src/lib/firebase-admin';

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function migrate() {
  const db = getAdminDb();
  const poinRef = db.collection('poin');

  const summaries: Record<
    string,
    { totalPrestasi: number; totalPelanggaran: number; rombel: string }
  > = {};

  console.log('Starting recursive cursor migration...');

  let lastDocument: any = null;
  let hasMore = true;

  while (hasMore) {
    let query = poinRef.orderBy('__name__').limit(50);
    if (lastDocument) {
      query = query.startAfter(lastDocument);
    }

    const snapshot = await query.get();
    if (snapshot.empty) {
      hasMore = false;
      break;
    }

    snapshot.forEach((doc) => {
      const data = doc.data();
      const rombel = data.rombel;
      const kategori = data.kategori;
      const key = `class_${rombel.replace(/\s+/g, '_')}`;

      if (!summaries[key]) {
        summaries[key] = { totalPrestasi: 0, totalPelanggaran: 0, rombel: rombel };
      }

      if (kategori === 'Prestasi') {
        summaries[key].totalPrestasi++;
      } else if (kategori === 'Pelanggaran') {
        summaries[key].totalPelanggaran++;
      }
    });

    lastDocument = snapshot.docs[snapshot.docs.length - 1];
    console.log(`Processed batch, last ID: ${lastDocument.id}, waiting 2s...`);
    await delay(2000); // Wait 2s to avoid quota limit
  }

  console.log('Finalizing batch updates...');

  // Firestore batch limit is 500 operations
  const entries = Object.entries(summaries);
  for (let i = 0; i < entries.length; i += 500) {
    const batch = db.batch();
    const chunk = entries.slice(i, i + 500);

    for (const [key, data] of chunk) {
      const summaryRef = db.collection('summaries').doc(key);
      batch.set(
        summaryRef,
        {
          ...data,
          lastSync: new Date(),
        },
        { merge: true },
      );
    }
    await batch.commit();
    console.log(`Committed batch ${Math.floor(i / 500) + 1}`);
  }

  console.log('Migration complete. Summaries updated.');
}

migrate();
