# Documents Visual Map Phase 2

Replace this file:
- src/pages/Documents.tsx

Commit message:
Add visual map markers and document links

What changed:
- Adds markers to Visual Map boards.
- Users can click Add Marker, then click directly on the uploaded plan/photo to place it.
- New marker form lets users enter a label, choose a saved document, and add notes.
- Markers appear on the board as labeled pins.
- Hovering a marker shows the linked document preview, including beam preview for steel beam documents.
- Clicking a marker opens a side panel with the linked document, notes, Open/Edit, Print, and Delete Marker actions.
- Visual board cards now show linked document counts based on markers.
- Deleting a visual board also deletes its markers.

Notes:
- This is still localStorage-based.
- Marker positions are stored as percentages so they stay aligned as the image scales.
- This supports one document per marker for now. Multi-document markers can come in Phase 3.
