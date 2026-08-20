# 🗺️ Peta Jalan Pengembangan Sistem (ROADMAP.md)

Dokumen ini memaparkan strategi peluncuran bertahap platform **e-Mam System** untuk melompat dari edisi sekolah tunggal (*Single School Prototype*) menuju arsitektur multi-satuan pendidikan siap SaaS (*Multi-Tenant Enterprise SaaS*).

---

## 📍 Garis Waktu Rencana Rangkuman (Roadmap At a Glance)

```text
┌───────────────────────────┐
│ FASE 1: STABILISASI INTI   │ ✔️ TELAH SELESAI
└─────────────┬─────────────┘
              ▼
┌───────────────────────────┐
│ FASE 2: DETEKSI & OFFLINE │ ⏱️ SEDANG BERJALAN
└─────────────┬─────────────┘
              ▼
┌───────────────────────────┐
│ FASE 3: AI & INTEGRASI    │ 🚀 FASE BERIKUTNYA
└─────────────┬─────────────┘
              ▼
┌───────────────────────────┐
│ FASE 4: MULTI-TENANT SaaS │ 🔮 SKALA INDUSTRI
└───────────────────────────┘
```

---

## 🛠️ Detail Rencana Aksi Setiap Fase

### 🏁 FASE 1: Stabilisasi Fondasi & Pembersihan Arsitektur (Telah Selesai)
Fokus pada migrasi arsitektur monolith menuju struktur modular yang ramping untuk re-render super minimal:
- [x] **Store Refactoring**: Memecah `useAppStore` besar menjadi modul fungsional terisolasi (`authStore`, `studentStore`).
- [x] **Firestore Optimization**: Menghentikan query melingkar (`refetch loops`) dan melarang pembacaan koleksi penuh melalui pengaitan `getDocsSafe` dan `getDocsOptimized`.
- [x] **Self-Healing Integration**: Penerapan protokol `useAutoFix` dan pembersih memori `cleanup` otomatis pada unmount kamera.
- [x] **Metadata Alignment**: Pengaturan parameter perizinan bingkai kaku (*camera, microphone, geolocation*).

---

### ⏱️ FASE 2: Offline-First Penyempurnaan & Sinkronisasi Hybrid (Sedang Berjalan)
Memaksimalkan modul offline dari database lokal (Dexie) dan menyatukan validasi antrean sinkron:
- [ ] **Dynamic Offline Priority Grid**: Menampilkan data presensi di dasbor admin langsung dari IndexedDB dengan penanda lencana sinkronisasi hijau/abu-abu.
- [ ] **Periodic Background Sync**: Memicu sinkronisasi di latar belakang menggunakan Service Worker agar guru tidak perlu memencet tombol sync secara manual.
- [ ] **Conflict Resolution Engine**: Penentuan aturan jika ada perbedaan data rekap absen fisik di lokal dengan yang diperbarui oleh admin lain di awan (aturan *Last-Write-Wins*).

---

### 🚀 FASE 3: Kemenag AI Hub & Pelayanan PTSP Otomatis (Rencana Triwulan III)
Menghadirkan fitur kecerdasan tingkat lanjut yang meringankan tugas administratif guru-guru:
- [ ] **AI-driven RPP Generator**: Integrasi SDK `@google/genai` (Gemini API) untuk menyusun rencana pelajaran sesuai kurikulum nasional Merdeka secara semi-otomatis.
- [ ] **Smart BK Counselor**: Asisten konseling ramah yang menganalisis tren akumulasi poin pelanggaran siswa dan merekomendasikan tindakan preventif yang disetujui psikolog anak.
- [ ] **Faktur & Koperasi Auto-Billing**: Penerbitan otomatis tagihan iuran koperasi madrasah dan integrasi sistem pembayaran elektronik (*Payment Gateway*).

---

### 🔮 FASE 4: SaaS Scalability & Isolasi Multi-Tenant (Rencana Jangka Panjang)
Kesiapan melepas aplikasi untuk digunakan secara masal oleh ratusan madrasah di naungan Kementerian Agama:
- [ ] **Tenant Isolation Level 1**: Mengunci seluruh dokumen dengan metadata unit kerja madrasah (`tenantId`) terenkripsi.
- [ ] **Dynamic Multi-Subdomain Routing**: Memicu pemuatan aset visual (Tema, Logo, Status Kelulusan) dinamis mengacu domain instansi masing-masing (e.g., `man1hst.emam-system.web.id`).
- [ ] **SaaS Administration Console**: Dasbor sentral bagi pengawas kementerian untuk meninjau status operasional dan statistik kedisiplinan seluruh madrasah dalam satu klik pantauan.
