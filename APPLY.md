# Fix Visual Workspace Map Name Collision

Replace this file:
- src/pages/VisualWorkspace.tsx

Commit message:
Fix Visual Workspace Map icon collision

What changed:
- Renames the lucide-react Map icon import to MapIcon.
- Uses globalThis.Map for the graph node lookup.
- Fixes the build error where TypeScript interpreted new Map(...) as the lucide icon component.
