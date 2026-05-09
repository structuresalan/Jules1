# Implement Relationship Map Blueprints

Replace this file:
- src/pages/VisualWorkspace.tsx

Commit message:
Make Relationship Map interactive

What changed:
- Keeps the Relationship Map as the compact Blueprint system instead of scrapping it.
- Makes Relationship Map nodes data-driven from the selected markup/item.
- Adds interactive Blueprint nodes:
  - Plan Marker
  - Project Item
  - Site Photos
  - Linked Markups
  - Cost Item
  - Document
- Adds curved relationship wires with labels.
- Clicking a node now shows node details in a Blueprint Node inspector inside the Relationship Map.
- Clicking rows/photos/plan markers updates the selected item and relationship map.
- Inspector linked counts now update from selected item data.
- This creates the foundation for a future full-screen Blueprint Graph while keeping everything visible on the board page.
