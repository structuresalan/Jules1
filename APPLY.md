# Visual Workspace AutoCAD + Blueprint Usability Upgrade

Replace/add these files:
- src/pages/VisualWorkspace.tsx
- src/pages/Documents.tsx

Commit message:
Improve Visual Workspace AutoCAD and Blueprint usability

What changed:
- Keeps the old Visual Map removed from Documents.
- Documents remains only saved calculation reports and exports.
- Adds a Load Demo Workspace button so you can understand the intended final workflow.
- Adds AutoCAD-style board ribbon groups:
  - Select + Markup
  - Measure
  - Link + Status
  - Options
- Replaces the generic Clear Action button with:
  - active tool status/instruction bar
  - Cancel pill only when an action is active
  - Esc cancel
  - right-click cancel
  - Enter finish for perimeter/area
  - double-click finish for perimeter/area
  - Delete removes selected markup
- Improves Blueprint Graph:
  - left node library
  - center blueprint canvas
  - right node inspector
  - curved node wires
  - attachment pins on nodes
  - selected node highlighting
  - Open Board / Open Item / Open Photos / Open Costs / Open Board Markup actions
- Nodes now display attachment slots for markers, photos, costs, issues, annotations, and measurements.
- Demo workspace creates:
  - Beam B12
  - Column C4
  - Repair Area R1
  - demo framing plan board
  - Beam B12 marker
  - field verify cloud
  - measurement
  - linked site photo
  - linked cost line
  - graph relationships
