# Fix Visual Marker Text Narrowing Build Error

Replace this file:
- src/pages/Documents.tsx

Commit message:
Fix visual marker stretch type check

What changed:
- Fixes TS2367 caused by checking markerStyle === 'Text' inside a Box/Cloud-only branch.
- Keeps marker type dropdown.
- Keeps stretch controls:
  - Arrow length
  - Box width/height
  - Cloud width/height
  - Text width/height
