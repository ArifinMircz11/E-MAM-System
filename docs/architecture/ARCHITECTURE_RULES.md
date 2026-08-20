# ARCHITECTURE_RULES

1. No duplicate logic.
2. All CRUD operations go through Dexie (Operational DB).
3. Firestore is only used for synchronization and cloud backup.
4. Authorization logic must be handled via AuthorizationService.
5. All UI must be presentational only, no direct database or role-checking logic.
