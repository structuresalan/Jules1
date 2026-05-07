# Firebase Single-Account Access

Replace/add these files:
- src/context/AuthContext.tsx
- src/context/authContextInstance.ts
- src/pages/Login.tsx
- .env.example

Commit message:
Add Firebase single account login

What changed:
- Removes the visible mock login flow.
- Login page now uses Firebase email/password authentication.
- Adds optional VITE_ALLOWED_EMAIL to restrict access to one email account.
- If Firebase is not configured, login is disabled and the page tells you to add Vercel environment variables.

Firebase setup:
1. Go to Firebase Console.
2. Create/select your project.
3. Build > Authentication > Sign-in method.
4. Enable Email/Password.
5. Authentication > Users > Add user.
6. Create one email/password account.
7. In Vercel, add the VITE_FIREBASE_* variables plus VITE_ALLOWED_EMAIL.
8. Redeploy.
