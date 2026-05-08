# Visual Map PDF-Style Tools

Replace this file:
- src/pages/Documents.tsx

Commit message:
Add visual map PDF style tools

What changed:
- Adds expanded Visual Map tabs: Markup, Documents, Measure, View, Review, Settings.
- Keeps direct marker dragging and adds PDF-style shortcuts:
  - double-click marker to edit
  - Delete/Backspace removes selected marker
  - Escape cancels current action
- Adds quick Markup buttons for Arrow, Pin, Box, Cloud, and Text.
- Adds structural stamp presets:
  - PASS
  - REVIEW
  - FAIL
  - FIELD VERIFY
  - TYP.
  - SEE CALC
  - REVISED
  - VOID
- Adds Measure tab:
  - measure length by clicking two points
  - optional actual length in feet
  - measurement overlays on the board
  - measurement list in inspector
- Adds View tab controls:
  - zoom in
  - zoom out
  - reset zoom
  - label display override
  - status filters
- Adds Review tab:
  - marker schedule
  - CSV export of marker schedule
- Adds board notes in Settings.
- Adds board-level measurement cleanup when deleting a board.

Notes:
- This is still localStorage-based.
- This is a large usability upgrade; markers/documents remain compatible with prior versions.
