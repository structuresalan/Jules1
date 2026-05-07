# Account Creation and Sign Out

Replace/add these files:
- src/firebase.ts
- src/context/AuthContext.tsx
- src/context/authContextInstance.ts
- src/pages/Login.tsx
- src/pages/ProjectHome.tsx

Commit message:
Add account creation and project sign out

What changed:
- Login page now has two tabs:
  - Sign in
  - Create account
- Create account uses Firebase Email/Password authentication.
- If VITE_ALLOWED_EMAIL is set, only that exact email can create an account.
- Project homepage now shows the signed-in email.
- Project homepage now has a Sign Out button.
- Sidebar sign out remains available on the inner app pages.

Important:
- In Firebase Authentication > Sign-in method, Email/Password must be enabled.
- Keep all VITE_FIREBASE_* variables in Vercel.
- Keep VITE_ALLOWED_EMAIL if you still want only one approved account.
