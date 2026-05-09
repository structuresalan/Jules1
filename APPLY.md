# Fix Visual Workspace Annotator Core

Replace this file:
- src/pages/VisualWorkspace.tsx

Commit message:
Fix Visual Workspace annotator core interactions

What changed:
- Fixes drawing placement accuracy using SVG coordinates instead of screen rectangle guesses.
- Stops creating preset-looking markups when drawing; the drawn size/location now controls the markup.
- Cloud/Arrow/Box/Callout/Text/Highlighter/Pen/Distance/Dimension are drawn directly on the board.
- Text now creates actual text, not a text box.
- Selected markups are more defined and can be moved by selecting and dragging.
- Eraser deletes the selected markup.
- Undo and Redo now restore previous markup states.
- Color opens a color palette and applies selected color.
- Scale now starts reference-scale mode:
  - click Scale
  - drag a known reference distance
  - enter the real distance in feet
  - then Distance/Dimension uses that scale
- Grid toggles the plan grid.
- Snap toggles snap mode.
- Note opens a note editor.
- File opens an attach-file panel.
- Photo and linked photo plus open a photo picker/upload placeholder.
- View all photos opens the photo library.
- Same UI; no extra Quick Edit section or clutter.
