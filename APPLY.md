# Fix Firebase Auth Null Build Error

Replace this file:
- src/context/AuthContext.tsx

Commit message:
Fix Firebase auth null build error

What changed:
- Fixes TypeScript error: Auth | null is not assignable to Auth.
- Uses a local activeAuth variable after checking Firebase auth is configured.
- Keeps the single-account Firebase login behavior.
