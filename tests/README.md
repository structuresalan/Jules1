# Visual Workspace QA Harness

This test suite uses Playwright to run the Visual Workspace in a real browser through `/qa/visual-workspace` and check toolbar behavior.

## Setup

```bash
npm install -D @playwright/test
npx playwright install chromium
```

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

## Run

```bash
npm run test:e2e
```

## What it checks

- Select only selects and does not accidentally move
- Cloud creates an annotation from drag
- Text creates real text
- Eraser is a click-to-erase mode
- Escape cancels active tools
- Pan moves the plan
- Fit resets pan/zoom
- Zoom responds to mouse wheel
- Color opens the palette
- Photo/File/Note panels open
- View all photos opens the photo library
- Distance is blocked until scale is set

## Debug visually

```bash
npm run test:e2e:ui
```

This opens the Playwright UI so you can watch each test step.


## Auth note

The normal `/visual-workspace` route is protected by Firebase auth. The tests use `/qa/visual-workspace`, an unprotected QA-only route, so the tool suite can run even when Firebase is not configured locally.
