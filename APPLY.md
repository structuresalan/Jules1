# Documents Visual Map Phase 3

Replace this file:
- src/pages/Documents.tsx

Commit message:
Add visual map marker editing and arrows

What changed:
- Adds marker editing:
  - Edit marker label
  - Change linked document
  - Edit notes
  - Change marker style
  - Change marker direction
- Adds marker moving:
  - Select marker
  - Click Move
  - Click the new location on the plan/photo
- Adds marker styles:
  - Pin
  - Arrow
- Adds marker directions:
  - Up
  - Down
  - Left
  - Right
- Improves marker list and hover preview to show marker style/direction.
- Existing Phase 2 markers still work. If they do not have style/direction saved yet, they default to Pin / Down.

Notes:
- This is still localStorage-based.
- One document per marker remains the current behavior.
- Multi-document markers and cloud storage can come later.
