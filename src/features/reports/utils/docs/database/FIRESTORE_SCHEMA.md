# 🔥 FIRESTORE_SCHEMA.md (KERNEL v7.7 STABLE)

## 1. ANALISIS ARSITEKTUR & DESAIN STRUKTUR DATA
e-Mam System mengadopsi pola **Root-Level Multi-Tenant Isolation with Flat Partitioning**. Seluruh data transaksional diisolasi di bawah satu *kunci tenant* utama, dan sub-kondisi dipecah menggunakan **ID Dokumen Deterministik Komposit** untuk efisiensi kuota ekstrem dan pencegahan *Data Drift*.

```
[Firestore Root]
       │
       ├── /tenants/{tenantId}/
       │         │
       │         ├── summaries/dashboard_summary (Dokumen Tunggal Agregat)
       │         │
       │         ├── classes/{classId} (ID: CLS_${tenantId}_${NamaKelas})
       │         │
       │         └── attendance_records/{attendanceId} (ID: ${studentId}_${date})
```

## 2. SPESIFIKASI SKEMA KOLEKSI & ATURAN ID DETERMINISTIK
Setiap dokumen wajib memuat properti `tenantId`, `createdAt`, dan `updatedAt` (ISO Timestamp).

### A. Koleksi: classes
* **Path:** `/tenants/{tenantId}/classes/{classId}`
* **Aturan ID Generator (`classId`):** `CLS_${tenantId}_${namaKelas.toUpperCase().replace(/\s+/g, '_')}`
* **Skema Dokumen:**
```json
{
  "id": "String (Match dengan classId)",
  "tenantId": "String (Isolasi Tenant)",
  "namaKelas": "String",
  "waliKelasId": "String",
  "kapasitas": "Number",
  "totalSiswa": "Number",
  "updatedAt": "String (ISO Timestamp)"
}
```

### B. Koleksi: attendance_records
* **Path:** `/tenants/{tenantId}/attendance_records/{attendanceId}`
* **Aturan ID Generator (`attendanceId`):** `${studentId}_${date}` (YYYY-MM-DD)
* **Skema Dokumen:**
```json
{
  "id": "String",
  "tenantId": "String",
  "studentId": "String",
  "classId": "String",
  "date": "String (YYYY-MM-DD)",
  "status": "String (Hadir | Sakit | Izin | Alfa)",
  "checkInTime": "String | null",
  "scannedBy": "String",
  "eventId": "String"
}
```

### C. Koleksi: summaries (Pilar Hemat Kuota)
* **Path:** `/tenants/{tenantId}/summaries/{summaryType}`
* **Jenis Summary:** `dashboard_summary`, `attendance_summary`, `student_summary`.
* **Skema Dokumen (attendance_summary):**
```json
{
  "id": "attendance_summary",
  "tenantId": "String",
  "totals": { "Hadir": "Number", "Sakit": "Number", "Izin": "Number", "Alfa": "Number" },
  "daily": { 
      "YYYY-MM-DD": { "Hadir": "Number", "Sakit": "Number", "Izin": "Number", "Alfa": "Number" } 
  },
  "lastUpdated": "String"
}
```

## 3. IMPLEMENASI KODE DRIVER (REPOSITORY PATTERN)
```typescript
import { db } from '../lib/firebase';
import { doc, writeBatch, increment } from 'firebase/firestore';

export class AttendanceRepository {
  public static async commitAttendanceTransaction(
    payload: AttendanceDataPayload, 
    oldStatus: string | null = null
  ): Promise<void> {
    const batch = writeBatch(db);
    const deterministicId = `${payload.studentId}_${payload.date}`;
    const recordRef = doc(db, `tenants/${payload.tenantId}/attendance_records`, deterministicId);

    // Batch set logic + Aggregation logic...
    await batch.commit();
  }
}
```
