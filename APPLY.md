# Polish Annotator Workflow and Selection Controls

Replace this file:
- src/pages/VisualWorkspace.tsx

Commit message:
Polish annotator selection and editing workflow

What changed:
- Keeps the current UI; does not add new panels.
- Improves selection behavior:
  - clearer selected markup outline
  - visible corner handles
  - black bottom-right resize handle
- Adds drag-to-move for selected markups in Select mode.
- Adds drag-to-resize for cloud/box/highlight/text/callout style markups.
- Adds keyboard controls:
  - Escape cancels active drawing/move/resize and returns to Select
  - Delete/Backspace removes selected markup in Select mode
- Improves move/resize coordinate handling using SVG coordinates.
- Makes pointer release outside the drawing still finish the action.
- Refines status text so users know what Select does.
- Keeps scale, color, undo/redo, photo, file, note, and existing tool behavior from the last package.
