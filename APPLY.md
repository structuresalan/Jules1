# Fix Visual Marker Status Duplicate Property

Replace this file:
- src/pages/Documents.tsx

Commit message:
Fix visual marker status duplicate property

What changed:
- Removes the duplicate status property that caused TS1117.
- Keeps Visual Map marker status colors.
- Ensures marker status is saved when editing a marker.
