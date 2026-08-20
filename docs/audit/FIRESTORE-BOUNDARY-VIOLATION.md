# Firestore Boundary Violation Audit Report
## PROJECT: e-MAM System Enterprise V7.8
### STATUS: AUDITED & VIOLATIONS IDENTIFIED

Sesuai dengan **AGENTS.md (Rule 5 - Firestore Access Lock)**, dilarang keras melakukan import dan kueri langsung SDK Firebase Firestore (`firebase/firestore` / `collection`, `getDocs`, `doc`, `setDoc`, `updateDoc`) dari dalam komponen UI, Hook, atau Repository non-SyncEngine. Seluruh akses ke data cloud wajib di-bypass melalui **Sync Engine** dan **Dexie Repository lokal**.

Laporan audit ini mencantumkan seluruh titik pelanggaran batas arsitektur (*boundary violations*) yang terdeteksi aktif pada kode presentasi UI saat ini.

---

## 1. RINGKASAN TEMUAN (AUDIT SUMMARY)

- **Total File UI Melanggar**: 10 File
- **Total Baris Pelanggaran**: 34 Titik Kueri Firestore Langsung
- **Tingkat Keparahan**: 🚨 KRITIS (Merusak prinsip Offline-First & Isolasi Multi-Tenant)

---

## 2. DAFTAR RINCI TITIK PELANGGARAN BOUNDARY (DETAILED FINDINGS)

Berikut adalah daftar lokasi baris kode dalam file komponen UI yang melakukan panggilan langsung ke Firestore:

### A. Modul Developer & Migrasi

#### 1. `src/components/DeveloperConsole/StudentApprovalModal.tsx`
* **Baris 45**: `getDocs(collection(db, 'classes')).then((snap) => {`
* **Masalah**: Mengambil data kelas madrasah langsung dari cloud, mem-bypass Dexie local repository.

#### 2. `src/components/SchemaMigrationSection.tsx`
File ini memiliki konsentrasi pelanggaran tertinggi (terhitung **18 pelanggaran**) karena bertindak sebagai konsol kontrol migrasi skema manual.
* **Baris 99**: `const snap = await getDocs(query(collection(db, collName), limit(1)));`
* **Baris 151**: `const snap = await getDocs(collection(db, 'migration_logs'));`
* **Baris 197**: `const studentsSnap = await getDocs(collection(db, 'students'));`
* **Baris 203**: `const teachersSnap = await getDocs(collection(db, 'teachers'));`
* **Baris 393**: `const q = query(collection(db, 'students'), limit(100));`
* **Baris 428**: `const snap = await getDocs(collection(db, 'users'));`
* **Baris 515**: `const snap = await getDocs(collection(db, 'teachers'));`
* **Baris 547**: `const snap = await getDocs(collection(db, 'tenants'));`
* **Baris 601**: `const backupRef = doc(collection(db, 'migration_backups'));`
* **Baris 638**: `const migrationLogRef = doc(collection(db, 'migration_logs'), migrationId);`
* **Baris 677**: `snap = await getDocs(collection(db, 'users'));`
* **Baris 999**: `const auditRef = doc(collection(db, 'audit_logs'));`
* **Baris 1038**: `const backupRef = doc(collection(db, 'migration_backups'));`
* **Baris 1112**: `query(collection(db, 'migration_backups'), where(...))`
* **Baris 1153**: `const rollbackLogRef = doc(collection(db, 'migration_logs'), ...)`

---

### B. Modul Keamanan & Akun

#### 3. `src/components/Login.tsx`
* **Baris 101**: `const q = query(collection(db, 'ticker'), orderBy('date', 'desc'));`
* **Masalah**: Melakukan kueri langsung terhadap koleksi pengumuman baris berjalan (`ticker`) di halaman login.

#### 4. `src/components/Onboarding/ReferenceIdForm.tsx`
* **Baris 98**: `const auditRef = doc(collection(db, 'audit_logs'));`
* **Masalah**: Menulis audit log langsung ke Firestore saat proses penyesuaian onboarding.

#### 5. `src/components/Profile.tsx`
* **Baris 284**: `collection(db!, 'profile_update_requests')`
* **Baris 296**: `collection(db!, 'profile_update_requests')`
* **Masalah**: Melakukan kueri mutasi profil langsung ke cloud tanpa mengantre lewat local Sync Queue.

---

### C. Modul Akademik & Presensi

#### 6. `src/components/Assignments.tsx`
* **Baris 147**: `getDocsOptimized<any>(collection(db, 'teachers'))`
* **Baris 148**: `getDocsOptimized<any>(collection(db, 'classes'))`
* **Masalah**: Mengunduh master data guru dan kelas langsung dari cloud saat memuat data penugasan.

#### 7. `src/components/DuplicateStudentsDashboard.tsx`
* **Baris 375**: `const q = query(collection(db!, 'students'), orderBy('namaLengkap'));`
* **Masalah**: Memindai seluruh koleksi siswa di Firestore untuk pendeteksian duplikasi.

#### 8. `src/components/PointCategorySettings.tsx`
* **Baris 63**: `const q = query(collection(db, 'point_categories'));`
* **Baris 128**: `const newRef = doc(collection(db!, 'point_categories'));`
* **Baris 166**: `const newRef = doc(collection(db!, 'point_categories'));`
* **Masalah**: Mengelola kategori pelanggaran poin kedisiplinan langsung ke cloud.

#### 9. `src/components/NotificationLogs.tsx`
* **Baris 56**: `collection(db, 'audit_notifications')`
* **Masalah**: Membaca data log notifikasi audit langsung dari cloud.

#### 10. `src/components/SystemDocumentation.tsx`
* **Baris 79**: `const q = query(collection(db!, 'documentation'), ...)`
* **Masalah**: Membaca dokumen panduan sistem langsung dari cloud.

---

## 3. DAMPAK TEKNIS & RESIKO TERHADAP SISTEM

1. **Kegagalan Fungsi Saat Offline (0% Offline Reliability)**:
   Komponen UI di atas akan mengalami *freeze* atau *crash* seketika jika dijalankan dalam kondisi koneksi internet terputus (offline), karena SDK Firestore mencoba melakukan jabat tangan jaringan.
2. **Pembengkakan Biaya Read/Write Firestore (Excessive Quota Cost)**:
   Setiap kali halaman bersangkutan dimuat oleh pengguna, sistem mengunduh ulang seluruh dokumen master. Hal ini melanggar **Rule 32 (Firestore Cost Policy)** untuk meminimalkan document read.
3. **Split-Brain & Race Conditions**:
   Pemberlakuan penulisan langsung ke cloud melompati antrean transaksi `sync_queue` lokal, mengakibatkan hilangnya urutan kronologis perubahan (*out-of-order execution*) saat sinkronisasi offline aktif.

---

## 4. TAHAP PERBAIKAN RE-ENGINEERING (TACTICAL REMEDIATION RUNBOOK)

Untuk menyelaraskan modul di atas dengan e-MAM V7.8, wajib dilaksanakan refactoring bertahap:

1. **Ganti Impor Firestore**:
   Hapus `import { collection, getDocs, ... } from 'firebase/firestore'` dari komponen UI.
2. **Delegasikan ke Service & Hook Layer**:
   Minta data melalui custom React Hook yang terhubung ke Service Layer (misal `useClassList()`, `useGTKList()`).
3. **Manfaatkan Pembacaan Dexie Lokal**:
   Ubah pemanggilan di Repository agar membaca data dari tabel lokal Dexie secara instan (0 ms latency).
4. **Gunakan Queue Terpadu Untuk Write**:
   Setiap aksi penulisan dari UI (seperti menambah kategori poin) wajib memanggil Service lokal yang melakukan `save` ke Repository Dexie, secara otomatis mendaftarkan penulisan tersebut ke `sync_queue` lokal untuk diproses oleh background Sync Engine secara teratur.
