# 11. DEVELOPMENT GUIDELINES

## e-MAM System Enterprise

**Version:** 1.1.0
**Status:** DRAFT — EAOM COMPLIANT
**Document Type:** Enterprise Development Guidelines
**Single Source of Truth (SSOT) Reference:** `docs/11_DEVELOPMENT_GUIDELINES.md`

---

# 11.0 Development Overview

Development Guidelines mendefinisikan standar teknis, konvensi penulisan kode, dan praktik terbaik (*best practices*) yang wajib dipatuhi oleh seluruh pengembang e-MAM System. Dokumen ini memastikan implementasi kode tetap selaras dengan arsitektur enterprise yang telah ditetapkan (SSOT).

---

# 11.1 Development Principles
- **SSOT First:** Tidak boleh ada logika bisnis/data yang menyimpang dari blueprint.
- **Clean Architecture:** Pemisahan layer yang ketat (UI → Hook → Service → Repository).
- **Feature First:** Kode diorganisir berdasarkan fitur, bukan teknis.
- **SOLID, KISS, DRY, YAGNI:** Prinsip pengembangan perangkat lunak wajib diterapkan.

---

# 11.2 Repository Structure
Struktur wajib:
```text
src/
  components/  (Pure UI)
  hooks/       (Orchestration)
  services/    (Business Logic)
  repositories/(Dexie Access)
  types/       (Shared Interfaces)
  utils/       (Shared Helpers)
```

---

# 11.3 Folder Convention
DILARANG membuat struktur folder tambahan tanpa persetujuan arsitek.

---

# 11.4 Naming Convention
- **Files:** `kebab-case`
- **Components/Hooks/Services/Repositories:** `PascalCase`
- **Constants:** `UPPER_SNAKE_CASE`

---

# 11.5 Standards
- **TypeScript:** Strict mode, tidak boleh `any`.
- **React:** Functional components, hooks, memoization.
- **Zustand:** Hanya untuk state transien (bukan data operasional).
- **Service Layer:** Pusat aturan domain, RBAC, dan workflow.
- **Repository:** Akses tunggal ke Dexie.
- **Database:** Transaksi wajib ACID.

---

# 11.6 Offline & Synchronization
- **Offline:** Semua fitur wajib berjalan offline.
- **Sync:** Akses Firestore hanya di `src/services/sync/`.

---

# 11.7 Security & Quality
- **Security:** Selalu gunakan `SecurityService` untuk validasi akses.
- **Error Handling:** `BaseApplicationError` untuk semua error.
- **Logging:** `Logger` service, dilarang `console.log` di produksi.
- **Testing:** Wajib Unit, Integration, Offline, dan Sync Test.

---

# 11.10 Definition of Done (Guidelines Compliance)
| No | Kriteria Audit | Status |
| -: | :--- | :---: |
| 1 | Kepatuhan terhadap Layer Architecture | ✅ |
| 2 | Tidak ada akses Firestore di UI/Service | ✅ |
| 3 | Semua mutasi dalam transaksi ACID | ✅ |
| 4 | Test coverage memenuhi standar | ✅ |
| 5 | Kode bebas dari duplikasi logic | ✅ |
