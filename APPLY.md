# Fix Unused Geometry Build Error

Replace this file:
- src/pages/VisualWorkspace.tsx

Commit message:
Fix unused geometry parameter

What changed:
- Removes the unused geometry parameter from selectionHandles.
- Updates selectionHandles calls.
- Fixes TS6133 build error.
