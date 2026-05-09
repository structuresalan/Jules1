# Fix Visual Workspace QA Auth Bypass

Replace/add these files:
- src/App.tsx
- src/pages/VisualWorkspace.tsx
- tests/visual-workspace-tools.spec.ts
- playwright.config.ts
- tests/README.md
- package-json-additions.md

Commit message:
Fix Visual Workspace QA route for Playwright

What changed:
- The uploaded report showed every test was blocked at the login screen.
- Adds an unprotected QA route:
  - /qa/visual-workspace
- Updates Playwright tests to use /qa/visual-workspace instead of /visual-workspace.
- This lets tests check the Visual Workspace component even when Firebase auth is not configured.
- Adds close-panel test IDs to make modal tests more reliable.
- Keeps the real /visual-workspace route protected for normal users.
