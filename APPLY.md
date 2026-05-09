# Visual Workspace Full Working Prototype Foundation

Replace/add these files:
- src/pages/VisualWorkspace.tsx
- supabase/visual_workspace_schema.sql

Commit message:
Make Visual Workspace a working prototype foundation

What changed:
- Adds local persistence through localStorage for:
  - markups/items
  - photos
  - comments
  - documents
  - current role
- Adds Engineer / Client role behavior:
  - Engineer can edit everything
  - Client can comment only
- Toolbar buttons now perform prototype actions:
  - Arrow / Cloud / Text / Box / Callout / Dimension / Distance / Angle / Area add new markups
  - Photo attaches a demo photo
  - File attaches a demo document
  - Link focuses the Relationship Map
  - Undo / Redo show prototype feedback
- Report tab opens a report builder panel.
- Export tab opens export options.
- Export supports prototype downloads:
  - PDF text draft
  - Word .doc draft
  - CSV issue schedule
- Inspector now has working quick edits:
  - cycle status
  - cycle priority
  - save condition/note
- Comments now work:
  - engineers and clients can add comments
  - engineers can resolve/reopen comments
- Linked count buttons work:
  - Linked Photos
  - Linked Documents
  - Board Markups
  - Linked Costs
- Board tree, layers, panels, photos, schedule, relationship map stay interactive.
- Adds Supabase SQL schema foundation with:
  - projects
  - project_members
  - boards
  - project_items
  - markups
  - site_photos
  - documents
  - comments
  - cost_items
  - relationships
  - report_exports
- Adds Row Level Security concept:
  - owners/engineers edit
  - clients can comment
  - project members can read
