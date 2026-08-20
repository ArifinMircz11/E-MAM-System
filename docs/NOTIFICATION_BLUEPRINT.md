# Blueprint Logika Bisnis Notification Center (Ikon Bel) Berdasarkan RBAC – e-MAM V7.7

Blueprint ini mengikuti prinsip arsitektur yang telah Anda tetapkan:

* ✅ Firestore hanya diakses oleh Sync Engine.
* ✅ Dexie menjadi sumber data UI.
* ✅ Repository Pattern.
* ✅ Offline First.
* ✅ SecurityService sebagai pusat RBAC.
* ✅ Audit Trail hanya pada Business Service.
* ✅ NotificationBell adalah View (tidak memiliki business logic).

---

# Arsitektur

```text
                Firestore
                     │
             (Sync Engine Only)
                     │
                     ▼
                 Dexie Database
                     │
       NotificationRepository
                     │
        NotificationService
                     │
        SecurityService (RBAC)
                     │
       useNotifications Hook
                     │
          NotificationBell
```

---

# Tujuan Notification Center

Notification Center adalah **Unified Action Center** yang mengumpulkan seluruh pekerjaan, monitoring, informasi, warning, dan error sesuai hak akses pengguna.

Notification bukan sekadar pesan.

Notification adalah representasi dari Business Process.

---

# RBAC Layer

Setiap Notification wajib memiliki metadata.

```text
notification.roleVisibility[]

notification.userVisibility[]

notification.permissions[]

notification.module

notification.priority

notification.requiresAction
```

Contoh

```text
roleVisibility

Admin
Guru
Guru BK
```

berarti hanya tiga role tersebut yang dapat melihat notification.

---

# Developer

## Action Required

* Deployment gagal
* Build gagal
* Migration database
* Reindex Dexie
* Rebuild Search
* Konflik Schema
* Sync Engine Error

Monitoring

* Firestore
* Dexie
* API
* Worker
* AI
* Queue
* CPU
* Memory

Warning

* Storage hampir penuh

* Queue tinggi

* Banyak retry

Error

* Crash

* Fatal Error

* Sync gagal

* Migration gagal

---

# Admin

Action Required

* Approval User

* Approval Guru

* Approval Siswa

* Approval Kelas

* Approval Surat

* Approval Berita

* Approval Kalender

* Approval Jadwal

* Approval Tahun Akademik

* Approval Mutasi

Monitoring

* Login

* Audit

* User Online

* Sinkronisasi

* Statistik

Warning

* Approval menumpuk

* Banyak user offline

* Sinkronisasi gagal

---

# Kamad

Action Required

* Persetujuan Surat Resmi

* Persetujuan Pengumuman

* Persetujuan Berita

* Persetujuan Kebijakan

Monitoring

* KPI

* Kehadiran

* Prestasi

* Disiplin

* Akademik

Warning

* Kehadiran turun

* Prestasi turun

---

# Keptu

Action Required

* Surat Masuk

* Surat Keluar

* Arsip

* Mutasi

* Legalisasi

Monitoring

* Dokumen

* Nomor Surat

* Arsip

* Monitoring Administrasi

---

# Guru BK

Action Required

* Approval Poin

* Approval Konseling

* Surat Pemanggilan

* Surat Peringatan

* Kasus BK

Monitoring

* Riwayat BK

* Monitoring Poin

* Monitoring Konseling

Warning

* Siswa melebihi batas poin

---

# Guru

Action Required

* Input Absensi

* Input Nilai

* Isi Jurnal

* Verifikasi Izin

* Validasi Tugas

Monitoring

* Kehadiran

* Jadwal

* Monitoring Pembelajaran

Warning

* Nilai belum lengkap

* Absensi belum lengkap

---

# Staf

Action Required

* Input Data

* Validasi Berkas

* Upload Arsip

Monitoring

* Status Pekerjaan

Warning

* Dokumen belum lengkap

---

# Siswa

Action Required

* Konfirmasi Surat

* Upload Dokumen

* Lengkapi Profil

* Kirim Surat Izin

* Kirim Surat Sakit

Monitoring

* Status Surat

* Kehadiran

* Poin

* Jadwal

* Nilai

* Tugas

Informasi

* Berita

* Pengumuman

* Agenda

Warning

* Poin hampir batas

* Kehadiran rendah

---

# Prioritas Notification

```text
Critical

High

Medium

Low

Info
```

Urutan tampilan Notification Bell

```text
Critical

↓

High

↓

Medium

↓

Low

↓

Info
```

---

# Kategori Notification

```text
Action Required

Monitoring

Informasi

Warning

Error
```

---

# Business Rule

## Action Required

Memiliki tombol aksi.

Misalnya

```text
Approve

Reject

Open

Sign

Review

Complete
```

---

Monitoring

Tidak memiliki tombol approval.

Hanya

```text
Open

View Detail
```

---

Informasi

Hanya

```text
Read

Open
```

---

Warning

Memiliki

```text
Resolve

Retry

Open Detail
```

---

Error

Memiliki

```text
Retry

View Log

Contact Admin
```

---

# Badge Logic

Jumlah badge **hanya menghitung item yang masih membutuhkan perhatian pengguna**.

```text
Badge =
Action Required (Pending)
+
Warning (Belum ditangani)
+
Error (Belum selesai)
```

Monitoring dan Informasi **tidak menambah badge**, kecuali ditandai sebagai **Critical**.

Contoh

```text
Action Pending = 5

Warning = 2

Error = 1

Monitoring = 15

Informasi = 40

Badge = 8
```

---

# Logic Filter

Saat login

SecurityService menentukan

```text
Role

Permission

Tenant

UserId
```

Kemudian Repository melakukan query lokal Dexie

```text
tenantId == currentTenant

AND

roleVisibility contains currentRole

AND

(status != Completed)
```

Jika notification bersifat personal

```text
recipientUserIds contains currentUserId
```

---

# Audit Rule

NotificationBell tidak membuat Audit Log.

Audit hanya terjadi saat aksi bisnis dijalankan.

Contoh

```text
Approve Letter
```

menghasilkan

```text
LETTER_APPROVED
```

---

```text
Reject Letter
```

menghasilkan

```text
LETTER_REJECTED
```

---

```text
Approve Profile
```

menghasilkan

```text
PROFILE_APPROVED
```

---

```text
Retry Sync
```

menghasilkan

```text
SYNC_RETRY
```

---

# Siklus Hidup Notification

```text
Created
    │
    ▼
Synced to Dexie
    │
    ▼
Visible sesuai RBAC
    │
    ▼
User membaca
    │
    ▼
Jika membutuhkan aksi
    │
    ▼
Business Service dijalankan
    │
    ▼
Audit Log dibuat
    │
    ▼
Notification diperbarui
    │
    ▼
Sinkronisasi kembali ke Firestore
```

## Acceptance Criteria

1. **NotificationBell hanya berfungsi sebagai komponen presentasi** dan tidak mengandung logika bisnis.
2. **Seluruh notifikasi dibaca dari Dexie melalui `NotificationRepository`**, tanpa akses langsung ke Firestore.
3. **RBAC diterapkan melalui `SecurityService`** berdasarkan `tenantId`, `role`, `permission`, dan `recipientUserIds`.
4. **Setiap role hanya melihat notifikasi yang relevan** dengan tanggung jawabnya.
5. **Badge hanya menghitung Action Required, Warning, dan Error** yang masih memerlukan perhatian.
6. **Monitoring dan Informasi tidak menambah badge**, kecuali memiliki prioritas `Critical`.
7. **Audit log hanya dibuat ketika pengguna menjalankan aksi bisnis**, bukan saat membuka atau membaca Notification Center.
8. **Seluruh perubahan status notifikasi** (dibaca, selesai, kedaluwarsa) diproses melalui Service dan Repository agar tetap konsisten dengan arsitektur offline-first e-MAM V7.7.
