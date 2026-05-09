# Visual Workspace Layout Cleanup

Replace/add these files:
- src/pages/VisualWorkspace.tsx
- src/pages/Documents.tsx

Commit message:
Improve Visual Workspace canvas layout

What changed:
- Fixes cramped Boards and Graph layouts by turning them into larger workspace shells.
- Boards now has:
  - top toolbar for opening/closing Boards and Inspector panels
  - zoom controls
  - collapsible board library
  - collapsible inspector
  - a larger canvas-first layout
  - bottom status bar
- Graph now has:
  - top toolbar for opening/closing Node Library and Inspector
  - graph zoom controls
  - collapsible node library
  - collapsible node inspector
  - larger blueprint canvas
  - curved wires and node pins remain
- The 4-step guide is now collapsed under a compact Getting Started panel so it does not take up workspace room.
- Documents remains cleaned up with the old Visual Map removed.
