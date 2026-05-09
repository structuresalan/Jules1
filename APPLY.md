# Visual Marker Dropdown and Stretch Controls

Replace this file:
- src/pages/Documents.tsx

Commit message:
Add visual marker dropdown and stretch controls

What changed:
- Markup tab marker tools are now simplified into a dropdown instead of many marker buttons.
- Stamp presets are now a dropdown instead of separate buttons.
- Arrow markers now have an adjustable length slider.
- Box, Cloud, and Text markers now have adjustable width and height sliders.
- Saved markers now preserve custom arrow length / marker width / marker height.
- Selected marker inspector shows the current marker dimensions.
- Existing markers still work and fall back to their default size.
