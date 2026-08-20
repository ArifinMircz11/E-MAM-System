$file="src\services\dbGateway.ts"

$content=@"
/**
 * Firestore Gateway Compatibility Bridge
 *
 * Legacy callers are redirected to Sync Adapter.
 *
 * Target:
 * Service
 *   ↓
 * Repository
 *   ↓
 * SyncEngine
 *   ↓
 * Firestore
 */

import { firestoreAdapter } from "@/sync/adapters/firestore.adapter";
import { SyncEngine } from "@/sync/syncEngine";

export const syncEngine = SyncEngine;

/*
 * Temporary compatibility exports.
 * TODO: migrate hooks/services to Repository.
 */

export const db = firestoreAdapter;

export const collection = firestoreAdapter.collection;
export const doc = firestoreAdapter.doc;
export const query = firestoreAdapter.query;
export const where = firestoreAdapter.where;
export const orderBy = firestoreAdapter.orderBy;
export const limit = firestoreAdapter.limit;
export const onSnapshot = firestoreAdapter.onSnapshot;

export default firestoreAdapter;
"@

Set-Content $file $content -Encoding UTF8

Write-Host "dbGateway migrated to firestoreAdapter bridge"
