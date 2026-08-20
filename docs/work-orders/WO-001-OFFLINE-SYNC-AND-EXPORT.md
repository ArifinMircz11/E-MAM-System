# Work Order (WO-001): Enterprise Offline-First Sync Indicator & Attendance Excel Export

## 1. Objective
Mengimplementasikan indikator status sinkronisasi offline-first yang mendalam (real-time pending queue & network status monitor) serta fitur ekspor rekapitulasi presensi ke format Excel untuk staf tata usaha, admin, developer, dan wali kelas sesuai standar arsitektur IMAM System v2.0.

## 2. Background
- Pengguna memerlukan transparansi terhadap antrean sinkronisasi data lokal (`sync_queue` di Dexie IndexedDB) saat bekerja secara offline maupun online.
- Kebutuhan administratif madrasah menuntut fitur ekspor laporan presensi harian/bulanan ke format spreadsheet (.xlsx) yang mudah diarsipkan.

## 3. Architecture Audit
- **Layer Compliance**: Mengikuti aturan 5 Mandatory Layers (UI → Hook → Service → Repository → Dexie → Sync Engine → Firestore).
- **Offline First**: Pembacaan dan antrean mutasi data tetap beroperasi secara lokal via Dexie tanpa melanggar Firestore Access Lock.
- **RBAC**: Akses ekspor dan manajemen antrean divalidasi berdasarkan peran (`admin`, `staf`, `developer`, dan wali kelas).

## 4. Scope
- Pembuatan komponen `OfflineSyncIndicator.tsx` untuk menampilkan status jaringan dan jumlah antrean pending secara real-time di `GlobalSystemBar.tsx`.
- Penambahan fungsi ekspor Excel (`handleExportExcel` menggunakan pustaka `xlsx`) pada `AttendanceView.tsx`.
- Validasi hak akses role (Admin, Staf Tata Usaha, Developer, dan Wali Kelas).

## 5. Out of Scope
- Modifikasi skema inti Firestore di luar protokol delta sync yang sudah ada.

## 6. Architecture Rules Adherence
- ✅ Tidak ada query Firestore langsung dari UI.
- ✅ Dexie tetap menjadi operational database utama.
- ✅ Mengikuti konvensi penamaan dan penanganan error yang aman.

## 7. Acceptance Criteria
- [x] Indikator sinkronisasi muncul di navbar atas, menampilkan jumlah antrean pending dan status online/offline.
- [x] Tombol "Export Excel" pada rekap presensi berfungsi dengan baik dan menghasilkan file `.xlsx` yang terstruktur.
- [x] Build dan linter lulus tanpa error.

## 8. Testing Plan
- Uji coba interaksi ketika perangkat beralih antara mode online dan offline.
- Verifikasi unduhan file Excel rekapitulasi presensi.

## 9. Evidence Required
- Build Sukses (`Build succeeded - the applet is compiled`).
- Laporan status sinkronisasi aktif di live preview.

## 10. Exit Criteria
- Dokumen WO disetujui dan seluruh fitur terintegrasi dalam kode produksi.
