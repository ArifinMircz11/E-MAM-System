/**
 * Canonical FK / relationship contract for e-MAM.
 *
 * The same relation is used for:
 * 1. local Dexie validation,
 * 2. Firestore document validation,
 * 3. sync payload normalization,
 * 4. reverse lookup / UI joins.
 *
 * Firestore is schemaless, therefore FK integrity is enforced at the
 * application boundary rather than by the database engine.
 */
import { entityRegistry } from './EntityRegistry';

export type RelationCardinality = 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';

export interface EntityRelation {
  name: string;
  from: { entity: string; field: string };
  to: { entity: string; field: string };
  cardinality: RelationCardinality;
  required?: boolean;
  inverseField?: string;
  onDelete?: 'restrict' | 'cascade' | 'set-null';
}

export const ENTITY_RELATIONS: readonly EntityRelation[] = [
  { name: 'student.tenant', from: { entity: 'student', field: 'tenantId' }, to: { entity: 'tenant', field: 'id' }, cardinality: 'many-to-one', required: true, onDelete: 'restrict' },
  { name: 'teacher.tenant', from: { entity: 'teacher', field: 'tenantId' }, to: { entity: 'tenant', field: 'id' }, cardinality: 'many-to-one', required: true, onDelete: 'restrict' },
  { name: 'class.tenant', from: { entity: 'class', field: 'tenantId' }, to: { entity: 'tenant', field: 'id' }, cardinality: 'many-to-one', required: true, onDelete: 'restrict' },
  { name: 'user.tenant', from: { entity: 'user', field: 'tenantId' }, to: { entity: 'tenant', field: 'id' }, cardinality: 'many-to-one', required: true, onDelete: 'restrict' },

  { name: 'student.class', from: { entity: 'student', field: 'classId' }, to: { entity: 'class', field: 'id' }, cardinality: 'many-to-one', inverseField: 'studentIds', onDelete: 'set-null' },
  { name: 'class.academicYear', from: { entity: 'class', field: 'academicYearId' }, to: { entity: 'academic_year', field: 'id' }, cardinality: 'many-to-one', required: true, inverseField: 'classIds', onDelete: 'restrict' },
  { name: 'class.homeroomTeacher', from: { entity: 'class', field: 'waliKelasId' }, to: { entity: 'teacher', field: 'idUnik' }, cardinality: 'many-to-one', inverseField: 'waliKelasClassIds', onDelete: 'set-null' },

  { name: 'attendance.student', from: { entity: 'attendance', field: 'studentsId' }, to: { entity: 'student', field: 'idUnik' }, cardinality: 'many-to-one', required: true, inverseField: 'attendanceIds', onDelete: 'restrict' },
  { name: 'attendance.class', from: { entity: 'attendance', field: 'classId' }, to: { entity: 'class', field: 'id' }, cardinality: 'many-to-one', inverseField: 'attendanceIds', onDelete: 'restrict' },
  { name: 'teacherAttendance.teacher', from: { entity: 'teacher_attendance', field: 'teachersId' }, to: { entity: 'teacher', field: 'idUnik' }, cardinality: 'many-to-one', required: true, inverseField: 'attendanceIds', onDelete: 'restrict' },

  { name: 'journal.teacher', from: { entity: 'journal', field: 'teacherId' }, to: { entity: 'teacher', field: 'idUnik' }, cardinality: 'many-to-one', required: true, inverseField: 'journalIds', onDelete: 'restrict' },
  { name: 'journal.class', from: { entity: 'journal', field: 'classId' }, to: { entity: 'class', field: 'id' }, cardinality: 'many-to-one', inverseField: 'journalIds', onDelete: 'restrict' },
  { name: 'journal.subject', from: { entity: 'journal', field: 'subjectId' }, to: { entity: 'subject', field: 'id' }, cardinality: 'many-to-one', inverseField: 'journalIds', onDelete: 'restrict' },

  { name: 'teacherAssignment.teacher', from: { entity: 'teacher_assignment', field: 'teacherId' }, to: { entity: 'teacher', field: 'idUnik' }, cardinality: 'many-to-one', required: true, inverseField: 'assignmentIds', onDelete: 'restrict' },
  { name: 'teacherAssignment.class', from: { entity: 'teacher_assignment', field: 'classId' }, to: { entity: 'class', field: 'id' }, cardinality: 'many-to-one', required: true, inverseField: 'assignmentIds', onDelete: 'restrict' },
  { name: 'teacherAssignment.subject', from: { entity: 'teacher_assignment', field: 'subjectId' }, to: { entity: 'subject', field: 'id' }, cardinality: 'many-to-one', required: true, inverseField: 'assignmentIds', onDelete: 'restrict' },
  { name: 'teacherAssignment.academicYear', from: { entity: 'teacher_assignment', field: 'academicYearId' }, to: { entity: 'academic_year', field: 'id' }, cardinality: 'many-to-one', required: true, onDelete: 'restrict' },
  { name: 'teacherAssignment.semester', from: { entity: 'teacher_assignment', field: 'semesterId' }, to: { entity: 'semester', field: 'id' }, cardinality: 'many-to-one', required: true, onDelete: 'restrict' },

  { name: 'schedule.class', from: { entity: 'schedule', field: 'classId' }, to: { entity: 'class', field: 'id' }, cardinality: 'many-to-one', required: true, inverseField: 'scheduleIds', onDelete: 'restrict' },
  { name: 'schedule.teacherAssignment', from: { entity: 'schedule', field: 'teacherAssignmentId' }, to: { entity: 'teacher_assignment', field: 'id' }, cardinality: 'many-to-one', required: true, inverseField: 'scheduleIds', onDelete: 'restrict' },
  { name: 'schedule.subject', from: { entity: 'schedule', field: 'subjectId' }, to: { entity: 'subject', field: 'id' }, cardinality: 'many-to-one', required: true, inverseField: 'scheduleIds', onDelete: 'restrict' },
  { name: 'schedule.day', from: { entity: 'schedule', field: 'dayId' }, to: { entity: 'day', field: 'id' }, cardinality: 'many-to-one', required: true, onDelete: 'restrict' },
  { name: 'schedule.academicYear', from: { entity: 'schedule', field: 'academicYearId' }, to: { entity: 'academic_year', field: 'id' }, cardinality: 'many-to-one', required: true, onDelete: 'restrict' },
  { name: 'timeSlot.academicYear', from: { entity: 'time_slot', field: 'academicYearId' }, to: { entity: 'academic_year', field: 'id' }, cardinality: 'many-to-one', required: true, onDelete: 'restrict' },
  { name: 'timeSlot.semester', from: { entity: 'time_slot', field: 'semesterId' }, to: { entity: 'semester', field: 'id' }, cardinality: 'many-to-one', onDelete: 'restrict' },
  { name: 'schedule.exception', from: { entity: 'schedule_exception', field: 'scheduleId' }, to: { entity: 'schedule', field: 'id' }, cardinality: 'many-to-one', inverseField: 'exceptionIds', onDelete: 'cascade' },

  { name: 'point.student', from: { entity: 'point', field: 'studentsId' }, to: { entity: 'student', field: 'idUnik' }, cardinality: 'many-to-one', required: true, inverseField: 'pointIds', onDelete: 'restrict' },
  { name: 'point.category', from: { entity: 'point', field: 'categoryId' }, to: { entity: 'point_category', field: 'id' }, cardinality: 'many-to-one', required: true, inverseField: 'pointIds', onDelete: 'restrict' },
  { name: 'pointSummary.student', from: { entity: 'student_point_summary', field: 'studentsId' }, to: { entity: 'student', field: 'idUnik' }, cardinality: 'one-to-one', required: true, inverseField: 'pointSummaryId', onDelete: 'cascade' },

  { name: 'letter.student', from: { entity: 'letter', field: 'studentsId' }, to: { entity: 'student', field: 'idUnik' }, cardinality: 'many-to-one', inverseField: 'letterIds', onDelete: 'restrict' },
  { name: 'letter.user', from: { entity: 'letter', field: 'userId' }, to: { entity: 'user', field: 'id' }, cardinality: 'many-to-one', inverseField: 'letterIds', onDelete: 'restrict' },
  { name: 'notification.user', from: { entity: 'notification', field: 'userId' }, to: { entity: 'user', field: 'id' }, cardinality: 'many-to-one', inverseField: 'notificationIds', onDelete: 'cascade' },

  { name: 'assignment.teacher', from: { entity: 'assignment', field: 'teacherId' }, to: { entity: 'teacher', field: 'idUnik' }, cardinality: 'many-to-one', required: true, inverseField: 'assignmentIds', onDelete: 'restrict' },
  { name: 'submission.assignment', from: { entity: 'submission', field: 'assignmentId' }, to: { entity: 'assignment', field: 'id' }, cardinality: 'many-to-one', required: true, inverseField: 'submissionIds', onDelete: 'cascade' },
  { name: 'submission.student', from: { entity: 'submission', field: 'studentId' }, to: { entity: 'student', field: 'idUnik' }, cardinality: 'many-to-one', required: true, inverseField: 'submissionIds', onDelete: 'restrict' },

  { name: 'message.conversation', from: { entity: 'message', field: 'chatId' }, to: { entity: 'chat', field: 'id' }, cardinality: 'many-to-one', required: true, inverseField: 'messageIds', onDelete: 'cascade' },
  { name: 'supportMessage.conversation', from: { entity: 'support_message', field: 'conversationId' }, to: { entity: 'support_conversation', field: 'id' }, cardinality: 'many-to-one', required: true, inverseField: 'messageIds', onDelete: 'cascade' },
  { name: 'supportConversation.user', from: { entity: 'support_conversation', field: 'userId' }, to: { entity: 'user', field: 'id' }, cardinality: 'many-to-one', required: true, inverseField: 'supportConversationIds', onDelete: 'cascade' },
  { name: 'supportTicket.user', from: { entity: 'support_ticket', field: 'userId' }, to: { entity: 'user', field: 'id' }, cardinality: 'many-to-one', required: true, inverseField: 'supportTicketIds', onDelete: 'cascade' },

  { name: 'faq.category', from: { entity: 'faq', field: 'categoryId' }, to: { entity: 'faq_category', field: 'id' }, cardinality: 'many-to-one', required: true, inverseField: 'faqIds', onDelete: 'restrict' },
  { name: 'faqFeedback.faq', from: { entity: 'faq_feedback', field: 'faqId' }, to: { entity: 'faq', field: 'id' }, cardinality: 'many-to-one', required: true, inverseField: 'feedbackIds', onDelete: 'cascade' },

  { name: 'semester.academicYear', from: { entity: 'semester', field: 'academicYearId' }, to: { entity: 'academic_year', field: 'id' }, cardinality: 'many-to-one', required: true, inverseField: 'semesterIds', onDelete: 'restrict' },
  { name: 'penilaian.student', from: { entity: 'penilaian', field: 'studentId' }, to: { entity: 'student', field: 'idUnik' }, cardinality: 'many-to-one', required: true, inverseField: 'gradeIds', onDelete: 'restrict' },
  { name: 'penilaian.subject', from: { entity: 'penilaian', field: 'subjectId' }, to: { entity: 'subject', field: 'id' }, cardinality: 'many-to-one', required: true, inverseField: 'gradeIds', onDelete: 'restrict' },
  { name: 'penilaian.semester', from: { entity: 'penilaian', field: 'semesterId' }, to: { entity: 'semester', field: 'id' }, cardinality: 'many-to-one', required: true, inverseField: 'gradeIds', onDelete: 'restrict' },
];

export function getEntityRelations(entity?: string): EntityRelation[] {
  return entity
    ? ENTITY_RELATIONS.filter((relation) => relation.from.entity === entity || relation.to.entity === entity)
    : [...ENTITY_RELATIONS];
}

/**
 * Validate an entity payload before local persistence/sync.
 * This validates FK shape and tenant invariants without performing cloud reads.
 * Referential existence is checked by the repository layer when strict validation is enabled.
 */
export function validateRelationShape(entityName: string, payload: Record<string, unknown>): string[] {
  const errors: string[] = [];
  for (const relation of ENTITY_RELATIONS.filter((item) => item.from.entity === entityName)) {
    const value = payload[relation.from.field];
    if (relation.required && (value === undefined || value === null || value === '')) {
      errors.push(`[${relation.name}] required FK '${relation.from.field}' is missing`);
    }
  }
  return errors;
}

/** Validate that every declared entity and FK target exists in EntityRegistry. */
export function validateRelationRegistry(): string[] {
  const errors: string[] = [];
  for (const relation of ENTITY_RELATIONS) {
    for (const entity of [relation.from.entity, relation.to.entity]) {
      try { entityRegistry.get(entity); } catch { errors.push(`[${relation.name}] unknown entity '${entity}'`); }
    }
  }
  return errors;
}
