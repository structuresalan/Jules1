# Remove Steel Page Layout Shift

Replace this file:
- src/components/BeamModeler2D.tsx

Commit message:
Remove steel page layout shift on load

What changed:
- The main beam diagram area now renders immediately instead of swapping from a placeholder into the beam figure.
- Removes the top required-fields banner that could insert itself into the page after a delay.
- Required-field validation still exists through disabled Save/Preview/Print buttons and detailed validation logic.
- This should stop the quick page adjustment/flash when opening Steel Design from the dashboard.
