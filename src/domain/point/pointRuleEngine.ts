/**
 * @license
 * e-Mam System - Point Rule Engine
 * LAYER: DOMAIN (Point Rules & Threshold Evaluator)
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
 * Evaluate if a point transaction crosses one or more point rule thresholds
 */
export function evaluatePointThresholds(params: {
  studentId: string;
  studentName: string;
  className?: string;
  previousTotal: number;
  newTotal: number;
  tenantId: string;
  customRules?: PointRule[];
}): ThresholdExceededEvent[] {
  const { studentId, studentName, className, previousTotal, newTotal, tenantId, customRules } = params;

  const activeRules = customRules && customRules.length > 0
    ? customRules.filter(r => r.status === 'active')
    : DEFAULT_POINT_RULES.map(r => ({ ...r, tenantId }));

  const triggeredEvents: ThresholdExceededEvent[] = [];

  for (const rule of activeRules) {
    // Check if new total meets or exceeds threshold while previous total was below it
    if (previousTotal < rule.thresholdValue && newTotal >= rule.thresholdValue) {
      const idempotencyKey = `${tenantId}|${studentId}|${rule.idUnik}|v1`;
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
        idempotencyKey,
      });
    }
  }

  return triggeredEvents;
}
