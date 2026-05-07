# Reserve Steel Result Diagram Space

Replace this file:
- src/components/BeamModeler2D.tsx

Commit message:
Reserve steel result diagram space

What changed:
- The moment/shear/deflection result diagram area now reserves space from the first render.
- This prevents the lower Steel Beam input/selected-section area from dropping down after the async steel database and validation state settle.
- No yellow warning box, no loading overlay, and no placeholder text is shown in the reserved area.
- The result diagrams still appear normally once calculations are ready.
