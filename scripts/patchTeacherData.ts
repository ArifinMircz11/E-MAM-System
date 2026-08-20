import { getAdminDb } from '../src/lib/firebase-admin';

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function patchTeachers() {
  const db = getAdminDb();
  const teachersRef = db.collection('teachers'); // Adjust if structure is 'users'

  console.log('Starting teacher data patching...');

  let lastDocument: any = null;
  let hasMore = true;
  let totalProcessed = 0;

  while (hasMore) {
    let query = teachersRef.orderBy('__name__').limit(50);
    if (lastDocument) {
      query = query.startAfter(lastDocument);
    }

    const snapshot = await query.get();
    if (snapshot.empty) {
      hasMore = false;
      break;
    }

    const batch = db.batch();
    snapshot.forEach((doc) => {
      const data = doc.data();
      const teachingClasses = Array.isArray(data.teachingClasses) ? data.teachingClasses : [];
      let updated = false;

      // Ensure walasOfClass is included in teachingClasses for consistency
      if (data.walasOfClass && !teachingClasses.includes(data.walasOfClass)) {
        teachingClasses.push(data.walasOfClass);
        updated = true;
      }

      // Ensure fields are consistent
      if (updated) {
        batch.update(doc.ref, {
          teachingClasses: teachingClasses,
          updatedAt: new Date(),
        });
      }
    });

    await batch.commit();

    lastDocument = snapshot.docs[snapshot.docs.length - 1];
    totalProcessed += snapshot.size;
    console.log(`Processed ${totalProcessed} teachers, waiting 2s...`);
    await delay(2000); // Respect quota
  }

  console.log('Teacher maintenance patching complete.');
}

patchTeachers().catch(console.error);
