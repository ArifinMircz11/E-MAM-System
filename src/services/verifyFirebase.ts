import { getFirestore } from './firebaseAdmin';

/**
 * Verifies the connection to Firestore by listing all collections.
 */
async function verifyConnection() {
  console.log('[Verification] Starting Firestore connection test...');
  
  try {
    const db = getFirestore();
    
    // Attempt to list collections as a verification of connectivity and permissions
    const collections = await db.listCollections();
    
    console.log('✅ [Verification] Firebase Admin SDK connected successfully.');
    console.log(`[Verification] Found ${collections.length} collections:`);
    
    if (collections.length === 0) {
      console.log(' - (No collections found in this database yet)');
    } else {
      collections.forEach((col: any) => {
        console.log(` - ${col.id || col}`);
      });
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ [Verification] Firestore connection failed:');
    console.error(` Error: ${error.message}`);
    
    // Specific error handling for common issues
    if (error.message.includes('ENOENT')) {
      console.error(' Tip: Check if the service account JSON file exists in the credentials/ folder.');
    } else if (error.message.includes('403') || error.message.includes('permission')) {
      console.error(' Tip: Ensure the service account has the "Cloud Datastore User" or "Firebase Admin" role.');
    }
    
    process.exit(1);
  }
}

// Execute verification
verifyConnection();
