# AISC Shape Database Loader

Replace/add these files:
- src/components/BeamModeler2D.tsx
- src/data/aisc/shapes_w.json
- src/utils/reportHeaderDefaults.ts

Commit message:
Load expanded AISC steel shape database

What changed:
- Steel Beam Design now loads an expanded AISC Shapes CSV database at runtime.
- Adds a shape-family filter:
  W, M, S, HP, C, MC, WT, MT, ST, L, 2L, HSS, PIPE, and All.
- Adds section search.
- Shows the active database source and number of sections loaded.
- Keeps the old local W-shape seed as a fallback if the CSV cannot load.
- Saves/restores the selected shape family with project documents.

Notes:
- The runtime CSV source is the MIT-licensed ambaker1/aisc-csv v15.0 processed CSV.
- The official AISC v16.0 spreadsheet is still the authoritative current database, but the app cannot parse XLSX in-browser without adding a spreadsheet parser.
- HSS/angles/channels can now be selected, but the current beam design checks are still preliminary and primarily flexure/shear/deflection based. Dedicated HSS/angle/local buckling checks should be added separately.
