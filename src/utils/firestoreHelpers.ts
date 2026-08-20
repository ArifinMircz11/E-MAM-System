// src/utils/firestoreHelpers.ts
/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * Developed by: Akhmad Arifin
 * LAYER: COMPATIBILITY LAYER (DEPRECATED - Use dataHelpers.ts or services/sync/firestoreHelpers.ts)
 */

export { 
  sanitizeForJSON, 
  sanitizeError, 
  generateManualId, 
  deepClean 
} from './dataHelpers';

// Note: getDocsSafe, getDocSafe, getDocsOptimized, etc. have been moved 
// to src/services/sync/firestoreHelpers.ts to comply with Rule #5.

