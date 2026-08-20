# ADR 004: Centralized Authorization Service

**Status:** Accepted
**Date:** 2026-07-10
**Decision Owner:** Architecture Team
**Related ADR:** None
**Supersedes:** None
**Affected Components:** UI Layer, AuthorizationService

**Context:** Components scattered `role === UserRole.ADMIN` checks, leading to hard-to-maintain role-based access control.
**Decision:** All authorization checks must go through `AuthorizationService.can(PERMISSION)`. UI should not make decisions based on roles directly.
**Consequences:** Centralized RBAC, decoupling UI from role definitions, easier permission updates.
