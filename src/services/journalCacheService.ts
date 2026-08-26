import { JournalEntry } from '@/types';

export class JournalCacheService {
  private static cache: JournalEntry[] = [];

  static get(): JournalEntry[] {
    return this.cache;
  }

  static set(entries: JournalEntry[]): void {
    this.cache = entries;
  }

  static clear(): void {
    this.cache = [];
  }
}

export const journalCacheService = JournalCacheService;
