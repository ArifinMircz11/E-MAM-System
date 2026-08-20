# 🏫 e-Mam System - Integrated Manajement Academic Madrasah (Enterprise Edition)

## 📖 Tentang Aplikasi
**e-Mam System** (Integrated Madrasah Academic Manager) adalah solusi sistem manajemen sekolah (*School Management System*) berbasis *cloud* yang dikembangkan secara khusus untuk mendigitalisasi seluruh ekosistem operasional di lingkungan madrasah.

Aplikasi ini menyatukan berbagai kebutuhan administratif, akademik, dan pelayanan publik dalam satu platform yang terintegrasi, aman, dan dapat diakses dengan mudah oleh guru, siswa, orang tua, serta pengelola madrasah.

### 💡 Manfaat Utama
- **Efisiensi Administrasi**: Mengurangi beban kerja manual guru dan staf melalui otomatisasi presensi, rekapitulasi nilai, dan pengelolaan persuratan.
- **Transparansi & Akuntabilitas**: Menyediakan data *real-time* yang akurat mengenai perkembangan akademik siswa dan kinerja GTK bagi pemangku kebijakan.
- **Peningkatan Kedisiplinan**: Sistem pemantauan kehadiran berbasis *geofencing* dan QR Code yang transparan serta terintegrasi dengan poin kedisiplinan.
- **Pelayanan Terpadu (PTSP)**: Mempercepat alur birokrasi internal maupun pelayanan kepada orang tua/masyarakat melalui sistem digital yang terstruktur.
- **Ketahanan Operasional**: Dengan dukungan arsitektur *Offline-First*, aplikasi tetap dapat digunakan dengan normal meskipun koneksi internet tidak stabil, untuk kemudian melakukan sinkronisasi data secara otomatis.

---

## ⚡ Fitur Utama & Keunggulan Sistem

- **Smart QR Presence Lense**
  Pemindaian kode absensi siswa multi-mode (Tepat Waktu, Terlambat, Haid pasca-sesi salat, Pulang Cepat) yang diproses luring seketika ($O(1)$) dengan sinkronisasi otomatis pasca-koneksi kembali (Offline-First Service Engine).
- **Guru GPS Geofencing Presensi**
  Verifikasi presensi kehadiran mengajar guru di ruang kelas dengan radius toleransi ketat (< 15 meter) menggunakan pembacaan koordinat satelit presisi tinggi.
- **Auto-Point Engine**
  Sistem kalkulasi reward-and-punishment poin terotomatisasi saat proses scan absensi, terintegrasi ke modul Guru BK dan Leaderboard Kedisiplinan siswa.
- **Layanan Portal Kemenag & PTSP (Pelayanan Terpadu Satu Pintu)**
  Workflow persuratan dinamis, disposisi, pengajuan mutasi siswa, pengelolaan alumni, serta tanda tangan digital (QR Secure Seal) Kepala Madrasah.
- **Enterprise-Grade Clean Architecture**
  Pola 5 Lapis (UI -> Hook -> Service/Repository -> Cache/Dexie -> Firebase Sync) dengan granularitas tinggi untuk pemeliharaan modular 5+ tahun ke depan.
- **Firestore Cost & Load Optimizer**
  Pengurangan hingga 75% biaya Firebase Read dengan optimalisasi cache multi-tier, snapshot batching, index komposit, serta agregat dashboard offline.

---

## 🛠️ Stack Teknologi

- **Frontend Core**: React 18.2, TypeScript 5.3, Vite 5.1
- **Styling & UI**: Tailwind CSS, Framer Motion (for micro-interactions & view transitions), Lucide Icons
- **Local Cache & Offline DB**: Dexie.js (IndexedDB wrapper for rapid transactions)
- **Backend Service**: Express.js with Node, Tsx, and Esbuild
- **Cloud Database & Auth**: Firebase Firestore (Offline-aware), Firebase Auth (RBAC Mapping)
- **Kecerdasan Buatan (AI)**: `@google/genai` (Gemini API SDK) untuk integrasi asisten guru rilis RPP otomatis
- **Eksportir Formal**: jsPDF, AutoTable, SheetJS (XLSX)
- **Testing Sandbox**: Vitest

---

## 🔧 Pengembangan Lokal & Instalasi

### Prasyarat Sederhana
- Node.js LTS (Versi 18 atau lebih baru direkomendasikan)
- NPM atau PNPM

### Langkah 1: Kloning Repositori
```bash
git clone <repository-url>
cd emam-system
```

### Langkah 2: Pemasangan Dependensi
```bash
npm install
```

### Langkah 3: Konfigurasi File Lingkungan (.env)
Salin contoh format lingkungan (.env.example):
```bash
cp .env.example .env
```
Lengkapi isian variabel sensitif seperti kredensial Firebase dan API Keys (Gemini/OpenAI) Anda.

### Langkah 4: Jalankan Server Pengembangan
```bash
npm run dev
```
Aplikasi akan aktif di mode pengembangan dan dapat diakses di http://localhost:3000. Untuk memproses linting statik:
```bash
npm run lint
```

---

## 🚀 Mekanisme Rilis Produksi

Untuk menghasilkan bundle produksi berkinerja tinggi, bersihkan folder dist lama dan bundel aset frontend & backend Anda:
```bash
npm run build
```
Memicu peluncuran server produksi mandiri:
```bash
npm run start
```

---

## 🏛️ Arsitektur & Blueprints

e-Mam System dibangun di atas fondasi arsitektur enterprise yang kokoh. Detail mengenai strategi desain, aliran data, dan 30 cetak biru sistem dapat ditemukan di:
👉 **[/ARCHITECTURE.md](/ARCHITECTURE.md)**

---

## 📂 Struktur Proyek (Final Target Architecture)

Aplikasi ini menggunakan pola **Enterprise Layered Architecture** yang dioptimalkan untuk performa tinggi, skalabilitas multi-tenant, dan ketahanan offline:

```text
src/
├── app/                  # Router, Layouts, Providers, Guards
├── assets/               # Images, Icons, Fonts, Styles
├── components/           # Shared UI Components (Atomic Design)
├── features/             # DOMAIN MODULES (Bento Grid)
│   ├── attendance/       # Presensi Siswa & GTK
│   ├── students/         # Manajemen Siswa & Profil
│   ├── journals/         # Jurnal KBM Digital
│   ├── points/           # Reward & Punishment
│   ├── letters/          # PTSP & Persuratan
│   ├── qr/               # QR Engine & Generator
│   ├── ptsp/             # Layanan Terpadu
│   └── ...           
│
├── hooks/                # Orchestration & UI State Hooks
├── services/             # BUSINESS LOGIC & RBAC EVALUATOR (Domain Services)
│   ├── offline/          # Worker pengolah data offline
│   └── sync/             # SyncEngine & Conflict Resolution
│
├── database/             # REPOSITORY & PERSISTENCE (Dexie)
│   ├── dexie.ts          # Init IndexedDB
│   ├── schema.ts         # Local Schema Definition
│   └── repositories/     # CRUD Abstraction (Dexie Only)
│
├── store/                # Client State Management (Zustand)
├── core/                 # INFRASTRUCTURE & SECURITY
│   ├── security/         # RBAC, Tenant Isolation, Audit
│   └── constants/        # System Configurations
│
├── pwa/                  # Service Worker & Cache Management
├── types/                # TypeScript Models & DTOs
└── utils/                # Stateless Shared Utilities
```

---

## 🏢 Kepemilikan & Struktur Instansi

- **Penyusun & Arsitek Utama**: Akhmad Arifin (NIP: 19901004 202521 1012), Senior IT Systems Engineer
- **Madrasah Pengampu**: Madrasah Aliyah Negeri 1 Hulu Sungai Tengah (MAN 1 Hulu Sungai Tengah), Kementerian Agama RI
- **Lisensi**: Proprietary & Enterprise Internal Standard

---

## 🛠️ Troubleshooting & Known Issues

Jika Anda menemui kendala pada fitur **GitHub Push/Export**:
- **Status**: Saat ini sistem sedang mengalami kendala otorisasi *platform-level* (Permission Denied).
- **Saran**: Harap hubungi tim support platform AI Studio melalui dashboard bantuan Anda untuk memvalidasi otorisasi repository.

### Ikon "Developer Trace" (Melayang)
- Ikon ini mengakses **Developer Log Panel** (`src/components/dev/DeveloperLogPanel.tsx`).
- **Tujuan**: Untuk monitoring aktivitas sistem secara real-time, sinkronisasi data (Delta Sync), dan diagnosis error tanpa membuka *browser console*.

---
