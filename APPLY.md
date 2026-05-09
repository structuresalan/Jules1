# Add Visual Workspace QA Harness

Replace/add these files:
- src/pages/VisualWorkspace.tsx
- playwright.config.ts
- tests/visual-workspace-tools.spec.ts
- tests/README.md
- package-json-additions.md

Commit message:
Add Visual Workspace Playwright QA harness

What changed:
- Adds stable data-testid hooks to VisualWorkspace.
- Adds Playwright browser tests for toolbar and board interactions.
- Adds tests for:
  - Select
  - Cloud
  - Text
  - Eraser
  - Escape cancel
  - Pan
  - Fit
  - Zoom wheel
  - Color palette
  - Photo/File panels
  - View all photos
  - Distance blocked before scale
- Adds Playwright config.
- Adds setup instructions because this patch zip does not include the root package.json.
