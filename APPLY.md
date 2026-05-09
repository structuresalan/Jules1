# Visual Marker Instant Preview and Drag Offset

Replace this file:
- src/pages/Documents.tsx

Commit message:
Improve visual marker preview and dragging

What changed:
- Pending markers now render as the actual selected marker style before pressing Save Marker.
- If you choose Arrow, Box, Cloud, Text, or a stamp preset, the pending marker preview updates immediately.
- Pending marker preview uses selected status, size, label display, arrow length, width, and height.
- Dragging no longer snaps the marker anchor to the middle of the cursor.
- Dragging preserves the offset between where you grabbed the marker and the marker's anchor point.
- This should feel more like PDF annotation tools: click/hold anywhere on the marker and it moves naturally.
