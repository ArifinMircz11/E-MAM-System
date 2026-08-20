# IMAM System Architecture Contract (Baseline v1)

## 1. Tujuan Dokumen
Dokumen ini mengikat seluruh pengembang dan agen AI terkait batasan arsitektur (Architecture Guardrails) dalam e-MAM System.

Arsitektur ini didesain sebagai sistem yang:
- **Offline First**: Mampu diakses penuh walau tanpa internet.
- **Multi-Tenant**: Mendukung banyak instansi.
- **Sync-Driven**: Menggunakan Firestore sebagai *Source of Truth* dan sistem disinkronkan secara background.

## 2. Matriks Otorisasi Akses (Layer Contract)

Setiap layer memiliki tanggung jawab dan larangan akses spesifik.

| Layer       | Firestore | Dexie | Repository | Deskripsi Singkat |
| ----------- | --------- | ----- | ---------- | ----------------- |
| **UI**      | ❌ | ❌ | ❌ | Hanya mengatur tampilan dan event. Memanggil Hook/Service. |
| **Store**   | ❌ | ❌ | ❌ | Hanya mengelola state global. |
| **Service** | ❌ (Pengecualian spesifik) | ❌ | ✅ | Memuat *business rules*, RBAC, memanggil Repository, dan menambah antrean *Sync Queue*. |
| **Repository**| ❌ | ✅ | N/A | Menjalankan *CRUD* terhadap tabel Dexie lokal. Tidak boleh mengimpor UI/State. |
| **SyncEngine**| ✅ | ✅ | ✅ | **Satu-satunya** pintu komunikasi dengan Firestore (kecuali pengecualian di bawah). |

## 3. Pengecualian Akses Firestore yang Disetujui (Observasi)

Selama masa transisi (Baseline) dan operasional sistem *real-time*, terdapat pengecualian untuk file tertentu. Pengecualian ini didokumentasikan dan diizinkan secara eksplisit:

1. **Authentication**:
   - File seperti `AuthGateway.ts` dan `authService.ts` boleh mengakses Firebase Auth.
2. **Real-time Engine**:
   - `classChatService.ts`, `liveChatService.ts`, `attentionService.ts`, dll. yang membutuhkan data *real-time* dan bukan *master data*.
3. **Audit Log (Dalam Tinjauan)**:
   - `auditLogService.ts` dan `auditService.ts`. Saat ini masih disinkronkan ke Firestore, meskipun ke depannya sebaiknya melalui Dexie → SyncQueue.
4. **Dev / Test / Seeder Tools**:
   - `devConsoleActions.ts`, `devConsoleService.ts`, `testDataService.ts`, `seedService.ts`. Hanya digunakan dalam mode *development* atau penanganan khusus.
5. **Sync Service Khusus**:
   - `summaryFirestoreService.ts`, `pointSyncService.ts`, dsb., yang ditugaskan khusus untuk *delta sync* atau penyelarasan spesifik dari dan ke Firestore.
6. **Master Sync Services**:
   - `SyncEngine.ts`, `masterSyncService.ts`, `UserSyncService.ts`.

> **Aturan Umum**: Selain dari daftar di atas, *Service* baru **WAJIB** menggunakan Dexie melalui *Repository* dan mengirim *Sync Queue*. Master Data tidak boleh disentuh melalui panggilan Firebase langsung.

## 4. Guardrail dalam Mode Observasi

Selama **Sprint 1 (Student, Teacher, Class)**, guardrail *Dependency Cruiser* dan *ESLint* diaktifkan dalam **mode warning/report**. Jika melanggar, CI akan mencatat *warning* namun tidak memblokir rilis. 

Setelah validasi *Sprint 1* dan refaktor sistem inti selesai tanpa regresi, guardrail ini akan diubah menjadi **mode ERROR** (memblokir).

## 5. Rencana Migrasi (Refactor Sprint)

- **Tahap 0**: Architecture Freeze Baseline (kondisi saat ini dikunci dan inventarisasi selesai).
- **Tahap 1**: (Selesai dengan dokumen ini) Penetapan *Architecture Contract*.
- **Tahap 2**: Pengaktifan guardrail dalam mode observasi (ESLint warnings).
- **Tahap 3**: Mulai Sprint 1 Refactoring (`Student`, `Teacher`, `Class`).
- **Tahap 4**: Mulai Sprint 2 Refactoring (`Attendance`, `Point`, `Dashboard`).
- **Tahap 5**: Mulai Sprint 3 Refactoring (`Letters`, `Notification`, `News`).

Semua pengerjaan refactor mengikuti pendekatan **Satu Sprint Selesai -> Test -> Lulus -> Sprint Berikutnya**.
