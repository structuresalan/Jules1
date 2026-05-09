# Exact Mockup Visual Workspace

Replace/add these files:
- src/pages/VisualWorkspace.tsx
- src/layouts/MainLayout.tsx

Commit message:
Rebuild Visual Workspace to match inspection mockup

What changed:
- Replaces the previous basic Visual Workspace UI with a dense full-screen CAD/PDF inspection workspace.
- All primary information is visible on one page, not hidden behind tabs:
  - dark SimplifyStruct top chrome
  - premium command ribbon
  - left project/boards tree
  - left layers panel
  - central structural framing plan
  - colored structural issue markups
  - right Site Photos panel
  - right Inspector panel
  - bottom Items / Markup Schedule
  - bottom Relationship Map
  - bottom status bar
- Includes realistic fake structural plan data:
  - Beam B12
  - Beam B18
  - Beam B31
  - Column C16
  - Beam B7
- Includes fake deteriorated structural steel photo cards generated as inline SVGs:
  - corrosion at seat connection
  - rust scale / peeling paint
  - section loss
- Inspector now uses clean aligned rows, status chips, linked counts, linked photos, notes, and issue details.
- Relationship Map is clearly visible at bottom right.
- Schedule is styled to match the mockup more closely.
- This version prioritizes matching the generated mockup exactly over preserving the previous tabbed workflow.
