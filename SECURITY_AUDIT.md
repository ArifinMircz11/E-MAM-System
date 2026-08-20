# SECURITY_AUDIT.md — e-MAM System Enterprise Security Audit (WO-SEC-001)

Dokumen ini merupakan Laporan Hasil Audit Keamanan Enterprise (Enterprise Security Foundation Audit) untuk platform **e-MAM (Enterprise Madrasah Management System)** sesuai dengan Work Order **WO-SEC-001**. Audit ini dilakukan tanpa mengubah kode, business logic, UI, maupun struktur domain operasional.

---

## 1. Daftar Endpoint Express (API Routers & Proxy)

Berdasarkan pemeriksaan pada `server.ts` dan seluruh modul router di `/api/`, berikut adalah daftar lengkap endpoint yang aktif:

- **AI Proxies:**
  - `POST /api-proxy/*` (Gemini API Proxy)
  - `POST /api-proxy-openai/*` (OpenAI API Proxy)
- **WhatsApp (`/api/whatsapp/...`):**
  - Webhook, Kirim Pesan, Gateway Status, Bot Integration
- **Authentication (`/api/auth/...`):**
  - `POST /api/auth/claim` (Klaim Akun Siswa)
  - Login & Session management endpoints
- **Analytics (`/api/analytics/...`):**
  - Statistik presensi, rekap nilai, laporan dashboard
- **Attendance (`/api/attendance/...`):**
  - `POST /api/attendance/scan` (Pencatatan Presensi & QR Scan)
  - Rekap harian, perizinan, laporan kehadiran
- **Poin (`/api/poin/...`):**
  - Pelanggaran & Penghargaan siswa
- **Developer & Admin (`/api/developer/admin/...`):**
  - `POST /api/developer/admin/activate-user`
  - Manajemen tenant, migrasi schema, seeding database
- **Sync (`/api/sync/...`):**
  - `GET /api/sync/pull-all` (PWA Pull-to-Refresh Sync)
- **Chatbot (`/api/chatbot/...`):**
  - Interaksi AI Asisten Madrasah
- **Agent (`/api/agent/...`):**
  - Enterprise Agent Gateway
- **News (`/api/news/...`):**
  - Pengumuman & Berita Madrasah
- **System Diagnostics:**
  - `GET /api/firestore-test` (Koneksi & Tes Firestore Admin)

---

## 2. Daftar Middleware yang Digunakan

1. **Helmet & Compression:**
   - Diterapkan secara global di `server.ts` (`helmet({ frameguard: false, contentSecurityPolicy: false })`, `compression()`). *Catatan: Frameguard dimatikan agar iframe embedding AI Studio berfungsi.*
2. **Rate Limiter (`proxyLimiter`):**
   - Diterapkan pada `/api-proxy` dan `/api-proxy-openai` (max 500 requests per 15 menit).
3. **Admin Middleware (`verifyAdmin`):**
   - Diterapkan pada `/api/developer/admin/*`. Memverifikasi Firebase ID Token via `adminAuth.verifyIdToken()`, melakukan bypass untuk email developer tertentu (`ptspmanhst@gmail.com`, `dgt.3652@gmail.com`, `tuman1hst@gmail.com`), serta melakukan lookup role di Firestore koleksi `admins` / `users`.
4. **Performance Monitoring Middleware:**
   - Logging metrik HTTP method, URL, status code, dan durasi eksekusi untuk setiap request.

---

## 3. Daftar Route Tanpa Autentikasi (Public / Unprotected)

Endpoint berikut dapat diakses tanpa menyertakan Bearer Token / Firebase ID Token:
1. `POST /api-proxy` (Gemini Proxy — dilindungi rate limit, namun tidak memerlukan user token).
2. `POST /api-proxy-openai` (OpenAI Proxy — dilindungi rate limit dan pengecekan API key server).
3. `POST /api/auth/claim` (Digunakan siswa untuk klaim akun awal menggunakan ID Unik dan NISN).
4. `POST /api/attendance/scan` (Digunakan mesin pemindai/QR scanner tanpa autentikasi token pengguna berbasis bearer di header).
5. `GET /api/sync/pull-all` (Digunakan PWA untuk sinkronisasi massal awal).
6. `GET /api/firestore-test` (Endpoint diagnostik koneksi database).
7. Endpoint publik WhatsApp Webhook, News, dan Static Assets.

---

## 4. Daftar Route Tanpa Tenant Validation (`tenantId`)

Sebagian besar rute operasional di `/api/attendance`, `/api/poin`, `/api/analytics`, dan `/api/sync/pull-all` belum secara ketat memvalidasi parameter `tenantId` pada level middleware backend Express (banyak query yang mengambil data koleksi secara global atau mengandalkan filter sisi klien di Dexie).

1. `GET /api/sync/pull-all`: Mengambil koleksi `notifications` dan `users` secara global tanpa memfilter berdasarkan `tenantId` aktif.
2. `POST /api/attendance/scan`: Mencari siswa berdasarkan `code` secara global (`students.doc(code)`) tanpa memvalidasi apakah siswa tersebut milik tenant Madrasah yang sedang aktif memindai.
3. Sebagian besar endpoint analitik dan poin melakukan kueri Firestore tanpa validasi header `X-Tenant-ID` secara eksplisit di middleware.

---

## 5. Daftar Route Tanpa RBAC (Role-Based Access Control) Enforcement di Backend

Meskipun `/api/developer/admin/*` memiliki middleware `verifyAdmin`, rute backend lainnya belum menerapkan RBAC middleware secara terpusat:
1. `/api/attendance/*` (Tidak memverifikasi apakah pemanggil memiliki role `guru`, `admin`, atau `piket`).
2. `/api/poin/*` (Tidak memverifikasi apakah pemanggil berhak mencatat poin pelanggaran).
3. `/api/sync/*` (Tidak memverifikasi hak akses pengguna terhadap data yang disinkronkan).

---

## 6. Daftar Firestore Rules yang Berbahaya (Potensi Eksploitasi Klien)

Berdasarkan audit arsitektur Firestore Rules (`firestore.rules`), ditemukan potensi risiko berikut jika aturan tidak dikunci dengan ketat:
1. **Pewarisan Peran Klien:** Jika aturan Firestore memperbolehkan pengguna memperbarui dokumen mereka sendiri di koleksi `users` tanpa validasi server (`allow update: if request.auth != null && request.auth.uid == userId`), pengguna dapat mengubah field `role` atau `peran` menjadi `admin` atau `developer` secara langsung dari client SDK.
2. **Ketiadaan Validasi `tenantId` pada Write:** Beberapa aturan rule koleksi operasional mungkin mengizinkan penulisan dokumen baru tanpa memvalidasi bahwa `request.resource.data.tenantId` sama dengan `tenantId` dari pengguna yang diautentikasi.

---

## 7. Daftar Password Hardcoded & Bootstrap Default

1. **Default Password Akun Demo / Seed:** Pada skrip migrasi dan seeding awal (`src/database/` atau file seeding dummy), terdapat password default yang di-generate (misal: `madrasah123`, `admin123`, `siswa123`).
2. **Hardcoded Admin Bypass Emails:** Di `/api/admin/routes.ts` (baris 23), terdapat hardcoded array email bypass:
   - `ptspmanhst@gmail.com`
   - `dgt.3652@gmail.com`
   - `tuman1hst@gmail.com`
   Endpoint admin mengizinkan akses penuh jika email cocok dengan daftar ini, terlepas dari hasil query Firestore.

---

## 8. Daftar Eksposur API Key (Secret Exposure Check)

1. **Gemini API Key (`GEMINI_API_KEY` / `API_KEY`)**: Tersimpan di server-side environment variable dan digunakan di proxy `/api-proxy`. **Aman** (tidak terekspos langsung di bundle frontend client).
2. **OpenAI API Key (`OPENAI_API_KEY`)**: Tersimpan di server-side environment variable dan digunakan di proxy `/api-proxy-openai`. **Aman** (tidak terekspos di client).
3. **Firebase Admin SDK Service Account**: Diinisialisasi melalui environment variables atau file konfigurasi server-side (`src/lib/firebase-admin.ts`). **Aman** dari eksposur browser, namun memerlukan proteksi ketat pada container runtime.

---

## 9. Daftar Endpoint Debug yang Aktif di Production

1. `GET /api/firestore-test`: Endpoint diagnostik untuk menguji koneksi Firestore, operasi pembacaan dokumen konfigurasi, penulisan dokumen tes, dan pemanggilan `adminAuth.listUsers()`. Endpoint ini aktif dan terbuka secara publik tanpa autentikasi token, yang dapat dimanfaatkan pihak luar untuk melakukan *information disclosure* terkait status kesehatan database dan ID proyek Firebase.

---

## 10. Prioritas Perbaikan (Security Remediation Priorities)

1. **Prioritas 1 (High): Autentikasi Endpoint Diagnostik & Sensitif**
   - Batasi akses ke `/api/firestore-test` hanya untuk role `developer` atau matikan di environment production.
2. **Prioritas 2 (High): Validasi Tenant & RBAC Middleware Terpusat**
   - Terapkan middleware `verifyFirebaseIdToken` dan `requireTenant` pada seluruh rute backend operasional (attendance, poin, analytics, sync).
3. **Prioritas 3 (Medium): Validasi Custom Claims & Hardcoded Bypass**
   - Pindahkan verifikasi hak akses admin dari hardcoded email di router ke Firebase Custom Claims yang di-set secara aman melalui backend Admin SDK.
4. **Prioritas 4 (Medium): Hardening Firestore Rules**
   - Pastikan aturan keamanan Firestore melarang klien menulis/mengubah field `role`, `peran`, `tenantId`, dan `isAccountClaimed` secara mandiri.
