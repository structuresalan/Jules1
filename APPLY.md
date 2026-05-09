# Simplify Visual Workspace Controls

Replace this file:
- src/pages/VisualWorkspace.tsx

Commit message:
Simplify Visual Workspace inspector controls

What changed:
- Removes the extra Quick Edit section.
- Keeps the UI visually the same.
- Makes existing Inspector fields work directly:
  - click Status to cycle Field Verify / Monitor / Complete
  - click Priority to cycle High / Medium / Low
  - click Condition to edit condition/note
  - click Notes or pencil to edit note
- Keeps Engineer / Client behavior:
  - Engineer can edit
  - Client can comment only
- Makes a few existing toolbar controls act without adding new UI:
  - Color cycles selected markup color
  - Eraser removes selected markup
  - More opens settings
  - Scale/Grid/Snap/Layers show feedback
- Does not add new visible sections or extra complexity.
