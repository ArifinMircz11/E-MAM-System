# 02. Business Architecture - e-MAM System Enterprise

**Version:** 1.0.0  
**Status:** APPROVED  
**Scope:** Core Enterprise Business Architecture  
**Single Source of Truth (SSOT) Reference:** `docs/02_BUSINESS_ARCHITECTURE.md`

---

## Executive Summary
Business Architecture defines **what the system does** rather than how it is technically built. For the **e-MAM System Enterprise** (Integrated Madrasah Academic Manager), the Business Architecture forms the operational foundation, aligning madrasah organizational stakeholders, academic processes, organizational constraints, and security requirements to technical implementation blueprints.

---

## 2.1 Stakeholder Map

The e-MAM System coordinates communication and operations across multi-tiered educational authorities, madrasah administrators, teachers, support units, and final beneficiaries (students & guardians).

```text
       Kementerian Agama (Kemenag)
                    │
                    ▼
          Kepala Madrasah (Principal)
                    │
                    ▼
          Tata Usaha (Administration)
                    │
   ┌────────────────┼────────────────┐
   ▼                ▼                ▼
Guru (Teachers)  BK (Counselors)  Bendahara (Finance)
   │
   ▼
Wali Kelas (Homeroom)
   │
   ▼
Siswa (Students)
   │
   ▼
Orang Tua (Guardians)
```

### Stakeholder Responsibilities:
1. **Kementerian Agama (Kemenag):** Oversight authority, policymaking, and compliance auditing.
2. **Kepala Madrasah:** General operational management, decision-making, strategic reporting, and institutional governance.
3. **Tata Usaha (TU):** System administrators, data maintainers (students, teachers, classes, academic schedules), and formal archiving.
4. **Guru:** Primary educators managing class schedules, recording learning progress, assigning scores, and marking attendance.
5. **Wali Kelas:** Student performance coordinators, homeroom mentors, and direct line of contact with parents.
6. **Guru BK (Counselors):** Tracking character building, soft skills, infractions, and merit points.
7. **Bendahara:** Financial collections, invoice distribution, tuitions, and accounting ledger management.
8. **Siswa:** Direct learning beneficiaries, undergoing identity tracking, daily attendance check-ins, and performance assessments.
9. **Orang Tua:** Active monitors of student performance, financial standing, behavioral records, and daily attendance.

---

## 2.2 Business Capabilities Matrix

Business Capabilities describe the core competencies that the e-MAM System provides to the madrasah ecosystem.

```text
e-MAM System Capabilities
├── 1. Identity Management
│   ├── Tenant (Madrasah) Registration & Isolation
│   ├── User Onboarding & Lifecycle Management
│   └── RBAC (Role-Based Access Control) Governance
├── 2. Academic Management
│   ├── Academic Year & Term Configuration
│   ├── Subject Curriculum Definition
│   └── Room & Facility Resource Scheduling
├── 3. Student Management
│   ├── Enrolment & Profiling
│   ├── Class Promotion & Graduation
│   └── Identity Verification Card Generation
├── 4. Teacher & Staff Management
│   ├── Professional Profiles & Skill Mapping
│   └── Departmental Allocation
├── 5. Attendance Management
│   ├── Real-Time Student Daily Attendance (QR-Based)
│   ├── Classroom Learning Journal & Absence Log
│   └── Staff Performance & Check-in Tracker
├── 6. Assessment Management
│   ├── Task & Exam Grade Entry
│   ├── Midterm & Final Grade Aggregation
│   └── Report Card (Rapor) Compilation & PDF Export
├── 7. Character & Discipline (Poin Kebaikan & Pelanggaran)
│   ├── Merit Category Management
│   ├── Infraction Logging & Counseling Referrals
│   └── Discipline Action Tracking
├── 8. Financial Management
│   ├── Invoice Generation & Student Fee Billing
│   └── Cash Receipting & Income Ledger Bookkeeping
├── 9. Library Management
│   ├── Book Inventory Ledger
│   └── Lending & Return Transactions Tracker
├── 10. Inventory Management
│   └── School Assets & Equipment Lifecycle Tracking
├── 11. Letter & Administration Management
│   ├── Incoming/Outgoing Official Mail Logging
│   └── Student Letters & Certificates Generation
├── 12. Reporting & Analytics
│   └── Multi-Tenant Real-Time Dashboard Aggregation
```

---

## 2.3 Business Value Chain

The Value Chain outlines the sequence of business activities that deliver value to the students, parents, and administrative staff from registration to final archiving.

```text
    [ Pendaftaran ]
           │ (Onboarding students, staff, and configuring tenant)
           ▼
[ Manajemen Pengguna ]
           │ (Role mapping, credential provisioning, and resource allocation)
           ▼
[ Kegiatan Akademik ]
           │ (Academic schedules, curricula, classroom assignments, and room allocations)
           ▼
      [ Presensi ]
           │ (Daily QR scan, class entry verification, and attendance audit)
           ▼
     [ Penilaian ]
           │ (Merit/demerit logs, mid-term testing, final exams, and grade compilation)
           ▼
       [ Laporan ]
           │ (Generating student reports, analytical boards, and financial summaries)
           ▼
        [ Arsip ]
             (Permanent digital archival, backups, and off-site cloud sync)
```

---

## 2.4 Core Business Processes

### 2.4.1 QR Attendance Business Process
The QR Attendance check-in process requires robust offline capability and synchronization to maintain transactional integrity.

```text
  [ Guru / Scanner ]                [ Local Dexie Database ]          [ Cloud Firestore ]
          │                                   │                              │
    1. Login & Choose Class                   │                              │
          │                                   │                              │
    2. Scan Student QR Code                   │                              │
          │                                   │                              │
    3. Validate Identity locally ─────────────►                              │
          │ (Verify student belongs to class) │                              │
          │                                   │                              │
    4. Save to Local Dexie ───────────────────► (Record saved instantly)     │
          │                                   │                              │
    5. Enqueue in Sync Queue ─────────────────► (Item appended to queue)     │
          │                                   │                              │
          │ ── 6. Process Queue (Sync Engine) ───────────────────────────────►
          │                                                                  │ (Document written to Firestore)
          │                                                                  │
          │ ◄── 7. Acknowledge Receipt ──────────────────────────────────────│
          │
    8. Update Sync Status locally
```

---

## 2.5 Strategic Business Rules

Business rules ensure operational correctness, data privacy, and legal/regulatory compliance across all madrasah branches.

1. **Strict Multi-Tenant Isolation:**
   - Every operational transaction and data point MUST have a `tenantId`.
   - Cross-tenant data inspection or mutation is strictly forbidden.
2. **Single Identity Constraint:**
   - A student can only have one active profile per academic year.
   - Every student's physical QR Card maps to a unique Business ID (`idUnik`).
3. **Temporal Validity (Jadwal-Presensi):**
   - Class attendance can only be recorded within the official time window of the assigned academic schedule (+/- 30 minutes threshold).
4. **Least-Privilege Authorization Model:**
   - Teachers may only access, write, or view grades and student details for classes and subjects they are actively assigned to.
   - Homeroom teachers (Wali Kelas) have read-write access to report card compile states for their class.
   - Counselor (Guru BK) holds write privileges for disciplinary points but read-only access to academic grades.
   - Parents have read-only access strictly limited to their own children's records.
5. **Local-First Availability (Offline Capability):**
   - 100% of attendance, learning journals, and point entries MUST function completely offline.
   - Data is persisted instantly locally and synced transparently once internet access is established.
6. **Immutable Audit Trails (Soft Delete Policy):**
   - Operational data is NEVER physically deleted via client transactions. A soft delete (`deleted: true`, `deletedAt: Timestamp`) policy is mandatory.
   - Every security-sensitive transaction (e.g., updating a final grade, removing student accounts, changing role permissions) must record a secure transaction log inside `audit_logs`.

---

## 2.6 Core Business Roles & Permissions

The following matrix describes the mapped operational capabilities across the enterprise roles:

| Role Name | Scope of Access | Primary Capabilities |
| :--- | :--- | :--- |
| **Developer / Super Admin** | Global / Multi-Tenant | System architecture overrides, tenant provisioning, system maintenance. |
| **Administrator (Kepala TU)**| Madrasah-Wide | Student & staff enrollment, scheduling, setting configurations, ledger setup. |
| **Kepala Madrasah** | Madrasah-Wide (Read-Only) | Global reporting, KPI monitoring, official letter approvals, financial auditing. |
| **Guru (Subject Teacher)** | Allocated Classes Only | Learning journals, class attendance logging, task/mid-term/final grade entry. |
| **Wali Kelas (Homeroom)** | Assigned Class Only | Homeroom attendance approval, report card validation, student counseling overview. |
| **Guru BK (Counselor)** | Madrasah-Wide (Points/BK) | Incident logging, merit/demerit points management, student guidance records. |
| **Staf TU (Admin Staff)** | Allocated Admin Modules | Letter management, physical inventory, library tracking, student file updates. |
| **Bendahara (Treasurer)** | Madrasah-Wide (Finance) | Billing generation, payment receipting, cash account books. |
| **Siswa** | Personal Only | Schedule viewing, homework tracking, progress scores, personal QR identity. |
| **Orang Tua** | Mapped Children Only | Real-time monitoring of attendance, grades, merit/demerit points, fee bills. |

---

## 2.7 Key Business Services

The application implements these business operations through dedicated, decoupled service layers:

- **Authentication Service:** Identity verification and offline session validation.
- **Authorization Service:** Dynamic permission assessment based on Role-Based Access Control (RBAC).
- **Academic Service:** Scheduling engine, room assignment, subject curriculum coordinator.
- **Attendance Service:** Real-time QR validation, classroom journals, holiday logs.
- **Student Service:** Enrollment flow, ID card QR generation, class promotion automation.
- **Teacher Service:** Teacher assignments, workload distribution.
- **Character Service:** Merit/demerit tracking, automated notification on severe incidents.
- **Letter Service:** Official mail templates, registry numbering system.
- **Finance Service:** Multi-installment billing, receipt generation.
- **Notification Service:** Real-time push, WhatsApp/Email templates, event alerts.
