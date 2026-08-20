import { db } from '../src/services/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function checkCategories() {
  try {
    const snap = await getDocs(collection(db, 'point_categories'));
    console.log("--- RAW DATA FROM 'point_categories' ---");
    snap.forEach((doc) => {
      console.log(`ID: ${doc.id}, Data:`, JSON.stringify(doc.data()));
    });
    console.log('-----------------------------------------');
  } catch (e) {
    console.error('Error fetching:', e);
  }
}

checkCategories();
