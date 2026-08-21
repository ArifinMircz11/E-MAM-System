# Canonical User Runtime Contract

## Decision

A Firebase-authenticated account is a registered application user only when `users/{uid}` exists and its canonical identity can be resolved. `referenceId` is the canonical pointer to the domain identity document.

- No implicit default user.
- No Firebase UID fallback for `referenceId` or `idUnik`.
- `tamu` is only for an authenticated account that has no valid registered canonical user mapping.
- A valid `referenceId` must resolve directly to `students/{referenceId}` or `teachers/{referenceId}` according to the canonical account contract.
- A valid canonical user must not be sent to `guest_dashboard` because `studentsId`/`teachersId` compatibility fields are absent.
- Existing canonical `referenceId` must not trigger an identity/reference input form.
- `tenantId`, `accountType`, `role`, `roles`, and `status` come from the canonical user contract; they are never inferred from UI state.

## Runtime proof cases

1. Auth + `users/{uid}` + valid `referenceId` + domain document => registered user.
2. Auth + no `users/{uid}` => guest/registration flow.
3. Auth + user document + invalid/missing `referenceId` => guest/registration flow.
4. Valid `referenceId` => resolve domain document directly without asking for reference input again.
