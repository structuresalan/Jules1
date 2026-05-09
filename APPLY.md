# Visual Map AutoCAD + PDF Annotator Measurement Tools

Replace this file:
- src/pages/Documents.tsx

Commit message:
Add AutoCAD style visual map measurements

What changed:
- Removes the Review tab.
- Adds an AutoCAD-like fixed ribbon tab view:
  - Home
  - Markup
  - Documents
  - Measure
  - View
  - Settings
- The ribbon has a fixed height so the plan/photo board no longer jumps when switching tabs.
- Removes separate action banners that pushed the board down.
- Adds reference-scale measurement:
  - choose Reference
  - enter known length in feet
  - click two points
- Adds measurement tools:
  - Length
  - Perimeter
  - Area
- Measurements use the reference scale when available.
- Without a reference scale, measurements show board-percent units.
- Adds pending measurement point preview.
- Adds a small visual board thumbnail to marker hover cards with a dot showing marker location.
- Keeps marker dropdown, stamp dropdown, arrow stretching, marker resizing, and direct marker dragging.
