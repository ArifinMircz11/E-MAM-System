# 🛡️ Panduan & hardening Keamanan Informasi (SECURITY.md)

Dokumen ini mendefinisikan instrumen perlindungan, audit keamanan cyber, serta protokol penanggulangan celah kerentanan web (**OWASP Top 10**) yang tertanam di dalam platform **e-Mam System**.

---

## 🔒 1. Struktur Pertahanan Berlapis (Defense in Depth)

Model keamanan platform e-Mam System dirancang menggunakan rantai pengaman berlapis (*Defense in Depth*) untuk memastikan jika salah satu lapisan runtuh, lapisan berikutnya siap meredam ancaman:

```text
[ LAPISAN 1: PROXY GATEWAY ] ── Rate Limiting & API Key Hiding
         │
[ LAPISAN 2: AUTHENTICATION ] ── Google SSO & Firebase JWT Bearer Token
         │
[ LAPISAN 3: AUTHORIZATION ] ── Server-Side Firestore Security Rules (RBAC)
         │
[ LAPISAN 4: VALIDATION CORE ] ── Strict Schema & Type Constraint (JSON Sanitizer)
         │
[ LAPISAN 5: AUDIT LOGS ] ── Secure Immutable Audit Trails
```

---

## 🛡️ 2. Penanggulangan Celah Kerentanan Klasik (OWASP Mitigation)

### A. Pencegahan Client-Side Injection (NoSQL Injection & Shadow Updates)
-   **Ancaman**: Klien jahat mengubah payload data di konsol browser untuk menyusupkan field ilegal atau mengubah nilai poin negatif.
-   **Mitigasi**:
    1.  Firebase Security Rules diprogram untuk memverifikasi validitas kunci yang dikirim (`incoming().keys().hasAll(...)`).
    2.  Pemeriksaan ketat agar field sensitif bersifat immutable (tidak dapat dikoreksi setelah diisi) menggunakan fungsi pemisah:
        ```javascript
        (!('idUnik' in existing()) || incoming().idUnik == existing().idUnik)
        ```

### B. Proteksi Cross-Site Scripting (XSS Protection)
-   **Ancaman**: Masukan data profil siswa atau catatan BK berisi baris kode script `<script>maliciousCode()</script>` yang dapat mencuri session cookie staf lain.
-   **Mitigasi**:
    1.  Semua visualisasi teks Markdown diolah menggunakan parser aman `react-markdown` yang membuang elemen HTML mentah (*HTML escaping*).
    2.  Data teks masukan dibersihkan secara proaktif di sisi Hooks menggunakan utilitas pembersih string sebelum dialihkan ke database awan.

### C. Proteksi Cross-Site Request Forgery (CSRF Protection)
-   **Mitigasi**: Integrasi otentikasi Bearer JWT yang disematkan langsung pada header transmisi request HTTP API (`Authorization: Bearer <token>`). Skema ini tidak memanfaatkan penyimpanan cookie tradisional browser, sehingga kebal secara mutlak terhadap skenario serangan CSRF.

---

## 🚦 3. Pembatasan Beban Lalu Lintas (Rate Limiting)

Server Express mengaktifkan pembatasan frekuensi ketat untuk menghentikan serangan DDOS (*Distributed Denial of Service*) dan penyalahgunaan kuota API Keys AI pada endpoint proxy:

```typescript
import rateLimit from 'express-rate-limit';

export const proxyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Durasi jendela evaluasi: 15 Menit
  max: 500, // Batas maksimal request per IP dalam satu jendela
  message: { error: 'Terlalu banyak permintaan absensi dari perangkat Anda, silakan coba lagi nanti.' }
});
```

---

## 📝 4. Jejak Audit Kemananan (Immutable Audit Trail)

Semua aksi penulisan, koreksi absensi, dan penyesuaian hak akses pengguna dicatat secara permanen di koleksi `/audit_logs`.
-   **Aturan Integritas**: Koleksi `/audit_logs` diprogram melalaui Firestore Rules agar **hanya diperbolehkan untuk operasi CREATE** oleh pengguna aktif. Operasi UPDATE dan DELETE dikunci total secara permanen, menjamin data log tidak dapat direkayasa sekalipun oleh staf internal (*Tamper-Proof Logging*).

---

## 🔄 5. Penyelamat Berkelanjutan & Pemulihan (Disaster Recovery)

-   Setiap kegagalan interaksi server backend diredam di bawah pengawasan modul **Self-Healing / useAutoFix Service** untuk mencegah aplikasi beku (*unresponsive state*).
-   Apabila terdeteksi anomali pada status integritas akun atau kebocoran peran, Admin IT can mematikan akun tersebut seketika dengan mengubah status `status: "Suspended"` di user profile, yang akan memblokir semua hak baca-tulis dokumen yang dilindungi secara instan.
