# Fix Select Versus Move Behavior

Replace this file:
- src/pages/VisualWorkspace.tsx

Commit message:
Fix annotation select versus move behavior

What changed:
- A simple click now selects a markup and updates the Inspector/properties.
- A markup only moves after an intentional drag threshold.
- This prevents accidental movement when users only wanted to select.
- Prevents browser/SVG text selection on the background plan.
- Background plan labels no longer highlight blue when selecting or dragging annotations.
- Move/resize undo history now stores the state before the move/resize.
