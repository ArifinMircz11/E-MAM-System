import { getAdminDb } from '../src/lib/firebase-admin.ts';

async function checkConfig() {
  const db = getAdminDb();
  const doc = await db.collection('system_config').doc('feature_locks').get();
  if (doc.exists) {
    console.log('Feature Locks:', doc.data());
  } else {
    console.log('Feature Locks document not found');
  }
}

checkConfig().catch(console.error);
