# Visual Map Marker Status Colors

Replace this file:
- src/pages/Documents.tsx

Commit message:
Add visual map marker status colors

What changed:
- Adds marker statuses:
  - Unknown
  - Draft
  - Pass
  - Review
  - Fail
- Marker create/edit form now includes a Status dropdown.
- Visual Map markers are color-coded by status:
  - Pass = green
  - Review = amber
  - Fail = red
  - Draft = gray
  - Unknown = blue
- Marker side panel shows status.
- Marker hover preview shows status.
- Marker list shows status badges.
- Visual board cards show the board’s primary status and a small status summary.
- Visual board detail panel shows counts for each status.

Existing markers default to Unknown until edited.
