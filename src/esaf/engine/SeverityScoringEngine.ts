/**
 * @license
 * e-Mam System - ESAF Severity & Scoring Engine
 */

import type { ESAFEvidence, ViolationCount } from '../types';

export class SeverityScoringEngine {
  private static WEIGHTS: Record<string, number> = {
    CRITICAL: 10,
    ERROR: 5,
    WARNING: 2,
    INFO: 1,
  };

  public static calculateCounts(violations: ESAFEvidence[]): ViolationCount {
    const counts: ViolationCount = {
      INFO: 0,
      WARNING: 0,
      ERROR: 0,
      CRITICAL: 0,
    };

    for (const v of violations) {
      if (counts[v.severity] !== undefined) {
        counts[v.severity]++;
      }
    }

    return counts;
  }

  public static calculateScore(counts: ViolationCount): number {
    let penalty = 0;
    penalty += counts.CRITICAL * SeverityScoringEngine.WEIGHTS.CRITICAL;
    penalty += counts.ERROR * SeverityScoringEngine.WEIGHTS.ERROR;
    penalty += counts.WARNING * SeverityScoringEngine.WEIGHTS.WARNING;
    penalty += counts.INFO * SeverityScoringEngine.WEIGHTS.INFO;

    const score = 100 - penalty;
    return Math.max(0, Math.min(100, score));
  }

  public static isPassed(counts: ViolationCount): boolean {
    return counts.CRITICAL === 0 && counts.ERROR === 0;
  }
}
