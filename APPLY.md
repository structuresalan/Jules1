# Required and Optional Steel Fields

Replace/add these files:
- src/components/BeamModeler2D.tsx
- src/data/aisc/shapes_w.json
- src/utils/reportHeaderDefaults.ts

Commit message:
Add required optional steel field validation

What changed:
- Adds a red * to required Steel Beam fields.
- Adds (optional) labels to workflow/report fields like member type, material type, design rule, search, sway, seismic, and some stability/reporting fields.
- Adds a validation banner listing missing/invalid required fields.
- Diagrams/results do not run until required fields are valid.
- Save Output, Preview Output, and Print Output are disabled until required fields are valid.
- Optional fields do not block calculations.

Required fields currently include:
- Method
- Selected section
- Fy
- Unbraced Lb
- Internal sections
- At least two nodes
- Positive beam length
- At least two supports
- Live and total deflection limits
- Ky-y / Kz-z
- Lb y-y / Lb z-z
- Valid load factors
