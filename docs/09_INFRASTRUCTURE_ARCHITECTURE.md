# 09. INFRASTRUCTURE ARCHITECTURE

## e-MAM System Enterprise

**Version:** 1.1.0
**Status:** DRAFT — EAOM COMPLIANT
**Document Type:** Enterprise Infrastructure Blueprint
**Single Source of Truth (SSOT) Reference:** `docs/09_INFRASTRUCTURE_ARCHITECTURE.md`

---

# 9.0 Infrastructure Overview

## 9.0.1 Purpose
Infrastructure Architecture mendefinisikan lingkungan eksekusi (*runtime environment*) tempat seluruh komponen e-MAM System Enterprise dijalankan, diamankan, dipantau, dan diskalakan.

---

## 9.0.2 Goals
1. Menyediakan lingkungan runtime yang aman (*secure by default*).
2. Mendukung arsitektur Offline-First secara penuh.
3. Memastikan skalabilitas horizontal tanpa perubahan desain aplikasi.
4. Memisahkan tanggung jawab client dan cloud.
5. Meminimalkan biaya operasional Firebase.
6. Menyediakan observability penuh terhadap sistem.

---

## 9.0.3 Design Philosophy
Aplikasi dibangun dengan filosofi **Thin Cloud, Fat Client, Offline Native, Managed Infrastructure, Zero Server Management**.

---

## 9.0.4 Infrastructure Principles
- **Local Processing First:** Sebisa mungkin komputasi dilakukan di sisi client.
- **Managed Services:** Mengutamakan layanan managed dibanding mengelola server sendiri.
- **Stateless Cloud:** Cloud Functions tidak boleh menyimpan state permanen.
- **Secure by Default:** Komunikasi wajib HTTPS/TLS, JWT Authentication, dan Firestore Security Rules.
- **Observable Infrastructure:** Komponen harus dapat dipantau (health, audit, log, metrics).

---

# 9.1 Enterprise Infrastructure Topology
## 9.1.1 High-Level Topology
```text
                    Users
                      │
                      ▼
             React PWA (Browser)
                      │
──────────────────────┼──────────────────────
                      │
        Dexie IndexedDB (Offline)
                      │
             Sync Engine Daemon
                      │
──────────────────────┼──────────────────────
                      │ HTTPS / TLS
                      ▼
              Firebase Platform
        ┌──────────┬─────────────┬─────────────┐
        │          │             │             │
        ▼          ▼             ▼             ▼
 Authentication Firestore  Cloud Storage  Functions
```

---

# 9.2 Infrastructure Component Map
Pemetaan komponen client dan cloud secara mendetail. (Lihat bagian 9.3 dan 9.4 untuk rincian).

---

# 9.3 Client Infrastructure

## 9.3.1 Overview
Client Infrastructure merupakan lingkungan eksekusi utama (*Primary Runtime Environment*). Sesuai filosofi **Local-First**, browser adalah **application host** yang mandiri.

## 9.3.2 Runtime Components
| Komponen | Tanggung Jawab |
| :--- | :--- |
| React | Presentation Layer |
| Zustand | Application State |
| Services | Business Orchestration |
| Repository | Database Gateway |
| Dexie | Operational Database |
| Sync Engine | Background Synchronization |
| Service Worker | PWA Runtime |
| Web Worker | Background Computation |

## 9.3.3 Storage Policy
- **IndexedDB (Dexie):** Data bisnis/operasional.
- **Cache Storage:** Aset statis.
- **LocalStorage:** Konfigurasi ringan non-sensitif.
- **SessionStorage:** Data sementara selama sesi.

---

# 9.4 Cloud Infrastructure

## 9.4.1 Overview
Cloud Infrastructure menyediakan layanan backend terkelola (*Managed Cloud Platform*).

## 9.4.2 Cloud Service Responsibilities
| Service | Responsibility |
| :--- | :--- |
| Firebase Authentication | Identity Provider |
| Cloud Firestore | Synchronization Database |
| Cloud Storage | Binary Object Storage |
| Cloud Functions | Event Processing |
| Firebase Hosting | Static Web Hosting |

---

# 9.5 Infrastructure Environments
- **Development:** Lingkungan sandbox pengembang.
- **Testing:** Lingkungan otomatisasi QA.
- **Staging:** Lingkungan pre-production mirroring real data.
- **Production:** Lingkungan operasional madrasah.

---

# 9.6 Network Architecture
Komunikasi antara Browser dan Firebase dilakukan melalui HTTPS/TLS. Tidak ada infrastruktur jaringan khusus selain yang disediakan oleh Firebase.

---

# 9.7 Identity & Access Infrastructure
Menggunakan Firebase Authentication, JWT, Custom Claims, IAM, dan Service Account untuk pengelolaan akses yang aman.

---

# 9.8 Monitoring & Observability
Mencakup logging, metrics, audit pipeline, crash reporting, health check, dan alerting.

---

# 9.9 Backup & Disaster Recovery
Strategi backup Firestore, Cloud Storage, pemulihan data, serta target RPO/RTO.

---

# 9.10 Scalability & Performance
Definisi batas batch, kuota Firestore, strategi indeks, dan target performa infrastruktur.

---

# 9.11 Infrastructure Security
Enkripsi, secret management, IAM, dan prinsip least privilege dari perspektif infrastruktur.

---

# 9.12 Infrastructure Standards & Constraints
Standar yang wajib dipatuhi implementasi untuk menjamin kompatibilitas dan stabilitas.

---

# 9.13 Definition of Done (Infrastructure)
| No | Kriteria Audit | Status |
| -: | :--- | :---: |
| 1 | Infrastruktur memenuhi standar EAOM | ✅ |
| 2 | Lingkungan dipisah secara ketat | ✅ |
| 3 | Observability aktif | ✅ |
| 4 | Strategi backup/DR terdefinisi | ✅ |
| 5 | Keamanan infrastruktur sesuai standar | ✅ |
