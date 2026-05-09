# Visual Workspace All-In-One

Replace/add these files:

- src/App.tsx
- src/layouts/MainLayout.tsx
- src/pages/VisualWorkspace.tsx
- src/pages/Documents.tsx
- src/pages/SettingsPage.tsx
- src/pages/Login.tsx
- src/pages/Dashboard.tsx
- src/utils/websiteStyle.ts
- src/styles/websiteTheme.css

Commit message:
Add Visual Workspace all-in-one

What changed:
- Adds Visual Workspace as its own main sidebar tab.
- Adds a new /visual-workspace route.
- Keeps Documents as saved calculation documents/reports.
- Adds Visual Workspace sub-tabs:
  - Boards
  - Items
  - Photos
  - Graph
  - Schedule
  - Costs
- Boards tab:
  - Upload plans, elevations, site photos, or PDFs.
  - Annotate with Select, Arrow, Line, Box, Cloud, Highlight, Text, Stamp, Count.
  - Add Reference, Length, Perimeter, and Area measurements.
  - Link annotations to project items.
  - Hover annotation cards can show linked item photos.
  - Export annotations CSV.
- Items tab:
  - Create Beam, Column, Header, Footing, Wall, Connection, Opening, Repair Area, and General Note items.
  - Link items to annotations, photos, and costs.
- Photos tab:
  - Upload real site/member photos and link them to items.
- Graph tab:
  - Unreal-style node view for Items, Boards, Annotations, Photos, and Cost lines.
  - Auto-generated links appear when annotations/photos/costs are linked to items.
  - Manual node links can be added.
  - Nodes can be dragged around.
- Schedule tab:
  - Table/index of all items with linked annotations, photos, and cost totals.
  - Export CSV.
- Costs tab:
  - Lightweight structural quantity/cost helper linked to project items.
- Includes the latest Documents.tsx marker workflow improvements.
