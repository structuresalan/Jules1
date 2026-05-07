# Steel Section Search Suggestions

Replace this file:
- src/components/BeamModeler2D.tsx

Commit message:
Add steel section search suggestions

What changed:
- Search section now shows close suggested sections.
- Typing a partial section like W8X5 no longer silently changes the selected section.
- The user must click a suggestion or choose a section from the dropdown to actually change the selected section.
- Exact matches are shown clearly.
- Suggestions are sorted by closeness:
  1. Exact match
  2. Prefix match
  3. Contains match
  4. Natural numeric sort
