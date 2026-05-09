# Fix Overlay Tool Event Handling

Replace/add these files:
- src/pages/VisualWorkspace.tsx

Commit message:
Fix overlay drawing pan and zoom handlers

What changed:
- Report 5 showed the overlay hooks existed but Cloud/Text/Pan/Zoom still did not change state.
- The previous overlay tried to synthesize SVG events, which was too indirect.
- The plan event layer now handles drawing, pan, and zoom directly.
- Cloud/Text/other drawing tools use overlay pointer coordinates.
- Pan updates planPan directly from overlay pointer movement.
- Zoom wheel updates planZoom directly from overlay wheel events.
- Annotation hit buttons only receive pointer events in Select/Eraser modes, so they do not block drawing tools.
