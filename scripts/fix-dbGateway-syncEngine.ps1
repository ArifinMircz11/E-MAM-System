$file="src\services\dbGateway.ts"

$content=@"
/**
 * Firestore Gateway Compatibility Layer
 *
 * EAOM Target:
 *
 * Service
 *   ↓
 * Repository
 *   ↓
 * SyncEngine
 *   ↓
 * Firestore
 *
 * Legacy compatibility only.
 */

import { SyncEngine } from "@/sync/syncEngine";

export const syncEngine = SyncEngine;

export const db = SyncEngine;

export const doc = undefined;
export const onSnapshot = undefined;

export default SyncEngine;
"@

Set-Content $file $content -Encoding UTF8

Write-Host "dbGateway.ts updated to SyncEngine bridge"
