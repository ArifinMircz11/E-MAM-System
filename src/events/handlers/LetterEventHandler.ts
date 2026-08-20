/**
 * @license
 * e-Mam System - Letter Event Handler
 * LAYER: SERVICE / EVENT HANDLER
 * Decoupled subscriber for point threshold events to generate automated call letters
 */

import { eventBus } from '@/events/eventBus';
import { letterRepository } from '@/repositories/letterRepository';
import { SyncStatus } from '@/domain/entities/base';
import type { LetterRequest } from '@/types';

let isInitialized = false;

export function initializeLetterEventHandlers() {
  if (isInitialized) {
    return;
  }
  isInitialized = true;

  eventBus.subscribe('POINT_THRESHOLD_EXCEEDED', async (event) => {
    const data = event.data;
    const {
      studentId,
      studentName,
      className,
      newTotal,
      templateType,
      sanctionLabel,
      tenantId,
      idempotencyKey,
    } = data;

    try {
      // 1. Idempotency Check
      const existing = await letterRepository.findByIdempotencyKey(tenantId, idempotencyKey);
      if (existing) {
        console.log(`[LetterEventHandler] Letter already exists for idempotencyKey: ${idempotencyKey}, skipping.`);
        return;
      }

      // Also check if draft letter with same student and type exists
      const allTenantLetters = await letterRepository.findAll(tenantId);
      const duplicateDraft = allTenantLetters.find(
        l => (l as any).studentId === studentId && l.type === templateType && l.status === 'Pending'
      );
      if (duplicateDraft) {
        console.log(`[LetterEventHandler] Draft letter already pending for student ${studentId} and type ${templateType}, skipping.`);
        return;
      }

      // 2. Build Draft Call Letter Document
      const letterId = `LTR_AUTO_${tenantId}_${studentId}_${Date.now()}`;
      const autoLetter: LetterRequest = {
        id: letterId,
        tenantId,
        userId: studentId,
        userName: studentName,
        className: className || 'Unknown',
        classId: className || 'unknown',
        type: templateType,
        purpose: `Surat Otomatis: Akumulasi Poin Pelanggaran Mencapai ${newTotal} (${sanctionLabel})`,
        status: 'Pending',
        syncStatus: SyncStatus.PENDING,
        version: 1,
        schemaVersion: 1,
        deleted: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...( { idempotencyKey, studentId, isAutomated: true } as any ),
      };

      // 3. Save to Local Operational Database (Dexie)
      await letterRepository.create(autoLetter);
      console.log(`[LetterEventHandler] Draft call letter created successfully: ${letterId}`);
    } catch (error) {
      console.error('[LetterEventHandler] Failed to create automated call letter:', error);
    }
  });
}
