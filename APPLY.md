# Visual Marker Drag-to-Place Preview

Replace this file:
- src/pages/Documents.tsx

Commit message:
Add visual marker drag to place preview

What changed:
- Fixes marker placement always becoming Arrow.
- Selecting Cloud/Box/Text/Pin/Arrow now preserves that selected marker type.
- Marker preview shows immediately when a marker type is selected and your cursor is over the board.
- Pending preview updates live as you change marker type/status/size.
- Click-drag placement behavior:
  - Arrow: click and drag to stretch arrow length and choose direction.
  - Box: click and drag to set width/height.
  - Cloud: click and drag to set width/height.
  - Text: click and drag to set width/height.
- Existing marker drag behavior remains.
