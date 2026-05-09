# Fix Tool Modes

Replace this file:
- src/pages/VisualWorkspace.tsx

Commit message:
Fix eraser select pan and zoom tool modes

What changed:
- Eraser is now a mode:
  - click Eraser
  - click the annotation to erase
  - Esc cancels back to Select
- Eraser no longer instantly deletes the selected annotation.
- Prevents the app from going blank by blocking deletion of the final remaining prototype item.
- Select now only selects and shows properties.
- Select no longer moves annotations.
- Pan is now a mode:
  - click Pan
  - hold left mouse and drag the plan view
  - Esc cancels back to Select
- Zoom is now a mode:
  - click Zoom / Zoom Area
  - use mouse wheel over the plan to zoom in/out
  - Esc cancels back to Select
- Fit resets both plan zoom and pan.
- Escape cancels active drawing, moving, resizing, panning, scaling, erasing, and zooming back to normal Select.
- Background plan text remains non-selectable.
