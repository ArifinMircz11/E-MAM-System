# Volume 3 – Enterprise Identity & Access Architecture
**Status: APPROVED & FROZEN**
**Date:** August 7, 2026
**Architecture Governance:** IMAM System Enterprise Development Rules v2.0

---

## 1. Context Architecture & Separation of Concerns

Architecture enforce rigid separation between Authentication, Identity, and Authorization.

```
AuthenticationContext
        │
        ▼
IdentityContext
        │
        ▼
SecurityContext
```

### 1.1 AuthenticationContext
Dedicated strictly to raw identity provider verification and session credentials:
- `uid`: Unique identifier from Identity Provider (Firebase Auth UID)
- `email`: Authenticated primary email
- `provider`: Authentication method/provider
- `token`: Security token / JWT payload
- `session`: Active session metadata and expiration

### 1.2 IdentityContext
Contains canonical identity attributes and organizational mapping:
- `canonicalUser`: Unified user entity (Reference ID, Names, NIP/NISN/NIK)
- `assignment`: Organizational assignment (Role, Portal, Status)
- `portal`: Resolved operational portal (`madrasah`, `kanwil`, `kemenag`, `developer`, `public`)
- `tenant`: Active tenant entity (Tenant ID, NPSN/NSM, Institution name)
- `reference`: Foreign key link to profile domain (`studentId`, `teacherId`, etc.)

### 1.3 SecurityContext
Pure authorization context determining permissions, capabilities, and feature toggles:
- `role`: Canonical role evaluated for authorization
- `permissions`: Set of granular permission keys
- `modules`: Authorized functional module codes
- `scope`: Access scope (`global` vs `tenant`)
- `features`: Feature flags and capabilities
- `licenses`: Tenant feature tier licenses
- `organization`: Hierarchical organizational bounds
- `impersonation`: Impersonation state (if active by Developer/Admin)

---

## 2. Enterprise Context Composition

`EnterpriseContext` acts as a clean composition of isolated sub-contexts to minimize unnecessary re-renders, decouple components, and facilitate unit testing.

```text
EnterpriseContext
 ├── AuthenticationContext
 ├── IdentityContext
 ├── SecurityContext
 ├── NavigationContext
 ├── NotificationContext
 ├── SyncContext
 └── ThemeContext
```

---

## 3. Resolver Pipeline Standard

All identity and authorization resolvers follow a deterministic, decoupled pipeline pattern:
- Single Input
- Single Output
- Zero knowledge of other resolvers
- Fully testable in isolation

```
[Authentication Resolver]
        │
        ▼
[Canonical User Resolver]
        │
        ▼
[Assignment Resolver]
        │
        ▼
[Portal Resolver]
        │
        ▼
[Tenant Resolver]
        │
        ▼
[Reference Resolver]
        │
        ▼
[Security Context Builder]
        │
        ▼
[Navigation Resolver]
        │
        ▼
[Dashboard Resolver]
        │
        ▼
[Route Guard]
```

---

## 4. Layer Responsibility & Work Order Distribution

### 4.1 Business Event Broker (WO-002 Business Engine)
Communication between Business Services and cross-cutting concerns (Audit, Notification, Badges, Sync) is fully decoupled via the `BusinessEventBroker`.

```
BusinessService
      │
      ▼
BusinessEventBroker ────┬──► AuditService
                        ├──► NotificationService
                        ├──► BadgeService
                        ├──► DashboardService
                        └──► SyncQueue
```

### 4.2 Presentation Engine Placement (WO-003)
Route Guard, Navigation UI, Badges, and Notifications belong strictly to the Presentation Engine:
```
Navigation ──► Route Guard ──► React Router
```

---

## 5. Frozen Work Order Breakdown

### WO-001 Business Foundation (APPROVED & FROZEN)
- `001.1` Boot Engine
- `001.2` Authentication
- `001.3` Session Manager
- `001.4` Canonical User
- `001.5` Assignment Resolver
- `001.6` Portal Resolver
- `001.7` Tenant Resolver
- `001.8` Reference Resolver
- `001.9` Identity Context
- `001.10` Security Context
- `001.11` Navigation Resolver
- `001.12` Dashboard Resolver
- `001.13` Enterprise Context
- `001.14` Guest Portal
- `001.15` Impersonation

### WO-002 Business Engine
- Business Event Broker
- Audit Logger & Audit Service
- Business Services & Domain Rules
- Authorization Policies
- Workflow Engine

### WO-003 Presentation Engine
- Route Guard & Navigation Guards
- Notification Center & Badges
- Responsive Dashboards
- Navigation Sidebar, Header & Contextual Menus
- Quick Action Panels
