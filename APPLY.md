# Invite Code Signup

Replace/add these files:
- src/context/AuthContext.tsx
- src/context/authContextInstance.ts
- src/pages/Login.tsx
- .env.example

Commit message:
Add invite code signup

What changed:
- Create Account now asks for a Signup code.
- Any email can create an account if VITE_ALLOWED_EMAIL is blank or deleted.
- Signup still requires the correct invite code from Vercel:
  VITE_SIGNUP_INVITE_CODE
- Existing users can still sign in normally without entering the signup code.

Vercel setup:
1. Delete or blank out VITE_ALLOWED_EMAIL if you want any email to be allowed.
2. Add this variable:
   VITE_SIGNUP_INVITE_CODE
3. Set its value to the code you want to give testers, for example:
   STRUCT2026
4. Redeploy after saving the variable.

Note:
This is a frontend invite-code gate. It is good for limiting casual tester signups. For stronger production-grade invite security, move invite validation into a backend/Firebase Cloud Function later.
