/**
 * @license
 * e-Mam System - Migration Registry
 */

import type { MigrationRule } from '../types';

export class MigrationRegistry {
  private static rules: Map<string, MigrationRule[]> = new Map();

  static register(rule: MigrationRule) {
    const list = this.rules.get(rule.collection) || [];
    list.push(rule);
    list.sort((a, b) => a.version - b.version);
    this.rules.set(rule.collection, list);
  }

  static getRulesForCollection(collection: string): MigrationRule[] {
    return this.rules.get(collection) || [];
  }

  static getAllCollections(): string[] {
    return Array.from(this.rules.keys());
  }
}
