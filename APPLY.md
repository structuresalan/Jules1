# Make Visual Workspace Buttons Work

Replace this file:
- src/pages/VisualWorkspace.tsx

Commit message:
Make Visual Workspace controls interactive

What changed:
- Toolbar buttons now select an active tool and update the status bar.
- Workspace / Review / Report / Export tabs now have active state.
- Board search filters the board tree.
- Board folders expand/collapse.
- Board items can be selected and update the active board tab.
- Layer rows toggle on/off.
- Photo cards select the related item/photo and update the inspector/Relationship Map.
- Site Photos panel can collapse and reopen.
- Inspector panel can collapse and reopen.
- Linked count buttons in Inspector are now clickable:
  - Linked Photos selects Photos node
  - Linked Documents selects Document node
  - Board Markups selects Board Markups node
  - Linked Costs selects Cost node
- Relationship Map remains the compact Blueprint system.
- Renames Linked Markups to Board Markups for clarity.
- Relationship zoom controls update the zoom readout.
- Footer status text changes based on selected tool.
