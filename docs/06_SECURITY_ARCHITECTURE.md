# 06. SECURITY ARCHITECTURE

## e-MAM System Enterprise

**Version:** 1.1.1  
**Status:** APPROVED — EAOM COMPLIANT  
**Document Type:** Enterprise Security Architecture Blueprint  
**Single Source of Truth (SSOT) Reference:** `docs/06_SECURITY_ARCHITECTURE.md`

---

# 6.0 Security Architecture Overview

Security Architecture e-MAM System mendefinisikan mekanisme perlindungan menyeluruh terhadap identitas pengguna, hak akses data akademik, isolasi multi-tenant, transaksi offline, sinkronisasi cloud, serta integritas audit trail aktivitas pengguna.

Sistem keamanan ini bertindak sebagai lapisan pengendali (Security Boundary) yang mengawal seluruh data flow aplikasi secara ketat di setiap layer penyimpanan dan pemrosesan data.

```text
                 Firebase Auth
                       │
                       ▼
               Custom Claims Token
                       │
                       ▼
               Security Context (Implicit Resolver)
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
   RBAC Engine                   ABAC Engine
 (What Actions?)               (Which Records?)
        │                             │
        └──────────────┬──────────────┘
                       ▼
               Permission Engine
                       │
                       ▼
             Authorization Decision (Central Guard)
                       │
                       ▼
               Service Layer
                       │
                       ▼
            Repository Security Context
                       │
                       ▼
              Dexie Local DB Cache
                       │
                       ▼
               Sync Security Gate
                       │
                       ▼
               Firestore Rules (Boundary Security)
                       │
                       ▼
              Immutable Audit Chain (Log Hash)
```

---

# 6.1 Security Principles

e-MAM System mengimplementasikan 5 prinsip keamanan mutlak:

1. **Least Privilege (Prinsip Hak Akses Terkecil):** Setiap pengguna hanya diberikan hak akses (Role, Permission, Scope) paling minimal yang dibutuhkan untuk menyelesaikan tanggung jawab institusionalnya.
2. **Zero Trust (Tanpa Rasa Percaya Default):** Semua request—baik lokal offline maupun sinkronisasi cloud—wajib divalidasi dan diotorisasi. Tidak ada basis kepercayaan berdasarkan lokasi perangkat, jenis koneksi jaringan, atau cache offline.
3. **Defense in Depth (Pertahanan Berlapis):** Lapisan pengamanan diterapkan secara berurutan mulai dari UI View Guard, Service Validation, Repository Query Builder, Sync Engine Pipeline, hingga Firestore Security Rules. Kegagalan di satu pintu pertahanan tidak akan mengorbankan keamanan seluruh sistem.
4. **Multi-Tenant Logical Isolation:** Pembatasan logis antar madrasah dikunci secara mutlak di semua tingkat query dan transaksi untuk mencegah terjadinya kebocoran data (*data leakage*).
5. **Offline First Security:** Dikarenakan e-MAM beroperasi secara Offline-First, seluruh mesin otorisasi (Security Context, Permission Engine, Scope Engine) wajib beroperasi secara penuh di sisi client menggunakan data cache keamanan lokal tanpa ketergantungan pada jaringan internet.

---

# 6.2 Identity Kernel

Identity Kernel mengelola siklus otentikasi pengguna secara aman, memisahkan data akses pengenal (*Credentials*) dari data profil bisnis fungsional (*Domain Profile*).

```text
User Credentials (Login)
          │
          ▼
   Firebase Auth API
          │
          ▼
Identity Registry Service ────► (Resolves uid ──► referenceId mapping)
          │
          ▼
   Claims Generator
          │
          ▼
   JWT Custom Claims Token
          │
          ▼
   Security Context (Runtime Runtime)
```

### 6.2.1 Identity Registry Layer
- **Decoupled Resolution:** Akun login Firebase Auth (`uid`) tidak menyimpan data profil guru, staf, atau siswa. Identitas disatukan menggunakan jembatan data `referenceId`.
- **Identity Registry Service:** Bertindak sebagai resolver independen yang memetakan `uid` pengguna ke ID profil internal (`teacherId` atau `studentId`) dan merakit token klaim keamanan (*Custom Claims*). Registry ini bukan database authority fungsional, melainkan murni gerbang penentu hak akses.

### 6.2.2 Claims Generator & Custom Claims SSOT
- **Token as Source of Truth:** `AuthorizationEngine` wajib mengevaluasi keputusan keamanan hanya berdasarkan isi token JWT Custom Claims yang sah secara kriptografis.
- **Projection-Only Firestore User Profiles:** Dokumen pada koleksi `/users/{userId}` di Firestore murni bertindak sebagai metadata proyeksi datar untuk visualisasi (seperti nama tampilan, foto profil, status login). **DILARANG KERAS** membaca atribut `role` atau `scope` dari koleksi Firestore `users` untuk membuat keputusan izin akses sistem, karena koleksi Firestore rentan terhadap manipulasi sync queue lokal.

---

# 6.3 Security Context & JWT Claims Standard

Klaim keamanan disematkan secara asimetris ke dalam Token JWT oleh server-side Cloud Functions setelah divalidasi oleh Identity Registry.

### 6.3.1 Canonical Custom Claims Schema
Klaim JWT yang diterbitkan wajib mematuhi standar skema terstruktur berikut, menggunakan enum canonical bahasa Inggris:

```json
{
  "iss": "https://securetoken.google.com/e-mam-system",
  "aud": "e-mam-system",
  "sub": "auth-uid-xyz123",
  "name": "Ahmad Fikri",
  "email": "ahmad.fikri@madrasah.sch.id",
  "tenantId": "madrasah-nst-001",
  "accountType": "madrasah",
  "role": "teacher",
  "roles": ["wali_kelas"],
  "referenceId": "T001",
  "schemaVersion": 1,
  "scope": {
    "tenantId": "madrasah-nst-001",
    "classIds": ["class-7a", "class-7b"],
    "subjectIds": ["math-7", "science-7"]
  }
}
```

- **Canonical Roles Enum:** Sistem hanya mengenal peran baku: `'developer' | 'admin' | 'kamad' | 'keptu' | 'teacher' | 'guru_bk' | 'staff' | 'student' | 'parent'`. Label bahasa Indonesia seperti 'guru' atau 'staf' murni digunakan untuk presentasi di UI.

### 6.3.2 Security Kernel Directory
Seluruh komponen kode keamanan harus dilokalisasi secara modular dalam direktori kernel keamanan berikut:
```text
/src/core/security/
├── SecurityContext.ts            // Menyimpan active runtime user context
├── SessionManager.ts             // Mengelola login state, claims refresh, & token cache
├── AuthorizationService.ts       // Decision maker utama untuk query izin
├── PermissionEngine.ts           // Mengevaluasi hak akses RBAC berdasarkan Policy
├── ScopeEngine.ts                // Mengevaluasi batasan ABAC (Class, Subject, Personal)
├── PolicyRegistry.ts             // Registri statis pemetaan permission-role
├── AuditSecurityService.ts       // Menangani append-only local audit log & hash chain
└── SecurityErrors.ts             // Standardisasi exception & desensitisasi log
```

---

# 6.4 RBAC Architecture (Role-Based Access Control)

RBAC menentukan **tindakan bisnis (actions)** apa saja yang boleh dijalankan oleh suatu peran (*What actions can be performed*). e-MAM menerapkan pemisahan antara Primary Role dan Functional Role.

### 6.4.1 Primary Role Hierarchy (`role`)
Kategori peran dasar yang bersifat eksklusif (satu pengguna hanya memiliki satu Primary Role):
1. **`developer`:** Akses root global mutlak untuk pemeliharaan sistem. Melompati batasan tenant hanya dengan audit override khusus.
2. **`admin`:** Pengelola konfigurasi tingkat tenant, alokasi role lokal, dan inisialisasi master data madrasah.
3. **`kamad` (Kepala Madrasah):** Hak baca penuh atas seluruh laporan performa madrasah serta otorisasi persetujuan surat keluar.
4. **`keptu` (Kepala Tata Usaha):** Penanggung jawab utama pengelolaan master data kependidikan, direktori staf, dan registrasi siswa.
5. **`teacher` (Guru):** Tenaga pendidik yang berhak melakukan presensi harian siswa, pengisian nilai, dan bimbingan kelas.
6. **`guru_bk` (Konselor):** Tenaga bimbingan konseling yang berhak mengelola skor poin pelanggaran perilaku siswa.
7. **`staff` (Staf):** Pelaksana teknis operasional administrasi sekolah.
8. **`student` (Siswa):** Akses terbatas untuk melihat jadwal, kehadiran pribadi, nilai, dan pengajuan surat izin.
9. **`parent` (Orang Tua):** Akses pantauan terbatas khusus untuk perkembangan akademik anak kandung terdaftar.

### 6.4.2 Functional / Secondary Roles (`roles[]`)
Peran fungsional tambahan untuk memperluas kewenangan Primary Role secara dinamis tanpa merusak hierarki utama:
- **`wali_kelas`:** Memberikan otorisasi persetujuan absensi kelas bimbingan dan pelaporan rapor semester kelas tersebut.
- **`operator`:** Memberikan hak tulis pada pengelolaan infrastruktur data jadwal sekolah.
- **`bendahara`:** Memberikan otorisasi modul keuangan (Iuran/SPP).

---

# 6.5 Permission Engine (Policy-Driven Authorization)

e-MAM melarang keras pemeriksaan peran secara hardcoded (seperti `if (user.role === 'admin')`) tersebar di komponen visual UI atau modul service. Semua evaluasi izin wajib dialihkan secara terpusat dan berlandaskan aturan kebijakan (*Policy-Driven*).

### 6.5.1 Policy Registry Schema
Setiap izin diikat secara granular menggunakan metadata lengkap yang memuat kebutuhan peran, batas cakupan, klasifikasi modul, dan jenis aksi:

```typescript
export interface PermissionPolicy {
  permission: string;          // e.g., 'attendance.approve'
  roles: string[];             // Primary roles yang diizinkan (e.g., ['admin', 'teacher'])
  secondaryRoles?: string[];   // Functional roles yang memperluas izin (e.g., ['wali_kelas'])
  scopeRequired: 'tenant' | 'class' | 'subject' | 'personal';
  resource: string;            // Nama entitas target (e.g., 'attendance')
  actions: ('create' | 'read' | 'update' | 'delete' | 'approve')[];
}
```

### 6.5.2 Authorization Decision Object
Evaluasi hak akses tidak lagi sekadar mengembalikan nilai boolean sederhana `true` atau `false`, melainkan wajib merakit obyek keputusan lengkap (*Authorization Decision*) untuk kemudahan audit kepatuhan (*security audit*):

```typescript
export interface AuthorizationDecision {
  allowed: boolean;            // Hasil evaluasi (Granted / Denied)
  reason: string;              // Penjelasan detail kegagalan atau keberhasilan
  permission: string;          // Nama izin yang diperiksa
  evaluatedBy: 'PermissionEngine' | 'ScopeEngine' | 'TenantValidator';
  timestamp: number;           // Epoch MS UTC waktu pemeriksaan
}
```

---

# 6.6 ABAC Architecture & Scope Control

Jika RBAC menjawab *"Tindakan apa yang boleh dilakukan?"*, maka ABAC (Attribute-Based Access Control) menjawab *"Record data yang mana yang boleh dimutasi?"* berdasarkan kesesuaian atribut pengguna (*Subject*) dan atribut data (*Resource*).

```text
Subject (Security Context)                     Resource (Dexie Student Record)
  ├── role: "teacher"                           ├── tenantId: "madrasah-001"
  ├── tenantId: "madrasah-001"                  └── classId: "class-7a"
  └── classIds: ["class-7a"]
                 │                                     │
                 └──────────────┬──────────────────────┘
                                ▼ Evaluasi Atribut
                     1. tenantId MATCH (madrasah-001)
                     2. classId IN Scope (class-7a)
                                │
                                ▼
                        [ ACCESS GRANTED ]
```

### 6.6.1 Batas Cakupan (Scope Evaluation)
Evaluasi cakupan diatur secara bertingkat:
1. **Global Scope:** Diperuntukkan bagi developer. Membuka seluruh batasan isolasi data untuk keperluan debugging darurat, namun wajib merekam log audit override.
2. **Tenant Scope:** Memastikan seluruh data yang dibaca atau ditulis cocok dengan madrasah asal user: `resource.tenantId === context.tenantId`.
3. **Class Scope:** Guru atau Wali Kelas hanya dapat memproses data siswa, jurnal kelas, dan absensi pada kelas-kelas yang terdaftar dalam scope-nya: `resource.classId` berada dalam `context.scope.classIds`.
4. **Subject Scope:** Membatasi guru dalam pengisian nilai ujian hanya pada mata pelajaran yang diampunya: `resource.subjectId` berada dalam `context.scope.subjectIds`.
5. **Personal Scope:** Membatasi akses siswa murni untuk melihat dirinya sendiri (`context.referenceId === student.id`) dan orang tua murni untuk melihat data anak yang memiliki relasi resmi (`student.parentIds` mengandung `context.uid`).

### 6.6.2 Constrained Query Builder Pattern (Anti-Client Filtering)
e-MAM melarang keras pengambilan data massal ke memori lokal untuk kemudian disaring menggunakan filter JavaScript (misalnya membaca seluruh tabel siswa lalu menyaring kelas di client). Repository wajib menyusun query berindeks komposit berdasarkan evaluasi scope:

```typescript
// SANGAT BAIK: Query dirakit secara teroptimasi menggunakan komposit indeks Dexie
export class StudentRepository {
  private db: Dexie;

  constructor(dexieInstance: Dexie) {
    this.db = dexieInstance;
  }

  public async getStudentsByScope(): Promise<CanonicalStudent[]> {
    const user = SecurityContext.currentUser();
    const tenantId = SecurityContext.currentTenantId();

    // 1. Jika admin/keptu, ambil semua siswa dalam tenant secara langsung
    if (user.role === 'admin' || user.role === 'keptu' || user.role === 'kamad') {
      return await this.db.table('students')
        .where('[tenantId+status]')
        .between([tenantId, 'active'], [tenantId, 'inactive'], true, true)
        .filter(s => !s.deleted)
        .toArray();
    }

    // 2. Jika guru, jalankan query multi-key anyOf berdasarkan cakupan kelas (O(log N))
    const assignedClasses = user.scope.classIds || [];
    if (assignedClasses.length === 0) return [];

    // Merakit compound keys: [tenantId, classId]
    const queryKeys = assignedClasses.map(classId => [tenantId, classId]);

    return await this.db.table('students')
      .where('[tenantId+classId]')
      .anyOf(queryKeys)
      .filter(s => !s.deleted)
      .toArray();
  }
}
```

---

# 6.7 Local Security Cache (Offline Auth)

Untuk mendukung operasional penuh saat perangkat tidak terhubung ke internet (*Offline-First*), e-MAM mengunci seluruh otorisasi di database lokal Dexie menggunakan tabel-tabel khusus keamanan:

```typescript
// Skema Dexie dideklarasikan secara tertutup untuk sistem keamanan:
const securitySchema = {
  securityContext: 'id, tenantId, uid',
  permissionCache: 'id, permission, version',
  policyCache: 'id, policy, version'
};
```

- **Runtime Context Restoring:** Saat aplikasi dimulai kembali tanpa jaringan internet, `SessionManager` memulihkan context keamanan terakhir dari tabel `securityContext` lokal secara instan, mengizinkan user melanjutkan pekerjaan mencatat absensi atau pengisian nilai di bawah koridor keamanan yang sah secara offline.

---

# 6.8 Tenant Isolation Architecture

Multi-tenant isolation diimplementasikan secara komprehensif dari client hingga server, memisahkan data ribuan madrasah dengan aman.

```text
[ React UI ] ──► (Tidak menerima tenantId dari handler parameter)
       │
       ▼ (Mengambil tenantId secara rahasia dari SecurityContext)
[ Repository Query Builder ] ──► Enforces: WHERE tenantId = SecurityContext.tenantId
       │
       ▼
[ Dexie Local DB ] ──► (Indeks komposit [tenantId+classId] memisahkan record lokal)
       │
       ▼
[ Sync Security Gate ] ──► Enforces: outbox.tenantId === SecurityContext.tenantId
       │
       ▼
[ Firestore Rules Boundary ] ──► Enforces: auth.token.tenantId == path.tenantId
```

- **Implicit Context Rule:** Repositori dilarang keras menerima parameter `tenantId` bebas dari modul UI. `tenantId` wajib diinjeksikan secara implisit oleh repositori menggunakan pemanggilan metode `SecurityContext.currentTenantId()`, mengeliminasi celah eksploitasi manipulasi parameter (*Insecure Direct Object Reference*).

---

# 6.9 Firestore Boundary Security Rules

Firestore bertindak murni sebagai sinkronisasi delta dan cadangan awan, bukan database transaksional harian UI. Keamanan di cloud dikawal ketat lewat Firestore Security Rules terintegrasi:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Fungsi utilitas verifikasi otentikasi & token klaim
    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserData() {
      return request.auth.token;
    }

    function isTenantOwner(tenantId) {
      return isAuthenticated() && getUserData().tenantId == tenantId;
    }

    function hasRole(role) {
      return getUserData().role == role || role in getUserData().roles;
    }

    // Boundary Isolasi Tenant di Level Root Subcollection
    match /tenants/{tenantId} {
      allow read: if isTenantOwner(tenantId);
      allow write: if isTenantOwner(tenantId) && hasRole('admin');

      // Users Subcollection (Proyeksi Metadata Profil)
      match /users/{userId} {
        allow read: if isTenantOwner(tenantId) && (request.auth.uid == userId || hasRole('admin') || hasRole('keptu'));
        allow write: if isTenantOwner(tenantId) && hasRole('admin');
      }

      // Students Subcollection (RBAC + ABAC Validation)
      match /students/{studentId} {
        allow read: if isTenantOwner(tenantId) && (
          hasRole('admin') || 
          hasRole('keptu') || 
          hasRole('kamad') || 
          (hasRole('teacher') && resource.data.classId in getUserData().scope.classIds) ||
          (hasRole('student') && getUserData().referenceId == studentId) ||
          (hasRole('parent') && request.auth.uid in resource.data.parentIds)
        );
        
        // Pembedaan tegas operasi create, update, dan delete demi keutuhan data
        allow create: if isTenantOwner(tenantId) && (hasRole('admin') || hasRole('keptu'))
                      && request.resource.data.tenantId == tenantId;
                      
        allow update: if isTenantOwner(tenantId) && (hasRole('admin') || hasRole('keptu'))
                      && resource.data.tenantId == tenantId 
                      && request.resource.data.tenantId == tenantId;
                      
        allow delete: if isTenantOwner(tenantId) && hasRole('admin')
                      && resource.data.tenantId == tenantId;
      }

      // Attendance Subcollection (Pencatatan Presensi Kelas Terproteksi ABAC)
      match /attendance/{attendanceId} {
        allow read: if isTenantOwner(tenantId);
        
        allow create: if isTenantOwner(tenantId) && (
          hasRole('admin') ||
          (hasRole('teacher') && request.resource.data.classId in getUserData().scope.classIds)
        ) && request.resource.data.tenantId == tenantId;
        
        allow update: if isTenantOwner(tenantId) && (
          hasRole('admin') ||
          (hasRole('teacher') && resource.data.classId in getUserData().scope.classIds && request.resource.data.classId in getUserData().scope.classIds)
        ) && resource.data.tenantId == tenantId && request.resource.data.tenantId == tenantId;
        
        allow delete: if isTenantOwner(tenantId) && hasRole('admin')
                      && resource.data.tenantId == tenantId;
      }
    }

    // Penolakan Keras Akses Root Global Tanpa Batasan Path Tenant
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

# 6.10 Firebase Storage Security Rules

Penyimpanan berkas administrasi dan foto profil diamankan menggunakan pencocokan folder tenant terisolasi, kepemilikan file, batasan tipe berkas (*MIME type*), dan ukuran berkas:

```javascript
service firebase.storage {
  match /b/{bucket}/o {
    
    function isTenantOwner(tenantId) {
      return request.auth != null && request.auth.token.tenantId == tenantId;
    }

    // Berkas Surat Izin (Document Letters) - divalidasi berdasarkan kecocokan Tenant dan Kepemilikan Siswa
    match /tenants/{tenantId}/students/{studentId}/letters/{fileName} {
      allow read: if isTenantOwner(tenantId);
      allow write: if isTenantOwner(tenantId) && 
        request.auth.token.referenceId == studentId && 
        request.resource.size < 5 * 1024 * 1024 && // Batas Maksimal 5MB
        request.resource.contentType.matches('image/.*|application/pdf'); // Khusus gambar & PDF
    }

    // Berkas Foto Profil (Avatars)
    match /tenants/{tenantId}/avatars/{userId} {
      allow read: if request.auth != null;
      allow write: if isTenantOwner(tenantId) && 
        request.auth.uid == userId && 
        request.resource.size < 2 * 1024 * 1024 && // Batas Maksimal 2MB
        request.resource.contentType.matches('image/.*');
    }
  }
}
```

---

# 6.11 Audit Security & Cryptographic Integrity Ledger

e-MAM mengimplementasikan pembukuan audit log yang tidak dapat disangkal (*Non-Repudiation*) menggunakan metode Cryptographic Hash Chaining di database lokal untuk memastikan kepatuhan mutlak aktivitas pengguna meskipun berjalan offline.

### 6.11.1 Security Audit Record Contract
Setiap kali repositori melakukan mutasi data penting (misal poin BK atau persetujuan surat), repositori wajib mencatat data audit log dengan format struktur model berikut:

```typescript
export interface SecurityAudit {
  id: string;                  // ID unik log audit (UUID)
  tenantId: string;            // Madrasah asal
  actorId: string;             // UID pengguna pengeksekusi
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'OVERRIDE' | 'MIGRATION';
  resource: string;            // Nama entitas target (e.g., 'points')
  resourceId: string;          // ID dokumen yang dimutasi
  permission: string;          // Izin yang dievaluasi
  decision: 'ALLOW' | 'DENY';  // Hasil evaluasi
  beforeHash: string;          // SHA-256 Hash dokumen sebelum mutasi
  afterHash: string;           // SHA-256 Hash dokumen setelah mutasi
  previousHash: string;        // SHA-256 Hash dokumen audit log SEBELUMNYA (N-1)
  deviceInfo: string;          // Sidik jari hardware / browser user agent
  createdAt: number;           // Epoch Milliseconds UTC
}
```

### 6.11.2 Append-Only & Hash Chain Verification
- **Immutable Dexie Table:** Dexie repository dilarang keras menyediakan metode update atau delete terhadap tabel `audit_logs` lokal.
- **Ledger Verification:** Saat sinkronisasi, Sync Engine memverifikasi validitas rantaian hash audit (`previousHash === hash(Log_N-1)`). Jika rantaian tidak cocok, proses sinkronisasi dibatalkan dan sistem memicu status peringatan keamanan (*Security Incident Status*).

---

# 6.12 Sensitive Data (PII) Protection Policy

Data Pribadi Siswa dan Tenaga Kependidikan diklasifikasikan secara berlapis untuk menentukan cara penanganan visualisasi dan logging.

### 6.12.1 Klasifikasi Data PII (Personally Identifiable Information)
1. **Level 1 (Public):** Tidak sensitif. Boleh ditransmisikan, dicari dengan teks bebas, dan dicatat pada file log diagnostic. (e.g., Nama Madrasah, Kalender Akademik, Pengumuman).
2. **Level 2 (Internal):** Terbatas bagi warga internal madrasah terdaftar. (e.g., Nama Siswa, Nama Guru, Nama Kelas).
3. **Level 3 (Sensitive):** Membutuhkan validasi scope data secara ketat. Dilarang keras dicatat pada diagnostic console log. (e.g., NISN, Nilai Rapor, Kehadiran, Kasus BK).
4. **Level 4 (Restricted):** Data krusial keamanan tinggi. Wajib dimasking pada layer presentasi UI dan tidak boleh diekspos dalam keadaan raw tanpa verifikasi otoritas ganda. (e.g., NIK, Nomor Kontak Personal, Password, Token, Claims).

### 6.12.2 Visual Masking Directive
Setiap input visual atau tabel laporan yang menampilkan NIK (Level 4) wajib mengaplikasikan filter masking di tingkat UI secara default:
```text
Nomor Induk Kependudukan (Raw): 3201041805940002  ──► Masked Render: 3201**********0002
```

---

# 6.13 Developer Privilege Hardening (Override Policy)

Akun pengembang platform (*Developer*) diatur secara ketat untuk menghindari penyalahgunaan wewenang:
- **Eksplisit Account Type:** Deteksi status pengembang dikunci lewat atribut `accountType: 'developer'`, bukan murni level string role.
- **Override Audit Rule:** Developer dilarang keras membuka data tenant manapun tanpa menyertakan nomor tiket kerja dan alasan bisnis yang terdokumentasi. Setiap override akses akan memicu catatan audit khusus di cloud:

```json
{
  "action": "DEVELOPER_OVERRIDE_ACCESS",
  "reason": "Production database emergency debugging",
  "ticketId": "WO-SEC-2026-991"
}
```

---

# 6.14 Security Governance & Forbidden Practices

Demi menjaga kepatuhan penuh terhadap standar EAOM, e-MAM menetapkan aturan larangan keras berikut:

### ❌ Praktik Terlarang (Forbidden)
1. **Bypass Core Layer:** UI mengakses Firebase SDK Firestore/Storage secara langsung (Semua wajib dialirkan melalui Sync Engine terisolasi).
2. **UI Role Checks:** Komponen UI menentukan menu visual menggunakan pembanding string role mentah.
3. **Firestore User Directory Authority:** Menggunakan Firestore koleksi `users` sebagai acuan pembuatan otorisasi runtime.
4. **Parameter-Driven tenantId:** Repositori menerima filter ID tenant secara bebas dari komponen presentasi.
5. **PII Logging:** Pengembang memanggil instruksi `console.log` pada objek data yang memuat atribut Level 3 atau Level 4.

###  Praktik Wajib (Mandatory)
1. Mengakses identitas runtime murni via `SecurityContext`.
2. Melakukan filter tenant secara implisit di tingkat repositori menggunakan `SecurityContext.currentTenantId()`.
3. Menggunakan rantaian hash berantai kriptografi (*Hash Chain*) pada audit trail lokal.
4. Menempatkan seluruh berkas otorisasi keamanan di bawah folder `/src/core/security/`.
5. Menjalankan linter keamanan secara periodik guna memverifikasi nihilnya file import SDK Firebase di luar gerbang Sync Engine.

---

# 6.15 Definition of Done (Security Architecture)

Security Architecture e-MAM System dinyatakan lengkap dan sah (Done) jika memenuhi checklist kualitas berikut:

| No | Komponen Kepatuhan Keamanan | Kriteria Penilaian | Status |
| :-: | :--- | :--- | :-: |
| 1 | **No Firebase SDK Imports** | Tidak ada import `firebase/firestore` di seluruh folder components, hooks, services, dan repositories di luar `/src/database/sync/` dan `/src/services/firebase.ts`. | ✅ |
| 2 | **Centralized Otorisasi** | Seluruh pemeriksaan navigasi visual dan fungsional bisnis dievaluasi via `AuthorizationService.hasPermission()` tanpa hardcoded role check. | ✅ |
| 3 | **Tenant Isolation Gate** | Repositori tidak menerima parameter tenantId bebas dari UI; tenantId diselesaikan via SecurityContext secara aman. | ✅ |
| 4 | **Constrained Query Builder** | ABAC Scope dievaluasi menggunakan anyOf composite query Dexie untuk mencegah pemborosan in-memory client-side filtering. | ✅ |
| 5 | **Cryptographic Audit Ledger** | Tabel audit trail bersifat append-only dan dikunci menggunakan model verifikasi rantaian hash (hash chain). | ✅ |
| 6 | **Storage & Firestore Rules** | Aturan Firebase Rules ter-deploy penuh menyaring tipe file, ukuran file, kecocokan tenantId, serta ABAC scope pemilik dokumen. | ✅ |
| 7 | **Developer Audit Trail** | Akses developer dikunci via accountType dan mewajibkan pencatatan tiket resmi setiap memicu manual override data. | ✅ |
| 8 | **PII Masking** | Atribut sensitif seperti NIK ter-masking penuh di UI presentasi dan terbebas dari kebocoran console logs. | ✅ |

---

### Status Akhir Blueprint

```text
06 SECURITY ARCHITECTURE

STATUS:
APPROVED — FREEZE COMPLIANT

VERSION:
1.1.1

ALIGNMENT:
✅ EAOM v2.0 Enterprise Offline-First standard
✅ Architecture Freeze v1.1
✅ Data Architecture Blueprint v1.1.0
✅ Centralized Policy-Driven Permission Model
```
