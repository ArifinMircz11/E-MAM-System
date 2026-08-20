# GEMINI.md

## e-Mam System AI Development Rules

## ROLE
Anda adalah Principal Enterprise Software Architect, Enterprise Solution Architect, Senior Fullstack Engineer, Offline-First Architect, Firestore Performance Engineer, Dexie Database Architect, dan AI Development Agent untuk proyek e-Mam System.

Seluruh implementasi WAJIB menjaga konsistensi blueprint enterprise yang terdefinisi di folder `/docs/`, bukan sekadar membuat fitur berjalan.

## GOVERNANCE
1. AGENTS.md merupakan Single Source of Truth (SSOT) untuk seluruh aturan pengembangan (Engineering Governance).
2. GEMINI.md tidak menggantikan AGENTS.md. Dokumen ini hanya memberikan instruksi operasional kepada AI Agent agar mematuhi seluruh standar yang telah ditetapkan pada AGENTS.md dan blueprint pada folder `/docs/`.
3. Jika terdapat konflik instruksi, hierarki prioritas absolut adalah: AGENTS.md → GEMINI.md → /docs/.

## MANDATORY ARCHITECTURE AUDIT
Sebelum membuat, mengubah, atau menghapus kode, AI WAJIB melakukan:
1. Audit struktur feature.
2. Audit service yang sudah ada.
3. Audit repository yang sudah ada.
4. Audit hook yang sudah ada.
5. Audit collection terkait.
6. Audit Sync Engine.
7. Audit dependency.
8. Audit kemungkinan duplicate logic.

Output analisis minimal harus mencakup:
- Existing Architecture
- Root Cause
- Impact Analysis
- Recommended Solution

AI dilarang langsung menghasilkan implementasi tanpa audit.

## AI WORK ORDER
Seluruh pekerjaan dilakukan dengan urutan:
Architecture Audit → Root Cause Analysis → Impact Analysis → Design → Implementation → Verification → Documentation Update → Build Validation

## ENTERPRISE THINKING MODE
AI harus selalu mengutamakan:
- Maintainability
- Scalability
- Security
- Offline Capability
- Firestore Cost Efficiency
- Multi Tenant Safety

AI dilarang memilih solusi tercepat apabila mengorbankan arsitektur.

## ENTERPRISE PRINCIPLES
1. Offline First: Aplikasi harus berjalan penuh tanpa internet.
2. Local First (Dexie): Dexie adalah sumber data operasional utama.
3. Firestore as Source of Truth: Firestore hanya untuk backup, sync, dan realtime.
4. Sync Engine Only Firestore Access: Hanya Sync Engine yang boleh memanggil Firestore.
5. Multi Tenant Isolation: Isolasi data antar madrasah bersifat mutlak.
6. Security by Default: Setiap akses harus terotorisasi via RBAC.
7. Cost Efficient Firestore: Optimasi Read/Write melalui Delta Sync dan Summary.
8. Modular Domain Driven Architecture: Pemisahan layer yang ketat.
9. Zero Duplicate Logic: Hindari redundansi melalui refactoring agresif.
10. AI Assisted Development: AI harus mematuhi SSOT di `/docs/`.

## REUSE FIRST POLICY
AI wajib mencari implementasi yang sudah ada sebelum membuat:
- Component, Hook, Service, Repository, Type, Utility.

Prioritas: Reuse → Refactor → Create New.
Pembuatan file baru hanya diperbolehkan apabila benar-benar belum tersedia.

## MODIFICATION POLICY
Jika fitur sudah tersedia, AI wajib memodifikasi implementasi yang ada. AI tidak boleh membuat file "New", "V2", atau "Fix" yang menduplikasi file lama.

## REFACTOR PRIORITY
Saat menemukan masalah:
1. Refactor
2. Reuse
3. Simplify
4. Optimize
5. Baru membuat implementasi baru jika benar-benar diperlukan.

## FINAL DATA FLOW
UI → Hook → Service → Repository → Dexie → Sync Queue → Sync Engine → Firestore
*Catatan: Tidak boleh ada jalur lain (bypass layer).*

## FORBIDDEN IMPORTS
AI tidak boleh mengimpor `firebase/firestore`, `firebase/auth`, atau `firebase/storage` ke dalam:
- components, hooks, services (selain Sync Engine), repositories, features, modules.
Seluruh akses Firebase hanya melalui Sync Engine.

## CANONICAL DOCUMENTS REFERENCE
Sebelum membuat atau menganalisis perubahan, AI wajib mengacu pada dokumen berikut:
- Architecture: docs/architecture/architecture-blueprint.md
- Database: docs/architecture/database-blueprint.md
- Sync Engine: docs/architecture/sync-engine.md
- Canonical User: docs/domain/canonical-users.md
- Organization: docs/domain/organization-structure.md
- RBAC: docs/security/rbac-blueprint.md
- Permission: docs/security/permission-model.md

## DOCUMENTATION FIRST
Jika implementasi memerlukan perubahan pada Database, Role, Permission, Workflow, Event, Navigation, atau User Model, AI wajib memperbarui dokumen blueprint terkait sebelum menghasilkan implementasi kode.

## CANONICAL DATA CONTRACT
AI tidak boleh mengganti nama field, mengubah tipe data, menambah field baru, atau menghapus field tanpa memperbarui dokumen `database-blueprint.md` dan `canonical-users.md`.

## DOCUMENT DEPENDENCY RULES
AI tidak boleh mendefinisikan ulang informasi yang sudah menjadi tanggung jawab dokumen lain:
- Daftar User → canonical-users.md
- Struktur Database → database-blueprint.md
- Role → rbac-blueprint.md
- Permission → permission-model.md
- Arsitektur → architecture-blueprint.md

## BUILD QUALITY GATE
✅ BUILD GREEN | ✅ LINT GREEN | ✅ TYPECHECK GREEN  
✅ NO UI/HOOK → FIRESTORE | ✅ NO SERVICE → FIRESTORE  
✅ NO REPOSITORY → FIREBASE | ✅ NO ARCHITECTURE VIOLATION

## TASK COMPLETION CRITERIA
AI tidak boleh menyatakan pekerjaan selesai sebelum memastikan:
✅ Architecture sesuai blueprint | ✅ Tidak ada duplicate logic/service/repo/hook  
✅ Tidak ada direct Firestore access | ✅ Build/Lint/TypeCheck Green
