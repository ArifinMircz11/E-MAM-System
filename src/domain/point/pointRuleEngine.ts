/**
 * @license
 * e-Mam System - Point Rule Engine
 * LAYER: DOMAIN (Point Rules & Threshold Evaluator)
 *
 * This module evaluates threshold-crossing events only. It does not write
 * points, summaries, sanctions, or letters. Persistence belongs to the
 * repository/sync pipeline.
 */

export interface PointRule {
  idUnik: string;
  tenantId: string;
  name: string;
  thresholdValue: number;
  templateType: string;
  sanctionLabel: string;
  status: 'active' | 'inactive';
}

export const DEFAULT_POINT_RULES: Omit<PointRule, 'tenantId'>[] = [
  {
    idUnik: 'RULE_SP1',
    name: 'Surat Panggilan Orang Tua I',
    thresholdValue: 25,
    templateType: 'Surat Panggilan Orang Tua I (SP-1)',
    sanctionLabel: 'Peringatan I / Panggilan I',
    status: 'active',
  },
  {
    idUnik: 'RULE_SP2',
    name: 'Surat Panggilan Orang Tua II',
    thresholdValue: 50,
    templateType: 'Surat Panggilan Orang Tua II (SP-2)',
    sanctionLabel: 'Peringatan II / Panggilan II',
    status: 'active',
  },
  {
    idUnik: 'RULE_SP3',
    name: 'Surat Panggilan Orang Tua III',
    thresholdValue: 75,
    templateType: 'Surat Panggilan Orang Tua III (SP-3)',
    sanctionLabel: 'Peringatan III / Panggilan III / Skorsing',
    status: 'active',
  },
];

export interface ThresholdExceededEvent {
  studentId: string;
  studentName: string;
  className?: string;
  previousTotal: number;
  newTotal: number;
  thresholdValue: number;
  ruleId: string;
  templateType: string;
  sanctionLabel: string;
  tenantId: string;
  idempotencyKey: string;
}

/**
 * Evaluate if a point transaction crosses one or more point rule thresholds.
 *
 * `customRules` is intentionally tri-state:
 *   undefined -> use canonical defaults
 *   []        -> use no rules (explicit configuration)
 *   non-empty -> use supplied active rules
 */
export function evaluatePointThresholds(params: {
  studentId: string;
  studentName: string;
  className?: string;
  previousTotal: number;
  newTotal: number;
  tenantId: string;
  customRules?: PointRule[];
  evaluationVersion?: number | string;
}): ThresholdExceededEvent[] {
  const {
    studentId,
    studentName,
    className,
    previousTotal,
    newTotal,
    tenantId,
    customRules,
    evaluationVersion = 1,
  } = params;

  if (!studentId || !tenantId) {
    throw new Error('POINT_THRESHOLD_CONTEXT_INVALID');
  }
  if (!Number.isFinite(previousTotal) || !Number.isFinite(newTotal)) {
    throw new Error('POINT_THRESHOLD_TOTAL_INVALID');
  }

  const activeRules = (customRules === undefined
    ? DEFAULT_POINT_RULES.map((rule) => ({ ...rule, tenantId }))
    : customRules
  )
    .filter((rule) => rule.status === 'active')
    .filter((rule) => rule.tenantId === tenantId)
    .filter((rule) => Number.isFinite(rule.thresholdValue) && rule.thresholdValue >= 0)
    .sort((a, b) => a.thresholdValue - b.thresholdValue || a.idUnik.localeCompare(b.idUnik));

  const triggeredEvents: ThresholdExceededEvent[] = [];

  for (const rule of activeRules) {
    if (previousTotal < rule.thresholdValue && newTotal >= rule.thresholdValue) {
      triggeredEvents.push({
        studentId,
        studentName,
        className,
        previousTotal,
        newTotal,
        thresholdValue: rule.thresholdValue,
        ruleId: rule.idUnik,
        templateType: rule.templateType,
        sanctionLabel: rule.sanctionLabel,
        tenantId,
        idempotencyKey: `${tenantId}|${studentId}|${rule.idUnik}|v${evaluationVersion}`,
      });
    }
  }

  return triggeredEvents;
}
