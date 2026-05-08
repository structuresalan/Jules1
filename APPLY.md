# Visual Map Marker Style Upgrade

Replace this file:
- src/pages/Documents.tsx

Commit message:
Add visual map marker style upgrade

What changed:
- Upgrades Arrow markers into transparent engineering-style leader callouts with longer shafts and larger arrowheads.
- Removes the extra dot from Arrow markers.
- Adds new marker styles:
  - Arrow
  - Pin
  - Box
  - Cloud
  - Text
- Adds marker size options:
  - Small
  - Medium
  - Large
- Adds label display options:
  - Always
  - Hover only
- Applies status color to the actual marker/callout.
- Updates the selected marker inspector, marker list, and hover card to reflect the new style/size behavior.
