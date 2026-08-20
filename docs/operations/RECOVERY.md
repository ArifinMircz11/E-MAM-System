# RECOVERY.md

## Panduan Pemulihan Sistem (Recovery Guide)

Dokumen ini berisi langkah-langkah sistematis jika terjadi error pada aplikasi.

### 1. Diagnosa Awal (Root Cause Analysis)
Jangan langsung memperbaiki kode. Ikuti langkah ini:
1.  **Cek Log:** Periksa log di terminal atau console AI Studio.
2.  **Identifikasi Layer:** Tentukan di layer mana error terjadi:
    *   **UI:** Komponen React.
    *   **Hook:** Logika orchestration.
    *   **Service:** Business logic/validasi.
    *   **Repository:** CRUD Dexie (Database lokal).
    *   **Sync Engine:** Firestore sync.
    *   **Backend:** Server (`server.ts`).
3.  **Klasifikasi Error:** Apakah Network, Permission, Validation, atau Module?

### 2. Alur Perbaikan (Layered Fix)
Setelah menemukan layer, lakukan perbaikan di layer tersebut saja:
*   Jika **Backend/Module Import Error**: Periksa aturan ESM (file extensions) atau path di `package.json`.
*   Jika **Repository Error**: Periksa Dexie schema atau query.
*   Jika **Sync Error**: Periksa Firestore rules atau logic di `SyncEngine`.

### 3. Verifikasi Ulang (Validation)
Setelah perbaikan:
1.  Uji alur **Login** (berhasil/gagal).
2.  Uji **CRUD Lokal** (Dexie berfungsi).
3.  Uji **Offline** (Aplikasi tetap berjalan saat offline).
4.  Uji **Sinkronisasi** (Data terupdate saat kembali online).
