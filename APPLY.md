# Visual Map Mouse Drag Markers

Replace this file:
- src/pages/Documents.tsx

Commit message:
Add mouse drag marker repositioning

What changed:
- Visual Map markers can now be repositioned directly with mouse drag, without pressing Move first.
- Dragging works like a PDF annotation tool: click and drag a marker to a new location.
- Keeps the older click-to-move button as an optional fallback.
- Updates the Markup ribbon to emphasize direct mouse dragging and reduce button clutter.
- Adds grabbing cursor feedback while dragging.
