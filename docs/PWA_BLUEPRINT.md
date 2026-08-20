# Blueprint Progressive Web App (PWA) e-MAM V7.7

Blueprint ini mendokumentasikan spesifikasi, konfigurasi, alur pembaruan (update flow), dan mekanisme instalasi Progressive Web App (PWA) pada ekosistem **e-MAM System (Integrated Madrasah Academic Manager)**.

---

# 1. Desain Arsitektur PWA

Arsitektur PWA e-MAM dirancang menggunakan pendekatan **Offline-First** dan terintegrasi penuh dengan siklus hidup aplikasi serta data lokal IndexedDB (Dexie).

```text
                  [ Browser / Device Client ]
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
       [ Service Worker ]             [ Offline Cache / Storage ]
      (Workbox / VitePWA)             (Precached Static Assets)
               │
               ▼
   [ Firestore Version Poller ] ───> [ system_config/app_version ]
    (Real-time / Delta Check)
```

---

# 2. Spesifikasi Manifest & Aset (`vite.config.ts`)

e-MAM menggunakan `@vitejs/plugin-react` bersama `vite-plugin-pwa` untuk integrasi PWA otomatis selama proses build.

### Manifest Configuration:
* **Nama Aplikasi**: `e-Mam System`
* **Short Name**: `e-Mam System`
* **Deskripsi**: `Integrated Madrasah Academic Manager - e-Mam System`
* **Warna Tema (Theme Color)**: `#020617` (Deep Slate / Dark-safety)
* **Kategori Aset yang Dimasukkan (Precached Assets)**: `favicon.ico`, `robots.txt`, `apple-touch-icon.png`.
* **Ikon Aplikasi**:
  * Menggunakan ikon beresolusi tinggi yang ditarik secara aman (`192x192` dan `512x512` piksel) yang mendukung fitur *maskable* dan *adaptive display* pada berbagai OS (Android, iOS, Windows, macOS).

---

# 3. Siklus Hidup PWA & Strategi Update (`PWAUpdateNotification.tsx`)

Mekanisme pembaruan aplikasi menjamin integritas kode klien agar tidak terjadi ketidaksinkronan skema database lokal dengan versi cloud.

```text
Aplikasi Dijalankan
        │
        ├── Polling Firestore Version (Setiap 10 Menit)
        ├── PWA Service Worker Check (Setiap 30 Detik)
        │
        ▼
   Versi Baru Terdeteksi?
        │
        ├── [TIDAK] ──> Tetap Berjalan Offline-First
        │
        └── [YA]
             │
             ▼
     Tampilkan Overlay
   "Update Wajib" (Full-Screen)
             │
             ├── Hitung Mundur (10 Detik)
             └── Tombol "Perbarui & Muat Ulang"
             │
             ▼
      Service Worker Update &
      Force Reload (Halaman Segar)
```

### Detil Implementasi Kunci:
1. **Firestore Version Check (Polling)**:
   * Setiap 10 menit, aplikasi membaca dokumen `system_config/app_version` di Firestore.
   * Jika nilai `version` tidak cocok dengan `initialVersion` saat inisialisasi aplikasi, sistem akan memicu transisi ke status pembaruan.
2. **Service Worker Polling**:
   * Setiap 30 detik, runtime klien menginstruksikan Service Worker untuk melakukan `reg.update()`. Hal ini memicu deteksi jika file statis di server web mengalami pembaruan (misalnya saat deployment rilis baru selesai).
3. **Bypass Development**:
   * Seluruh mekanisme Service Worker dilewati secara aman saat berjalan di mode development (`import.meta.env.DEV`) untuk mencegah fungsionalitas HMR terganggu.

---

# 4. Mekanisme Instalasi Multi-Platform

Sistem menyediakan alur instalasi native yang ramah pengguna untuk dua ekosistem sistem operasi utama:

### A. Android & Desktop (Chrome / Chromium)
* Menggunakan event listener `beforeinstallprompt` untuk menangkap token instalasi native dari browser.
* Menampilkan tombol interaktif **"Instal di Perangkat"** dengan ikon unduhan modis jika aplikasi dapat diinstal.
* Setelah pengguna menyetujui, token `deferredPrompt` dijalankan dan status dibersihkan.

### B. iOS (Apple Safari)
Karena iOS Safari tidak mendukung standard `beforeinstallprompt`, e-MAM mengimplementasikan pembantu instalasi kustom:
* **Deteksi Perangkat**: `/iPad|iPhone|iPod/.test(navigator.userAgent)` untuk memastikan target pengguna menggunakan iOS.
* **Deteksi Status Standalone**: Memastikan pengguna belum menambahkan aplikasi ke beranda menggunakan `(window.navigator as any).standalone === true`.
* **Petunjuk Langkah demi Langkah (iOS-First Guide)**:
  1. Klik ikon **Share** (kotak dengan panah ke atas) pada Safari.
  2. Gulir ke bawah dan ketuk **"Tambahkan ke Layar Utama"** (*Add to Home Screen*).
  3. Tekan **"Tambah"** (*Add*) di sudut kanan atas.
* **Dismissable Prompt**: Status diingat menggunakan `localStorage` (`emam_pwa_ios_prompt_dismissed`) agar tidak mengganggu kenyamanan berselancar setelah ditutup oleh pengguna.

---

# 5. Keamanan & Kebijakan Cache Offline

* **Auto-Update**: Service worker didaftarkan dengan tipe `registerType: 'autoUpdate'`. Ketika file baru dideploy, service worker segera mem-precaching file-file baru tersebut di latar belakang.
* **Akses Offline**: Melalui pemisahan bundle build statis (`manualChunks` di Rollup), pustaka penting seperti `firebase-core`, `vendor-react`, dan `vendor-ui` dikelompokkan secara logis agar disimpan dalam cache browser jangka panjang secara efisien, menghemat penggunaan kuota internet hingga 70%.
* **Integrasi Omni-Guard**: Keamanan integritas kode dijamin melalui obfuscation statis selama proses rilis production untuk memitigasi risiko modifikasi ilegal pada runtime klien saat berjalan secara offline.
