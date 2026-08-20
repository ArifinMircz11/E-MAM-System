/**
 * @license
 * e-Mam System - Student Points Service
 * LAYER: SERVICE (Architecture Compliant)
 */

import { TenantContext } from "@/core/context/TenantContext";
import { getSecurityContext } from "@/core/security/contextHelper";
import { SyncStatus } from "@/domain/entities/base";
import type { StudentPointSummary } from "@/domain/point/pointDomain";
import {
	SanctionLevel,
	calculateSanctionLevel,
} from "@/domain/point/pointDomain";
import { evaluatePointThresholds } from "@/domain/point/pointRuleEngine";
import { eventBus } from "@/events/eventBus";
import { pointCategoryRepository } from "@/repositories/PointCategoryRepository";
import { pointRepository } from "@/repositories/PointRepository";
import { pointSummaryRepository } from "@/repositories/PointSummaryRepository";
import { auditLog } from "@/services/auditLogService";
import { assertPermission } from "@/services/securityService";
import { type PointCategory, UserRole } from "@/types";
import { PERMISSIONS } from "@/types/permissions";
import { generateManualId } from "@/utils/firestoreHelpers";
import { getMakassarDateString } from "@/utils/timezone";
import { CacheService } from "./CacheService";

import type { PointTransaction } from "@/domain/entities/point";

import { useUserStore } from "@/stores/userStore";
const POINTS_COL = "points";
const SUMMARIES_COL = "student_point_summaries";
const CATEGORIES_COL = "point_categories";

/**
 * Get all point records for the current tenant.
 */
export const getPointRecords = async (
	forceRefresh = false,
): Promise<PointTransaction[]> => {
	try {
		assertPermission(PERMISSIONS.POINT_READ, "Read Point Records");
		const context = TenantContext.getContext();
		const data = await CacheService.getCollection<PointTransaction>(
			POINTS_COL,
			null,
			"id",
			{
				tenantId: context.tenantId,
				forceRefresh,
			},
		);
		return data || [];
	} catch (error) {
		console.error("[pointService] getPointRecords failed:", error);
		return [];
	}
};

/**
 * Add points to a student and update summary - OFFLINE FIRST
 */
export const addStudentPoint = async (
	data: Partial<PointTransaction> & {
		skor?: number;
		kategori?: string;
		keterangan?: string;
		class?: string;
	},
	customContext?: any,
) => {
	try {
		if (!customContext) {
			assertPermission(PERMISSIONS.POINT_WRITE, "Add Student Point");
		}
		const context = customContext || TenantContext.getContext();
		const studentId = data.studentsId || data.studentId || "";
		const finalClassId = data.classId || data.class || "unknown";

		const pointValue =
			typeof data.points === "number"
				? data.points
				: typeof data.skor === "number"
					? data.skor
					: Number.parseInt(String(data.points || data.skor || 0), 10);

		const finalId = generateManualId(
			`${context.tenantId}_POIN_${studentId}_${Date.now()}`,
		);

		const now = Date.now();
		const pointRecord: PointTransaction = {
			id: finalId,
			tenantId: context.tenantId,
			studentsId: studentId,
			studentName: data.studentName,
			className: data.className || data.class || "unknown",
			classId: finalClassId,
			points: pointValue,
			type:
				data.type === "Achievement" ||
				data.type === "Prestasi" ||
				data.type === "prestasi"
					? "prestasi"
					: "pelanggaran",
			category: data.category || data.kategori || "Points",
			categoryId: data.categoryId,
			description: data.description || data.keterangan || "",
			date: data.date || getMakassarDateString(),
			recordedBy: context.uid,
			idPetugas: context.uid,
			version: 1,
			createdAt: now,
			updatedAt: now,
			deleted: false,
			syncStatus: SyncStatus.PENDING,
		};

		// 1. Local Save (Repository handles sync queue)
		await pointRepository.create(pointRecord);

		// 2. Update Local Summary
		const existingSummary = await pointSummaryRepository.getByStudent(
			studentId,
			context.tenantId,
		);
		const previousTotal = existingSummary?.totalPoints || 0;
		const newTotal = previousTotal + pointValue;

		const summaryPayload: StudentPointSummary = {
			...(existingSummary || {
				studentsId: studentId,
				studentName: data.studentName || "Siswa",
				totalPoints: 0,
				sanctionLevel: SanctionLevel.AMAN,
				lastUpdate: new Date().toISOString(),
			}),
			id: studentId, // Summary ID is student ID
			studentsId: studentId,
			studentName: data.studentName || existingSummary?.studentName || "Siswa",
			tenantId: context.tenantId,
			totalPoints: newTotal,
			sanctionLevel: calculateSanctionLevel(newTotal),
			lastUpdate: new Date().toISOString(),
		};

		if (existingSummary) {
			await pointSummaryRepository.update(summaryPayload as any);
		} else {
			await pointSummaryRepository.create(summaryPayload as any);
		}

		// 3. Event Notification
		eventBus.publish("POINT_ADDED", {
			id: generateManualId("POINT_ADDED"),
			version: "1.0.0",
			timestamp: Date.now(),
			data: { pointRecord },
		});

		// 4. Rule Engine Evaluation for Threshold Events (SP-1, SP-2, SP-3)
		const thresholdEvents = evaluatePointThresholds({
			studentId,
			studentName: summaryPayload.studentName,
			className: pointRecord.className || "unknown",
			previousTotal,
			newTotal,
			tenantId: context.tenantId,
		});

		for (const evtData of thresholdEvents) {
			await eventBus.publish("POINT_THRESHOLD_EXCEEDED", {
				id: generateManualId("PTE"),
				version: "1.0.0",
				timestamp: Date.now(),
				data: evtData,
			});
		}

		// 5. Audit Log
		await auditLog({
			action: "POINT_CREATE",
			category: "POINTS",
			details: `Added ${pointValue} points to student ${studentId} (Offline Enqueued). PointId: ${finalId}`,
		});

		return { id: finalId, newTotalPoints: newTotal };
	} catch (error: any) {
		console.error("[pointService] addStudentPoint failed:", error);
		throw error;
	}
};

/**
 * Get points history for a specific student.
 */
export const getStudentPointsHistory = async (
	studentId: string,
	maxLogs = 50,
	forceRefresh = false,
) => {
	try {
		const secCtx = getSecurityContext(false);
		if (
			secCtx?.role === UserRole.SISWA ||
			secCtx?.role === UserRole.KETUA_KELAS
		) {
			if (secCtx.referenceId && secCtx.referenceId !== studentId) {
				console.error(
					`[Security] Access Denied: Student ${secCtx.referenceId} attempted to access points history of ${studentId}`,
				);
				return [];
			}
		}

		const context = TenantContext.getContext();
		const results = await pointRepository.getByStudent(studentId);

		return results
			.sort(
				(a, b) =>
					new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
			)
			.slice(0, maxLogs);
	} catch (error) {
		console.error("[pointService] getStudentPointsHistory failed:", error);
		return [];
	}
};

/**
 * Get student point summary.
 */
export const getStudentPointSummary = async (
	studentId: string,
	_forceRefresh = false,
): Promise<StudentPointSummary | null> => {
	try {
		const secCtx = getSecurityContext(false);
		if (
			secCtx?.role === UserRole.SISWA ||
			secCtx?.role === UserRole.KETUA_KELAS
		) {
			if (secCtx.referenceId && secCtx.referenceId !== studentId) {
				console.error(
					`[Security] Access Denied: Student ${secCtx.referenceId} attempted to access point summary of ${studentId}`,
				);
				return null;
			}
		}

		assertPermission(PERMISSIONS.POINT_READ, "Read Student Point Summary");

		// Use repository (it should handle offline-first and sync if needed)
		const summary = await pointSummaryRepository.getByStudent(studentId);

		if (summary) return summary as unknown as StudentPointSummary;

		return {
			studentsId: studentId,
			studentName: "Siswa",
			totalPoints: 0,
			sanctionLevel: SanctionLevel.AMAN,
			lastUpdate: null,
		} as unknown as StudentPointSummary;
	} catch (error) {
		return null;
	}
};

/**
 * Get point categories.
 */
export const getPointCategories = async (
	forceRefresh = false,
): Promise<PointCategory[]> => {
	try {
		const context = TenantContext.getContext();
		const data = await CacheService.getCollection<PointCategory>(
			CATEGORIES_COL,
			null,
			"id",
			{
				tenantId: context.tenantId,
				forceRefresh,
			},
		);
		return (data || []).sort((a, b) =>
			(a.name || "").localeCompare(b.name || ""),
		);
	} catch (error) {
		return [];
	}
};

/**
 * Add point category - OFFLINE FIRST
 */
export const addPointCategory = async (category: Partial<PointCategory>) => {
	assertPermission(PERMISSIONS.POINT_WRITE, "Add Point Category");
	const context = TenantContext.getContext();
	const id = generateManualId(`${context.tenantId}_PCAT_${Date.now()}`);
	const now = Date.now();
	const finalCategory: PointCategory = {
		name: "",
		points: 0,
		type: "Pelanggaran",
		description: "",
		isActive: true,
		...category,
		id,
		tenantId: context.tenantId,
		version: 1,
		createdAt: now,
		updatedAt: now,
		deleted: false,
		syncStatus: SyncStatus.PENDING,
	};
	await pointCategoryRepository.create(finalCategory);
	return finalCategory;
};

/**
 * Update point category - OFFLINE FIRST
 */
export const updatePointCategory = async (
	id: string,
	category: Partial<PointCategory>,
) => {
	assertPermission(PERMISSIONS.POINT_WRITE, "Update Point Category");
	const context = TenantContext.getContext();
	const existing = await pointCategoryRepository.findById(id, context.tenantId);
	if (!existing) throw new Error("Point Category not found");
	const updatedCategory: PointCategory = {
		...existing,
		...category,
		updatedAt: Date.now(),
	};
	await pointCategoryRepository.update(updatedCategory);
	return updatedCategory;
};

/**
 * Delete point category - OFFLINE FIRST
 */
export const deletePointCategory = async (id: string) => {
	assertPermission(PERMISSIONS.POINT_WRITE, "Delete Point Category");
	const context = TenantContext.getContext();
	await pointCategoryRepository.delete(id, context.tenantId);
	return { success: true };
};

/**
 * Seed default point categories - OFFLINE FIRST
 */
export const seedDefaultPointCategories = async () => {
	assertPermission(PERMISSIONS.POINT_WRITE, "Seed Default Point Categories");
	const context = TenantContext.getContext();
	const defaults: Partial<PointCategory>[] = [
		{
			name: "JUARA LOMBA",
			points: -10,
			type: "Prestasi",
			isActive: true,
			description: "Prestasi tingkat sekolah/luar sekolah",
		},
		{
			name: "TERLAMBAT",
			points: 5,
			type: "Pelanggaran",
			isActive: true,
			description: "Datang lebih dari jam 07:30",
			linkedToAttendance: true,
		},
	];
	for (const cat of defaults) {
		const id = generateManualId(
			`${context.tenantId}_PCAT_SEED_${cat.name?.replace(/\s+/g, "_")}`,
		);
		const now = Date.now();
		const finalCategory: PointCategory = {
			name: cat.name || "",
			points: cat.points || 0,
			type: (cat.type as any) || "Pelanggaran",
			description: cat.description || "",
			isActive: true,
			...cat,
			id,
			tenantId: context.tenantId,
			version: 1,
			createdAt: now,
			updatedAt: now,
			deleted: false,
			syncStatus: SyncStatus.PENDING,
		};
		await pointCategoryRepository.update(finalCategory);
	}
};

/**
 * Delete point record.
 */
export const deletePointRecord = async (pointId: string, studentId: string) => {
	try {
		assertPermission(PERMISSIONS.POINT_WRITE, "Delete Point Record");
		const context = TenantContext.getContext();

		// 1. Get current record
		const pointData = await pointRepository.findById(pointId, context.tenantId);
		const pointsToUndo = pointData?.points || 0;
		const studentIdOfPoint = pointData?.studentsId || studentId;

		// 2. Local Delete (triggers sync queue)
		await pointRepository.delete(pointId, context.tenantId);

		// 3. Update Summary
		const existingSummary =
			await pointSummaryRepository.getByStudent(studentIdOfPoint);
		if (existingSummary) {
			const newTotal = (existingSummary.totalPoints || 0) - pointsToUndo;
			await pointSummaryRepository.update({
				...existingSummary,
				totalPoints: newTotal,
				sanctionLevel: calculateSanctionLevel(newTotal),
				lastUpdate: new Date().toISOString(),
			} as any);
		}

		// Event Notification
		eventBus.publish("POINT_DELETED", {
			id: generateManualId("POINT_DELETED"),
			version: "1.0.0",
			timestamp: Date.now(),
			data: { pointId, studentId: studentIdOfPoint, pointsToUndo },
		});

		// 4. Audit Log
		await auditLog({
			action: "POINT_DELETE",
			category: "POINTS",
			details: `Deleted point record for student ${studentIdOfPoint} (Offline Enqueued). PointId: ${pointId}`,
		});

		return { success: true };
	} catch (error: any) {
		console.error("[pointService] deletePointRecord failed:", error);
		throw error;
	}
};

/**
 * Bulk delete points by attendance ID.
 */
export const deletePointRecordByAttendanceId = async (attendanceId: string) => {
	try {
		const tenantId = useUserStore.getState().tenantId || "global";
		const points = await pointRepository.findAll(tenantId);
		const linkedPoints = points.filter(
			(p) => (p as any).attendanceId === attendanceId,
		);

		for (const point of linkedPoints) {
			await deletePointRecord(point.id!, (point as any).studentsId);
		}
	} catch (error) {
		console.error(
			"[pointService] deletePointRecordByAttendanceId failed:",
			error,
		);
		throw error;
	}
};

// Aliases for compatibility
export const addPointRecord = addStudentPoint;
export const getAllPointRecords = getPointRecords;
export const clearAllPointsHistory = async () => {
	try {
		const tenantId = useUserStore.getState().tenantId || "global";
		const points = await pointRepository.findAll(tenantId);
		for (const p of points) {
			await pointRepository.delete(p.id!, tenantId);
		}
	} catch (error) {
		console.error("[pointService] clearAllPointsHistory error:", error);
	}
};
export const getPointStats = async (type?: string, className?: string) => {
	try {
		const summaries = await getAllPointSummaries(className);
		// If type is specified, we might need a different aggregation, but for now return total
		const total = summaries.reduce((acc, s) => acc + (s.totalPoints || 0), 0);
		return { totalPoints: total, studentCount: summaries.length };
	} catch (error) {
		console.error("[pointService] getPointStats error:", error);
		return { totalPoints: 0, studentCount: 0 };
	}
};
export const getAllPointSummaries = async (
	className?: string,
	max = 100,
	forceRefresh = false,
) => {
	try {
		assertPermission(PERMISSIONS.POINT_READ, "Read All Point Summaries");
		const context = TenantContext.getContext();
		const data = await CacheService.getCollection<any>(
			SUMMARIES_COL,
			null,
			"id",
			{
				tenantId: context.tenantId,
				forceRefresh,
			},
		);

		let filtered = data || [];
		if (className && className !== "Semua" && className !== "All") {
			filtered = filtered.filter(
				(s) =>
					(s as any).className === className || (s as any).class === className,
			);
		}

		return filtered.sort((a, b) => b.totalPoints - a.totalPoints).slice(0, max);
	} catch (error) {
		return [];
	}
};

export const pointService = {
	addStudentPoint,
	getPointRecords,
	getPointStats,
	getAllPointSummaries,
	deletePointRecord,
	deletePointRecordByAttendanceId,
	clearAllPointsHistory,
};
