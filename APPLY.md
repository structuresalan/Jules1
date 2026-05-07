# Optional Steel Fields Default to Null

Replace/add these files:
- src/components/BeamModeler2D.tsx
- src/data/aisc/shapes_w.json
- src/utils/reportHeaderDefaults.ts

Commit message:
Default optional steel fields to null

What changed:
- Optional Steel Beam fields now start as Null instead of a design-looking default.
- Optional dropdowns now include a Null option.
- Optional numeric fields start blank and show Null in reports/output until changed.
- Required fields still block calculations if missing/invalid.
- Optional fields still do not block calculations.

Optional fields defaulting to Null include:
- Member type
- Material type
- Design rule
- Shape family filter
- Lcomp top
- Lcomp bottom
- Ltorque
- y sway
- z sway
- Seismic design rule
