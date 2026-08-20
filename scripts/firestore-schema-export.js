// PHASE: FIRESTORE LEGACY DATA EXTRACTION
// PURPOSE: Export raw Firestore collections before Enterprise Data Dictionary V7.8 migration

import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define targeted collections to export
const COLLECTIONS = [
  "about_content",
  "academic_years",
  "ai_logs",
  "attendance",
  "attendance_monthly_summaries",
  "audit_logs",
  "audit_notifications",
  "chats",
  "class_chats",
  "classes",
  "complaints",
  "config",
  "daily_stats",
  "letters",
  "login_logs",
  "messageQueue",
  "metadata",
  "migration_backups",
  "migration_logs",
  "news",
  "notifications",
  "poin",
  "point_categories",
  "point_records",
  "point_transactions",
  "points",
  "profile_update_requests",
  "schedules",
  "settings",
  "student_point_summaries",
  "student_points",
  "students",
  "summaries",
  "system",
  "system_config",
  "system_configs",
  "system_settings",
  "teacher_attendance",
  "teachers",
  "tenants",
  "users"
];

async function runExport() {
  console.log('==================================================================');
  console.log('🚀 e-MAM FIRESTORE LEGACY DATA EXPORTER');
  console.log('==================================================================\n');

  // Candidate paths to find the service account credentials
  const candidatePaths = [
    path.join(__dirname, '..', 'firebase-service-account.json'),
    path.join(process.cwd(), 'firebase-service-account.json'),
    path.join(process.cwd(), '..', 'firebase-service-account.json')
  ];

  let serviceAccountPath = null;
  let serviceAccount = null;

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      serviceAccountPath = p;
      try {
        serviceAccount = JSON.parse(fs.readFileSync(p, 'utf8'));
        break;
      } catch (err) {
        console.warn(`⚠️ Found credential at ${p} but failed to parse JSON: ${err.message}`);
      }
    }
  }

  if (!serviceAccountPath || !serviceAccount) {
    console.error('❌ ERROR: Firebase Service Account credential file not found!');
    console.error('Please make sure you have placed the service account JSON key at:');
    console.error(`   ../firebase-service-account.json`);
    console.error('\nSearched locations:');
    candidatePaths.forEach(p => console.error(` - ${p}`));
    console.error('\nExiting export tool...\n');
    process.exit(1);
  }

  console.log(`✅ Loaded credentials from: ${serviceAccountPath}`);
  console.log(`🌐 Target Project ID: ${serviceAccount.project_id || 'Unknown'}\n`);

  // Initialize Firebase Admin SDK
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('🔥 Firebase Admin SDK initialized successfully.\n');
  } catch (error) {
    console.error('❌ ERROR: Failed to initialize Firebase Admin SDK!');
    console.error(error.message);
    process.exit(1);
  }

  const db = admin.firestore();
  const outputDir = path.join(__dirname, '..', 'docs', 'migration');
  
  // Create output directory if it does not exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created output directory: ${outputDir}`);
  }

  const fullExportData = {};
  const collectionsExported = [];
  let totalDocsCount = 0;

  for (const collectionName of COLLECTIONS) {
    console.log(`🔄 Exporting ${collectionName}...`);
    try {
      const snapshot = await db.collection(collectionName).get();
      const documents = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        
        // Ensure timestamps and complex types are serialized nicely to JSON
        const sanitizedData = sanitizeData(data);
        
        documents.push({
          id: doc.id,
          ...sanitizedData
        });
      });

      fullExportData[collectionName] = documents;
      collectionsExported.push(collectionName);
      totalDocsCount += documents.length;

      console.log(`👉 ${collectionName}: ${documents.length} documents exported`);
    } catch (error) {
      console.warn(`⚠️ WARNING: Failed to export collection "${collectionName}": ${error.message}`);
      // Ensure the collection is present in output as empty array to respect specification
      fullExportData[collectionName] = [];
    }
  }

  // Save the full raw export to docs/migration/firestore-full-export.json
  const exportFilePath = path.join(outputDir, 'firestore-full-export.json');
  try {
    fs.writeFileSync(exportFilePath, JSON.stringify(fullExportData, null, 2), 'utf8');
    console.log(`\n💾 Saved full raw export to: ${exportFilePath}`);
  } catch (error) {
    console.error(`❌ ERROR: Failed to write export file: ${error.message}`);
    process.exit(1);
  }

  // Save the export metadata to docs/migration/firestore-export-metadata.json
  const metadataFilePath = path.join(outputDir, 'firestore-export-metadata.json');
  const metadata = {
    exportDate: new Date().toISOString(),
    project: serviceAccount.project_id || 'unknown',
    collectionsExported: collectionsExported,
    totalDocuments: totalDocsCount
  };

  try {
    fs.writeFileSync(metadataFilePath, JSON.stringify(metadata, null, 2), 'utf8');
    console.log(`📋 Saved metadata log to: ${metadataFilePath}`);
  } catch (error) {
    console.error(`❌ ERROR: Failed to write metadata file: ${error.message}`);
  }

  console.log('\n==================================================================');
  console.log('🎉 EXPORT COMPLETED SUCCESSFULLY!');
  console.log(`Total Collections Processed: ${COLLECTIONS.length}`);
  console.log(`Total Documents Exported:   ${totalDocsCount}`);
  console.log('==================================================================\n');
}

// Helper to sanitize timestamps and object structures for JSON output
function sanitizeData(obj) {
  if (obj === null || obj === undefined) return obj;

  // Convert Firebase Timestamp objects to ISO String
  if (obj.constructor && obj.constructor.name === 'Timestamp') {
    return obj.toDate().toISOString();
  }

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeData(item));
  }

  if (typeof obj === 'object') {
    const res = {};
    for (const key of Object.keys(obj)) {
      res[key] = sanitizeData(obj[key]);
    }
    return res;
  }

  return obj;
}

runExport().catch(error => {
  console.error('❌ CRITICAL ERROR: Export process aborted!');
  console.error(error);
  process.exit(1);
});
