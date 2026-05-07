# Fix Steel Page Print Report Flash

Replace this file:
- src/components/BeamModeler2D.tsx

Commit message:
Prevent steel print report flash

What changed:
- The hidden printable steel report now has an inline display:none guard.
- The screen CSS also uses display:none !important for the print-only report container.
- The print media CSS still shows the report when printing.
- This prevents the hidden report/output content from flashing for a split second when navigating to Steel Design.
