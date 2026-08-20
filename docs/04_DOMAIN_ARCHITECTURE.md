# 04. Domain Architecture - e-MAM System Enterprise

**Version:** 1.0.0  
**Status:** APPROVED  
**Scope:** Core Domain Boundaries, Business Entities, Domain Isolation Rules  
**Single Source of Truth (SSOT) Reference:** `docs/04_DOMAIN_ARCHITECTURE.md`

---

## 4.1 Domain Landscape

The e-MAM Bounded Domains are structured around core educational resources, operational transactions, administrative compliance, and user identities. The Domain layer is independent of any database management systems, transport protocols, or UI layouts.

```text
                         e-MAM DOMAIN
                              │
 ┌───────────────┬───────────────┬───────────────┐
 │               │               │               │
Identity      Academic        Student        Teacher
Domain        Domain          Domain         Domain
 │               │               │               │
 └───────────────┴───────────────┴───────────────┘
                              │
                 ┌────────────┼────────────┐
                 │                         │
            Attendance                 Assessment
             Domain                     Domain
                 │                         │
                 └────────────┬────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
          Letter          Report          Administration
          Domain          Domain             Domain
```

---

## 4.2 Identity Domain

The Identity Domain governs authentications, profile setups, and credential registrations. It matches Firebase authenticated sessions with enterprise configurations.

### User Entity:
```text
User
 ├── id (Primary Key - Firebase Uid)
 ├── tenantId (Madrasah isolation)
 ├── accountType (developer | madrasah | kanwil | kemenag)
 ├── role (Primary profile role)
 ├── roles[] (Multi-role registry support)
 ├── permission[] (Cached access list)
 ├── scope (Data visibility boundaries)
 └── status (active | suspended)
```

### Identity Rules:
1. **Source of Authority:** Firebase Custom Claims acts as the absolute cryptographic authority of roles. The client-side context caches these properties for UI layout rendering.
2. **Profile Splitting:** Authentication credentials (managed by Firebase Auth) and operational profiles (persisted in database collections) are kept strictly separate.
3. **No Direct Hardcoding:** Component UI security checks must evaluate capabilities via the `Permission Engine` rather than parsing user roles.

---

## 4.3 User & Authorization Domain

Provides fine-grained, dynamic Role-Based Access Control (RBAC) and Attribute-Based Access Control (ABAC) evaluation.

```text
User
  │
  ├───────────────┐
  │               │
Account Type    Roles
  │               │
  │               ├── developer
  │               ├── kepala_madrasah
  │               ├── kepala_tu
  │               ├── guru
  │               ├── wali_kelas
  │               ├── operator
  │               ├── bendahara
  │               ├── siswa
  │               └── orang_tua
  │
  ▼
Permission (Actions: read | write | delete | approve)
  │
  ▼
Scope (Context: personal | class | school-wide)
```

---

## 4.4 Academic Domain

Coordinates madrasah-wide curriculum schedules, learning semesters, physical facilities, and classroom resources.

```text
Academic Domain

AcademicYear
      │
      ▼
Semester (Academic Term)
      │
      ▼
Classes
      │
      ▼
Subject (Mata Pelajaran)
      │
      ▼
Schedule (Time & Day Allocations)
      │
      ▼
Learning Activity
```

### Core Relational Flow:
```text
Teacher (Teaches) ──► Schedule ──► Class (Consists of) ──► Students
```

---

## 4.5 Student Domain

Enforces enrollment flows, identity logging, guardian mappings, and historical progress.

### Student Entity:
```text
Students
 ├── idUnik (Primary Key / Business ID)
 ├── tenantId (Madrasah context)
 ├── nisn (National Student Number)
 ├── name
 ├── gender
 ├── birthDate
 ├── classId (Current active class placement)
 ├── parentId (Linked guardian ID)
 └── status (active | graduated | inactive)
```

### Student Invariant Rules:
- A student MUST belong to exactly one Class per active Semester.
- A student profile MUST have a verified `parentId` mapping for parental dashboard linkages.

---

## 4.6 Teacher Domain

Manages teacher professional identities, active classroom schedules, and workloads.

### Teacher Entity:
```text
Teachers
 ├── id (Primary Key)
 ├── tenantId
 ├── nip (National Teacher ID)
 ├── name
 ├── subjectId[] (Specialized curricula)
 └── status (active | inactive)
```

### Teacher Invariant Rules:
- A teacher cannot teach two classes simultaneously in the same Room slot. This scheduling collision check is resolved during calendar onboarding.

---

## 4.7 Attendance Domain

Manages the core transactional event within the e-MAM ecosystem: real-time daily multi-session checking, leave approval integration, non-cumulative point calculations, and counseling automation.

**Single Source of Truth (SSOT):** `docs/ATTENDANCE_LEAVE_POINTS_BLUEPRINT.md`

### Core Architectural Principle:
**1 Siswa + 1 Hari = 1 Dokumen Presensi** (`attendanceId` = `studentId` + `date`).

```text
  UI Component (QR Scanner / Manual Entry)
                     │
                     ▼
             Hook Layer (State)
                     │
                     ▼
  Service Layer (Priority Rule & Point Engine)
                     │
                     ▼
     Repository Layer (Dexie Access ONLY)
                     │
                     ▼
   IndexedDB (Dexie) ──► Sync Queue ──► Sync Engine ──► Firestore
```

### 5-Session Structure & Session Status Constraints:
Every daily attendance record monitors **5 distinct sessions**:
1. **Masuk:** (`StatusMasuk`: `'H'` | `'T'` | `'TS'` | `'I'` | `'S'`)
2. **Duha:** (`StatusIbadah`: `'H'` | `'H+'` | `'TS'` | `'I'` | `'S'`) - *H+ denotes Menses/Haid exempt status*
3. **Zuhur:** (`StatusIbadah`: `'H'` | `'H+'` | `'TS'` | `'I'` | `'S'`)
4. **Ashar:** (`StatusIbadah`: `'H'` | `'H+'` | `'TS'` | `'I'` | `'S'`)
5. **Pulang:** (`StatusPulang`: `'H'` | `'PC'` | `'S'` | `'I'` | `'A'`)

### Attendance Record Entity (`AttendanceRecord`):
```typescript
export interface AttendanceRecord {
  // Composite Primary Key
  attendanceId: string;       // Format: ${studentId}_${date}
  tenantId: string;           // Multi-tenant isolation scope
  classId: string;            // Filtering & Rombel reference
  studentId: string;
  date: string;               // YYYY-MM-DD

  // 5 Sesi Utama
  sessions: {
    masuk: { time: string | null; status: StatusMasuk };
    duha: { time: string | null; status: StatusIbadah };
    zuhur: { time: string | null; status: StatusIbadah };
    ashar: { time: string | null; status: StatusIbadah };
    pulang: { time: string | null; status: StatusPulang };
  };

  // PTSP Domain Linkage (Leave Approval System)
  suratId?: {
    izin?: string;            // PTSP Surat Izin Document ID
    sakit?: string;           // PTSP Surat Sakit Document ID
  };

  // Processed Output (Replayed via Service Layer)
  derived: {
    statusHarian: StatusKetFinal; // 'H' | 'I' | 'S' | 'A'
    poinHarian: number;           // Calculated daily violation points
  };
}
```

### Deterministic Priority Rule (`Hierarchy of Status`):
Daily status evaluation (`derived.statusHarian`) follows a strict precedence cascade:
$$\text{I} > \text{S} > \text{A} > \text{H+} > \text{H} > \text{T/TS/PC}$$

- **`I` (Izin):** Active `suratId.izin` or any session marked `I`.
- **`S` (Sakit):** Active `suratId.sakit` or any session marked `S`.
- **`A` (Alpha):** All 5 sessions marked `TS` / `A`.
- **`H` (Hadir):** Default normal presence.

### Non-Cumulative Point Engine & Counseling Automation:
Violation points (`poinHarian`) are calculated on a **non-cumulative daily basis**:
- **Minor Violations (`T`, `TS`, `PC`):** $\text{poin} = \min(5, \text{jumlah pelanggaran unik})$. *(Combination of T, TS, or PC within the same day yields maximum 5 points)*.
- **Alpha (`A`):** Absolute **10 points**.
- **Neutral (`H`, `I`, `S`, `H+`):** **0 points**.

#### Point Ledger & Counseling Threshold Automation:
Point ledgers (`PointLedger`) aggregate active violation points and achievement reductions (Hafalan = -10, Sertifikat = -15). The Guidance & Counseling (BK) engine triggers action escalations deterministically:
$$\text{Total Poin} \ge 15 \implies \text{Konseling}$$
$$\text{Total Poin} \ge 25 \implies \text{SP I}$$
$$\text{Total Poin} \ge 50 \implies \text{SP II}$$
$$\text{Total Poin} \ge 75 \implies \text{SP III}$$
$$\text{Total Poin} \ge 100 \implies \text{Evaluasi DO}$$

---

## 4.8 Assessment Domain

Facilitates scoring, semester metrics aggregation, and official academic report generation.

```text
Assessment Model

Student ──► Subject ──► Evaluation (Task / Exam Type) ──► Grade Score
```

---

## 4.9 Letter Domain

Administers incoming, outgoing, and internal school declarations, approvals, and archives.

```text
Letter Category (Surat Izin | Surat Keterangan | Surat Keluar | Surat Masuk)
                        │
                        ▼
            Submission (Request Entry)
                        │
                        ▼
            Approval (Multi-level approvals)
                        │
                        ▼
            Document (PDF generation)
                        │
                        ▼
            Archive (Compliance logs)
```

---

## 4.10 Reporting Domain

Aggregates operational details into analytics reports, physical summaries, and performance visualizations.

```text
Data Domains (Student, Teacher, Attendance, Disciplinary Points)
                               │
                               ▼
                        Reporting Engine
                               │
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
    Dashboard Charts    PDF Report Exports    CSV Data Sheets
```

---

## 4.11 Domain Dependency Rule

Domain models and entities are fully decoupled. They are pure data representations and domain logic engines.

```text
Presentation Layer (React Component)
         │
         ▼
Application Layer (Zustand State)
         │
         ▼
Domain Layer (Entities & Invariants)   ◄── Pure Domain Core (No framework dependencies)
         │
         ▼
Repository Layer (Dexie Access)
```

### Core Restrictions:
- Domain classes/interfaces MUST NOT import **React**, **Firebase SDK**, **Zustand**, or **Dexie**. They reside at the very center of clean software design.

---

## 4.12 Bounded Contexts

```text
┌──────────────────────────────────────┐
│ 1. Identity Bounded Context          │
│    User • Role • Access Permission   │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ 2. Academic Bounded Context          │
│    Classes • Subject • Schedule        │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ 3. Student Bounded Context           │
│    Student • Parent Profile          │
└──────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 4. Attendance & Point Bounded Context                        │
│    5-Session Monitoring • Leave Linkage • Non-Cumulative    │
│    Point Engine • Guidance & Counseling (BK) Escalation     │
└─────────────────────────────────────────────────────────────┘
```
