# Clean Visual Workspace Structure

Replace/add these files:
- src/pages/Documents.tsx
- src/pages/VisualWorkspace.tsx

Commit message:
Clean up Documents and improve Visual Workspace guidance

What changed:
- Removes the old Visual Map from Documents.
- Documents is now only saved calculation reports, print outputs, and exports.
- Adds an Open Visual Workspace button from Documents.
- Keeps Visual Workspace as the only place for visual maps, boards, PDF annotation, measurements, photos, nodes, schedules, and costs.
- Adds a simple 4-step Visual Workspace guide:
  1. Create Items
  2. Upload Boards
  3. Markup + Measure
  4. Link Everything
- Adds direct drag-to-move for existing Visual Workspace annotations when Select is active.
- Keeps the dropdown-based annotation tools and cleaner Visual Workspace layout.
