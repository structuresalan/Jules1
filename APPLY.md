# Make Visual Workspace Board Tools Work

Replace this file:
- src/pages/VisualWorkspace.tsx

Commit message:
Make Visual Workspace board tools interactive

What changed:
- Keeps the same UI.
- Makes plan tools work directly on the board:
  - Cloud: click-drag to draw a review cloud/note
  - Arrow: click-drag to create a callout-style note
  - Box: click-drag to create a boxed markup
  - Text / Callout: click-drag to create a note box
  - Highlighter: click-drag to highlight a region
  - Pen: click-drag to sketch a freehand line
  - Distance / Dimension: click-drag two points to create a measurement
- New markups get numbered automatically.
- Clicking a markup selects it and updates the Inspector, schedule, photos, and Relationship Map.
- Zoom / Zoom Area zooms into the plan.
- Fit resets plan zoom.
- View all photos opens a photo library modal.
- No new clutter or extra panels added.
