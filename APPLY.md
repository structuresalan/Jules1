# Fix Duplicate fieldLabel Build Error

Replace this file:
- src/components/BeamModeler2D.tsx

Commit message:
Fix duplicate steel field label helper

What changed:
- Removes the duplicate fieldLabel declaration that caused:
  TS2451: Cannot redeclare block-scoped variable 'fieldLabel'
- Keeps the optional fields defaulting to Null.
- Keeps required field validation.
