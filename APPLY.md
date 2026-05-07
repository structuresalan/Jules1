# Documents Visual Map Multi-Document Markers

Replace this file:
- src/pages/Documents.tsx

Commit message:
Add multi document visual map markers

What changed:
- A Visual Map marker can now link to multiple saved documents.
- Marker create/edit form now shows a checklist of saved documents instead of a single dropdown.
- Marker side panel shows every linked document with Open/Edit and Print actions.
- Marker hover preview shows the primary linked document and indicates when more documents are linked.
- Marker list and marker pin show when multiple documents are linked.
- Board card linked document counts now count unique linked documents across all markers.
- Existing Phase 2/3 markers still work because documentId is preserved as the primary document and documentIds is optional.

Notes:
- One marker can now represent a beam/location with beam design, connection check, deflection check, and field note.
- This is still localStorage-based.
