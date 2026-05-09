# Visual Workspace Mockup Fullscreen

Replace/add these files:
- src/pages/VisualWorkspace.tsx
- src/layouts/MainLayout.tsx
- src/pages/Documents.tsx

Commit message:
Make Visual Workspace match CAD inspection mockup

What changed:
- Visual Workspace / Boards now opens as a full-screen CAD/PDF workspace instead of a normal webpage card.
- Removes the normal project header/max-width wrapper for /visual-workspace so the canvas can use the full browser area.
- Adds a dark top application bar and command ribbon similar to the mockup:
  - Workspace / Review / Report / Export
  - Select, Pan, Zoom
  - Arrow, Cloud, Text, Box, Dimension, Measure
  - Note, Photo, File, Link
  - Layers, Scale, Grid, Snap
  - Undo, Redo
- Adds dark left sidebar:
  - Boards tree
  - Layers list
  - Scale readout
- Adds central drawing canvas with tab header and zoom controls.
- Adds right Site Photos panel.
- Adds right Inspector panel with selected item details, linked photos/costs/documents/markups, and notes.
- Adds bottom Items / Markup Schedule.
- Adds bottom Relationship Map showing selected item connected to marker, photos, and cost.
- Keeps Load Demo Workspace so you can instantly populate the interface.
- Documents stays cleaned up with the old Visual Map removed.
