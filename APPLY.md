# Add Strict Visual Workspace QA Hooks

Replace/add these files:
- src/pages/VisualWorkspace.tsx
- tests/visual-workspace-tools.spec.ts

Commit message:
Add strict Visual Workspace QA hooks

What changed:
- Report 4 showed tests expected `plan-event-layer` and `annotation-hit-*`, but the running page could not find them.
- Adds a permanent HTML `plan-event-layer` overlay inside the plan viewport.
- Adds permanent HTML `annotation-hit-*` buttons overlayed on annotations.
- This avoids SVG hit-testing issues in Playwright and gives stable DOM targets.
- Keeps SVG annotations visible while HTML hit targets handle reliable selection/erase testing.
- Updates tests to fall back to SVG annotations if an HTML hit target is missing.
