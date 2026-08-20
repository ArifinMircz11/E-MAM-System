/**
 * @license
 * e-Mam System - Generic Collection Service
 * LAYER: SERVICE (Generic)
 */

import { CollectionRegistry } from '@/core/registry/CollectionRegistry';
import { userRepository } from '@/repositories/userRepository';
import { newsRepository } from '@/repositories/newsRepository';
// Import others as needed
import { getSecurityContext } from '@/core/security/contextHelper';
import { CacheService } from './CacheService';

export const GenericCollectionService = {
  async getData(collectionName: string, forceRefresh = false) {
    const metadata = CollectionRegistry.get(collectionName);
    if (!metadata) throw new Error(`Collection ${collectionName} not registered`);

    const context = getSecurityContext();

    // Special mapping for collections that have specific repository logic
    switch (collectionName) {
      case 'students':
        // Student service already uses repository + caching logic
        const studentModule: any = await import('./studentService');
        return await studentModule.getStudents('All', true, !forceRefresh);

      case 'teachers':
        const teacherModule: any = await import('./teacherService');
        return await teacherModule.getTeachers(forceRefresh);

      case 'users':
        return await userRepository.fetchByTenant(context.tenantId);

      case 'news':
        return await newsRepository.getNews(context.tenantId, false);

      default:
        // Fallback to standard CacheService for any other collection
        return await CacheService.getCollection(
          collectionName,
          null, // Let CacheService resolve the table
          metadata.primaryKey,
          { tenantId: context.tenantId, forceRefresh },
        );
    }
  },
};
