# Firebase Config Fallback

Replace this file:
- src/firebase.ts

Commit message:
Add Firebase config fallback

What changed:
- Uses Vercel environment variables first.
- If Vercel variables are missing or not being read correctly, it falls back to the Firebase config from your SimplifyStruct Firebase web app.
- This should fix auth/api-key-not-valid unless the key has been deleted or restricted in Google Cloud.

After replacing the file:
1. Commit it.
2. Push to main.
3. Wait for Vercel to redeploy.
4. Hard refresh the website.
5. Try signing in again.
