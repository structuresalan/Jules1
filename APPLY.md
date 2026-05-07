# Documents Visual Map Phase 1

Replace this file:
- src/pages/Documents.tsx

Commit message:
Add visual map tab to documents

What changed:
- Keeps the existing Documents list view as-is.
- Adds a List / Visual Map toggle.
- Adds Visual Map upload for PNG/JPG/WebP plan, elevation, or site photo images.
- Adds visual board cards under the current project name.
- Lets users open a visual board into a larger full-page image view.
- Adds a right-side board details panel with a placeholder for the next phase: markers, arrows, linked documents, and hover previews.

Notes:
- This is Phase 1 foundation only.
- Visual boards are stored in localStorage for now.
- Uploaded images are limited to about 3 MB because they are stored in-browser.
- Markers/document links should be Phase 2.
