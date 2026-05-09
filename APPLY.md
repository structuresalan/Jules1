# Fix SVG Interaction Layer for QA and Board Tools

Replace/add these files:
- src/pages/VisualWorkspace.tsx
- tests/visual-workspace-tools.spec.ts

Commit message:
Fix SVG interaction layer for Visual Workspace tools

What changed:
- Third Playwright report showed the SVG background still intercepted clicks and drawing events.
- Makes static plan geometry non-interactive.
- Adds a transparent plan event layer for drawing, panning, and zooming modes.
- Adds dedicated transparent annotation hit targets:
  - annotation-hit-1
  - annotation-hit-2
  - etc.
- Updates tests to count only real annotation groups, not hit targets.
- Updates tests to use annotation hit targets for reliable selection/erasing.
- Updates canvas drag tests to use the event layer.
