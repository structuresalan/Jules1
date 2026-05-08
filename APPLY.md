# Visual Map Toolbar Tabs

Replace this file:
- src/pages/Documents.tsx

Commit message:
Add visual map toolbar tabs

What changed:
- Adds an Autodesk-style ribbon area to opened Visual Map boards.
- Adds board-level tabs:
  - Markup
  - Documents
  - View
  - Settings
- Moves Add Marker and Move Selected into the Markup tab.
- Adds a Documents tab with linked-document context and Open Primary action.
- Adds a View tab placeholder for future zoom, pan, fit-to-screen, filters, and label controls.
- Adds a Settings tab with board information and Delete Board.
- Keeps the right panel as an inspector for selected markers and board status.
- Keeps existing marker editing, moving, multi-document links, and status colors.
