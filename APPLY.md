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
