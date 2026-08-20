# Security Spec: O(1) Indexing for Teachers and Students

## Data Invariants
1. A student document MUST have its `idUnik` match the Firestore document ID.
2. A teacher document MUST have its `nip` or `teachersId` match the Firestore document ID.

## The "Dirty Dozen" Payloads (Examples for Students)
1. `create student` where `idUnik` does not match the URL ID.
2. `create student` where `idUnik` is missing.
3. `create teacher` where `nip` does not match the URL ID (if `nip` is present).
4. ... (and so on)

## Test Runner (firestore.rules.test.ts)
(To be implemented in future phase, currently focus on rule updates)
