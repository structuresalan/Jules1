# Fix Visual Workspace QA Canvas Events

Replace/add these files:
- src/pages/VisualWorkspace.tsx
- tests/visual-workspace-tools.spec.ts

Commit message:
Fix Visual Workspace QA canvas event handling

What changed:
- The Playwright report showed tests were reaching the Visual Workspace, but SVG background elements intercepted clicks/drags.
- Updates the plan SVG to use pointer capture/capture-phase pointer handlers.
- Adds wheel handling directly on the SVG canvas so Zoom tests and real mouse wheel zoom are more reliable.
- Adds deterministic localStorage clearing before each QA test.
- Forces annotation clicks in tests where SVG group bounding boxes include transparent areas.
- Keeps the QA route /qa/visual-workspace from the previous package.
