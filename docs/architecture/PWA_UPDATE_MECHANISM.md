# PWA Auto-Update Mechanism

Version: 1.0.0
Status: APPROVED

Dokumen ini menjelaskan strategi pembaruan Service Worker yang aman (Safe Update) untuk e-MAM System, sesuai dengan prinsip Offline-First.

## 1. Background Download
Saat pengguna membuka aplikasi dan Service Worker mendeteksi adanya versi baru dari CDN/Hosting, proses pengunduhan aset baru dilakukan sepenuhnya di belakang layar tanpa mengganggu pengguna yang sedang beroperasi.

## 2. Safe Update Check
Sebelum melakukan aktivasi versi baru (`skipWaiting` / `clients.claim`), sistem wajib memvalidasi:
- ✅ `SyncQueue` Dexie dalam keadaan KOSONG.
- ✅ Tidak ada proses `SyncEngine` yang sedang berjalan.
- ✅ QR Scanner tidak aktif (kamera mati).
- ✅ Tidak ada transaksi aktif di formulir yang belum tersimpan.

## 3. Eksekusi Update
Jika kondisi aman terpenuhi (atau pada saat sistem Idle), Service Worker akan mengklaim kontrol:
1. `activate()` dijalankan.
2. `clients.claim()` dijalankan.
3. Reload halaman secara otomatis (atau dengan konfirmasi modal yang tidak intrusif jika dirasa perlu, "Aplikasi telah diperbarui dan akan dimuat ulang...").

## 4. Force Update
Apabila update meliputi perubahan kritikal seperti:
- Perubahan Skema Dexie
- Patch Keamanan

Aplikasi berhak memaksa reload *setelah* semua status antrian lokal diamankan (disinkronisasi).

## 5. Integrasi Developer Console
Status Service Worker dan cache akan ditambahkan pada panel `Developer Console` untuk memonitor:
- Current SW Version vs Latest Version
- Waiting Service Worker (pending update)
- Status Safe Update (Blocked / Ready)
