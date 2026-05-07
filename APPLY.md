# Remove Yellow Steel Loading Flash

Replace this file:
- src/components/BeamModeler2D.tsx

Commit message:
Remove yellow steel loading overlay flash

What changed:
- Removes the yellow "Results and diagrams are paused..." box from the beam figure area.
- The beam diagram area now shows a neutral loading placeholder if results are not ready.
- Delays the top required-fields validation banner longer so it does not flash during navigation.
- Required-field validation still exists, but it should no longer flash as a yellow overlay over the beam figure when opening Steel Design.
