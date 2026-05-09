<<<<<<< HEAD
# Visual Marker Dropdown and Stretch Controls

Replace this file:
- src/pages/Documents.tsx

Commit message:
Add visual marker dropdown and stretch controls

What changed:
- Markup tab marker tools are now simplified into a dropdown instead of many marker buttons.
- Stamp presets are now a dropdown instead of separate buttons.
- Arrow markers now have an adjustable length slider.
- Box, Cloud, and Text markers now have adjustable width and height sliders.
- Saved markers now preserve custom arrow length / marker width / marker height.
- Selected marker inspector shows the current marker dimensions.
- Existing markers still work and fall back to their default size.
=======
# Desktop Glass Website Style

Replace/add these files:

- src/App.tsx
- src/layouts/MainLayout.tsx
- src/pages/Login.tsx
- src/pages/Dashboard.tsx
- src/pages/SettingsPage.tsx
- src/utils/websiteStyle.ts
- src/styles/websiteTheme.css
- src/pages/Documents.tsx

Commit message:
Add desktop glass website style

What changed:
- Adds a website style system saved in localStorage.
- Default style is Desktop Dark + Glass.
- Settings page now has Website Style options:
  - Classic
  - Desktop Dark
  - Desktop Dark + Glass
- Adds Accent Color and Density options.
- Adds Fireflies-inspired dark glass styling:
  - dark background
  - blurred glow gradients
  - glass sidebar and panels
  - rounded desktop-window feel
- Updates login page to the desktop dark/glass style.
- Updates main app shell/sidebar to the desktop dark/glass style.
- Updates dashboard cards to the desktop dark/glass style.
- Keeps Classic style available if you want the original light interface.
- Includes the latest Visual Map PDF-style tools file.
>>>>>>> c174f6990a60bedccf5cdf150c02b2425172e477
