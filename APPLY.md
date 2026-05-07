# Optional Steel Fields Default to ~

Replace this file:
- src/components/BeamModeler2D.tsx

Commit message:
Change optional steel defaults to tilde

What changed:
- Optional Steel Beam fields now use ~ instead of Null.
- Optional dropdowns now start with ~.
- Optional numeric fields start blank and show ~ in reports/output until changed.
- Required fields still use * and still block calculations if missing/invalid.
- Optional fields still do not block calculations.
