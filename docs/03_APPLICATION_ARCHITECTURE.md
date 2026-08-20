# 03. Application Architecture - e-MAM System Enterprise

**Version:** 1.0.0  
**Status:** APPROVED  
**Scope:** Application Landscape, Separation of Concerns, Layer Rules  
**Single Source of Truth (SSOT) Reference:** `docs/03_APPLICATION_ARCHITECTURE.md`

---

## 3.1 Application Landscape

The e-MAM System Enterprise is structured as a robust, resilient full-stack offline-first system. It separates execution runtimes to ensure client independence, consistent data streaming, and safe administration processing.

```text
                    e-MAM System

                         │
        ┌────────────────┼────────────────┐
        │                │                │
   Web Application   Backend API    Background Worker
        │                │                │
 React + Vite       Express JS       Sync Worker
        │                │                │
 Zustand            Firebase Admin   Queue Processor
        │
 Dexie IndexedDB
        │
 Sync Engine
        │
 Firebase Platform (Firestore, Auth, Storage)
```

---

## 3.2 Application Layers

To guarantee modularity, maintainability, and clean decoupling, the Web Application is structured into **five mandatory architectural layers**. Communication and execution flow ONLY in a single downward direction.

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. Presentation Layer (React Component)                     │
│    Pure Presentation • Event Captures • Fluid Navigation     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. State Management Layer (Zustand Store / Custom Hooks)    │
│    Loading States • Pagination • Subscriptions Orchestration│
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Application Service Layer (Business Domain Rules)        │
│    Validation • RBAC Checks • Workflows • Audit Enqueuing   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Repository Layer (Dexie DB Abstraction)                  │
│    CRUD • Mapping • Transaction Management • Local Queries   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Local Database Layer (Dexie IndexedDB SSOT)             │
│    Single Source of Truth for live client read/write        │
└─────────────────────────────────────────────────────────────┘
```

### 3.2.1 Presentation Layer
- **Technologies:** React 19, Tailwind CSS, Vite, Framer Motion
- **Responsibilities:** Renders views, handles user interactions, performs client-side form styling, and triggers state hook methods.
- **Strict Boundary:** It is strictly forbidden to run database queries or Firestore mutations directly from components.
- **Directory Structure:**
  ```text
  src/
   └── app/
       ├── layouts/     # Persistent layout wrappers (e.g. DashboardLayout)
       ├── routes/      # Application route tree definitions
       ├── navigation/  # Navigation links, sidebar models
       └── providers/   # React Context providers (PWA, Theme, Auth)
  ```

### 3.2.2 State Management Layer
- **Technologies:** Zustand, React Hooks
- **Responsibilities:** Manages screen states, caching UI variables, tracking current user sessions, orchestrating active subscriptions, handling pagination cursors, and capturing application error states.
- **Directory Structure:**
  ```text
  src/
   └── stores/          # Zustand stores (sessionStore, uiStore, featureStore)
  ```

### 3.2.3 Application Service Layer
- **Technologies:** TypeScript Domain Classes
- **Responsibilities:** Centrally implements all business validation, workflow processing, RBAC evaluation, audit triggering, caching policies, and synchronization decisions.
- **Strict Boundary:** The Service Layer is the only layer authorized to coordinate multi-module processes. It never communicates with Firestore directly (this is delegated to the Sync Engine).
- **Directory Structure:**
  ```text
  src/
   └── services/        # Business services (authService, studentService, etc.)
  ```

### 3.2.4 Repository Layer
- **Technologies:** TypeScript Repository Pattern Classes
- **Responsibilities:** Provides clean, deterministic, and stateless CRUD interfaces to Dexie. Maps database tables to business entities. Handles database transactions.
- **Strict Boundary:** Repositories are strictly forbidden from importing Firebase SDKs or reacting to UI states. They are database-specific abstractions.
- **Directory Structure:**
  ```text
  src/
   └── repositories/    # Data repositories (StudentRepository, UserRepository)
  ```

---

## 3.3 Feature Architecture (Modular Features)

Features are decoupled modules organized inside the `src/features/` folder. Every domain feature encapsulates its own presentation elements and interacts with the rest of the application exclusively through defined services.

```text
src/features/
├── auth/                 # Sign-in/out pages and session helpers
├── dashboard/            # Analytical visual dashboards (BK, Teacher, Student)
├── akademik/             # Classes, rooms, schedules, and subject curriculum
├── presensi/             # QR scanning page, daily classroom check-ins
├── siswa/                # Student directories, promotion management, profiles
├── guru/                 # Teacher allocations, workload records
├── surat/                # Incoming/outgoing letters and digital template forms
├── laporan/              # Consolidated report generation (PDF & Excel)
├── keuangan/             # Tuitions billing and transaction ledger tracking
├── perpustakaan/         # Book listings, borrowings, returns
├── inventaris/           # School asset registers
└── pengaturan/           # System, profile, and offline sync administration
```

### Modular Directory Structure:
```text
src/features/<feature_name>/
├── components/           # Feature-specific sub-components
├── pages/                # High-level route screen views
├── hooks/                # Specialized feature orchestration hooks
├── services/             # Feature-specific business services
├── types/                # TypeScript type & enum declarations
└── index.ts              # Decoupled public interface entry point
```

---

## 3.4 Navigation Architecture

Navigation generation is completely automated, secure, and dynamically computed using the application's Permission Engine. Roles are mapped to capability sets server-side, which the navigation registries evaluate at boot time.

```text
Account Type (Firebase Auth ID Token)
             │
             ▼
Role (RBAC Custom Claims)
             │
             ▼
Permission Engine (Permission Evaluation check)
             │
             ▼
Navigation Registry (Validating dynamic routes matches)
             │
             ▼
Sidebar / Menu Component (Renders permitted items)
```

### Forbidden Pattern (Brittle UI role checks):
```typescript
// ❌ STRICTLY FORBIDDEN: Brittle hardcoded role check
if (user.role === 'admin') {
  showUserManagementTab();
}
```

### Approved Pattern (Clean capability check):
```typescript
// ✅ APPROVED: Decoupled capability assessment
if (permission.can('manage_user')) {
  showUserManagementTab();
}
```

---

## 3.5 Application Dependency Rule

The dependency model is strictly unidirectional. Lower-level layers MUST never import or depend on higher-level layers, preventing cyclic references and compilation errors.

```text
React Component (Presentation)
       │
       ▼
Zustand Store (UI State)
       │
       ▼
Business Service (Domain Rules)
       │
       ▼
Repository (Data Access)
       │
       ▼
Dexie IndexedDB (Local DB)
       │
       ▼
Sync Engine (Transport)
       │
       ▼
Cloud Firestore / Auth (Cloud Platform)
```

### Forbidden Direct Imports (Layer Bypassing):
- **Component → Firebase SDK (❌ FORBIDDEN):** UI must never query Firestore directly.
- **Component → Dexie IndexedDB (❌ FORBIDDEN):** UI must never read tables directly.
- **Repository → Firebase SDK (❌ FORBIDDEN):** Repositories must remain purely local-first (Dexie-only).
- **Service → Firebase SDK (❌ FORBIDDEN):** Services must delegate database syncing to the Sync Engine.

---

## 3.6 Application Security Boundaries

Security is established through defense-in-depth across both frontend contexts and cloud policies.

```text
React Client Interface
         │
         │ ID Token (JWT)
         ▼
Firebase Authentication (Validates token structure)
         │
         ▼
RBAC Custom Claims (Checks assigned privileges)
         │
         ▼
Authorization Context (Caches capabilities inside the Client)
         │
         ▼
Permission Engine (Dynamic UI rendering gate)
```
