# Security Specification & Test Matrix

## Data Invariants
1. A user can only read, create, update, or delete documents under `/users/{userId}` where `request.auth.uid == userId`.
2. All writes to `/users/{userId}/userData/{docId}` must match the authenticated `request.auth.uid`.
3. Document IDs and User IDs must pass `isValidId` string constraints to avoid injection.

## Dirty Dozen Payloads & Invariants
1. Unauthenticated read/write to `/users/{userId}` -> PERMISSION_DENIED
2. User A reading/writing `/users/UserB/userData/state` -> PERMISSION_DENIED
3. User setting `userId` in payload different from `request.auth.uid` -> PERMISSION_DENIED
4. Oversized malicious payload injection (>128 chars id) -> PERMISSION_DENIED
5. User trying to write to non-existent root collection -> PERMISSION_DENIED
