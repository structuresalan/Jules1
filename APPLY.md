# Fix Steel Required Fields Banner Flash

Replace this file:
- src/components/BeamModeler2D.tsx

Commit message:
Delay steel validation banner on page load

What changed:
- The required-fields warning no longer appears during the first split second of opening Steel Design.
- The validation banner now waits briefly until the Steel Beam workspace has initialized.
- If fields are truly missing/invalid after initialization, the warning still appears.
- Replaces the initial invalid placeholder with a professional "Loading steel beam workspace..." message during startup.
