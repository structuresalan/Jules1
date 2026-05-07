# Fix Login Kickout with Invite-Code Signup

Replace/add these files:
- src/context/AuthContext.tsx
- src/pages/Login.tsx
- .env.example

Commit message:
Fix invite code login persistence

What changed:
- Invite code is now used only for creating new accounts.
- Existing Firebase users can sign in normally.
- Removed the old VITE_ALLOWED_EMAIL enforcement from login/auth state.
- This prevents the app from signing a user in for a second and then kicking them back to /login.
- Login page no longer pre-fills the old allowed email variable.

Vercel setup:
- Keep all VITE_FIREBASE_* variables.
- Keep VITE_SIGNUP_INVITE_CODE.
- Delete VITE_ALLOWED_EMAIL or leave it; this code no longer uses it.
- Redeploy after pushing.
