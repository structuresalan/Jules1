# Fix Firebase Login Loop

Replace these files:
- src/firebase.ts
- src/context/AuthContext.tsx

Commit message:
Fix Firebase login loop for tester accounts

What changed:
- Sets Firebase auth persistence to browser local persistence.
- Prevents a stale null auth-state event from immediately kicking a newly signed-in user back to /login.
- Keeps invite code required for account creation only.
- Existing users can sign in normally.
- Keeps sign out behavior working.

After replacing:
1. Commit and push.
2. Let Vercel redeploy.
3. Hard refresh the website.
4. Try signing in with the tester account again.
